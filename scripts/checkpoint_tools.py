"""Selective, auditable edits of local floating-point safetensors checkpoints.

Storage shards are not the unit of selection: exact tensor names are. Importing
this module and inspecting/planning a checkpoint needs only the standard library.
"""
from __future__ import annotations

import hashlib
import json
import math
import re
import shutil
import struct
import tempfile
from pathlib import Path

LAYER_KEY = re.compile(r"^model\.layers\.(\d+)\.(self_attn\.(o_proj)|mlp\.(down_proj))\.weight$")
DTYPE_BYTES = {"F64": 8, "F32": 4, "F16": 2, "BF16": 2, "I64": 8, "I32": 4, "I16": 2, "I8": 1, "U8": 1, "BOOL": 1}
SIDECAR_SUFFIXES = {".json", ".model", ".txt", ".jinja", ".tiktoken"}
MAX_HEADER_BYTES = 16 * 1024 * 1024


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(4 * 1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def unique_object(pairs):
    result = {}
    for key, value in pairs:
        if key in result:
            raise ValueError(f"duplicate JSON key: {key}")
        result[key] = value
    return result


def read_header(path: Path) -> dict:
    size = path.stat().st_size
    with path.open("rb") as handle:
        raw = handle.read(8)
        if len(raw) != 8:
            raise ValueError(f"truncated safetensors header: {path.name}")
        length = struct.unpack("<Q", raw)[0]
        if not 2 <= length <= MAX_HEADER_BYTES or length + 8 > size:
            raise ValueError(f"invalid safetensors header length: {path.name}")
        header = json.loads(handle.read(length), object_pairs_hook=unique_object)
    if not isinstance(header, dict):
        raise ValueError("safetensors header must be an object")
    intervals = []
    for key, entry in header.items():
        if key == "__metadata__":
            continue
        shape, dtype, offsets = entry.get("shape"), entry.get("dtype"), entry.get("data_offsets")
        if not isinstance(shape, list) or any(type(x) is not int or x < 0 for x in shape):
            raise ValueError(f"invalid shape: {key}")
        if dtype not in DTYPE_BYTES:
            raise ValueError(f"unsupported dtype {dtype}: dequantize before editing")
        if not isinstance(offsets, list) or len(offsets) != 2 or any(type(x) is not int for x in offsets):
            raise ValueError(f"invalid offsets: {key}")
        start, end = offsets
        if start < 0 or end < start or end > size - 8 - length or end - start != math.prod(shape) * DTYPE_BYTES[dtype]:
            raise ValueError(f"invalid byte range: {key}")
        intervals.append((start, end))
    cursor = 0
    for start, end in sorted(intervals):
        if start != cursor:
            raise ValueError(f"overlapping or non-contiguous tensor payload: {path.name}")
        cursor = end
    if cursor != size - 8 - length:
        raise ValueError(f"unaccounted safetensors payload: {path.name}")
    return header


def inventory(directory: Path) -> dict:
    directory = directory.resolve(strict=True)
    shards = sorted(directory.glob("*.safetensors"))
    if not shards:
        raise ValueError("no safetensors checkpoint shards found")
    tensors, headers = {}, {}
    for shard in shards:
        if shard.is_symlink() and not shard.resolve().is_file():
            raise ValueError(f"broken shard: {shard.name}")
        header = read_header(shard)
        headers[shard.name] = header
        for name, entry in header.items():
            if name == "__metadata__":
                continue
            if name in tensors:
                raise ValueError(f"tensor occurs in multiple shards: {name}")
            match = LAYER_KEY.fullmatch(name)
            tensors[name] = {"shard": shard.name, "shape": entry["shape"], "dtype": entry["dtype"], "parameters": math.prod(entry["shape"]), "layer": int(match[1]) if match else None, "module": (match[3] or match[4]) if match else None}
    index = directory / "model.safetensors.index.json"
    if index.exists():
        weights = json.loads(index.read_text(encoding="utf-8"), object_pairs_hook=unique_object).get("weight_map")
        actual = {name: item["shard"] for name, item in tensors.items()}
        if weights != actual:
            raise ValueError("safetensors index does not exactly match shard contents")
    return {"directory": str(directory), "shards": [s.name for s in shards], "tensors": tensors, "total_parameters": sum(t["parameters"] for t in tensors.values())}


def parse_layers(value: str) -> list[int]:
    result = set()
    if not value or len(value) > 4096:
        raise ValueError("layers must be a nonempty comma-separated list/range")
    for part in value.split(","):
        if not re.fullmatch(r"\d+(?:-\d+)?", part):
            raise ValueError(f"invalid layer selection: {part}")
        bounds = [int(x) for x in part.split("-")]
        lo, hi = bounds[0], bounds[-1]
        if lo > hi or hi > 4095:
            raise ValueError("layer bounds must satisfy 0 <= start <= end <= 4095")
        result.update(range(lo, hi + 1))
    return sorted(result)


def plan(directory: Path, layers: list[int], modules: list[str]) -> dict:
    info = inventory(directory)
    if not layers or any(type(x) is not int or x < 0 for x in layers) or len(set(layers)) != len(layers):
        raise ValueError("select distinct non-negative layer indices")
    if not modules or len(set(modules)) != len(modules) or not set(modules) <= {"o_proj", "down_proj"}:
        raise ValueError("modules must be distinct o_proj and/or down_proj")
    selected = {k: t for k, t in info["tensors"].items() if t["layer"] in layers and t["module"] in modules}
    if len(selected) != len(layers) * len(modules):
        raise ValueError("selection does not resolve exactly once per layer/module; only dense Llama-layout checkpoints are supported")
    for name, t in selected.items():
        if len(t["shape"]) != 2 or t["dtype"] not in {"F32", "F16", "BF16"}:
            raise ValueError(f"selected tensor must be a floating-point matrix: {name}")
    count = sum(t["parameters"] for t in selected.values())
    return {"schema_version": 1, "checkpoint": str(directory.resolve()), "layers": sorted(layers), "modules": sorted(modules), "tensor_count": len(info["tensors"]), "shard_count": len(info["shards"]), "total_parameters": info["total_parameters"], "selected_parameters": count, "selected_parameter_fraction": count / info["total_parameters"], "selected_tensors": selected, "selected_shards": sorted({t["shard"] for t in selected.values()})}


def tensor_digest(tensor) -> str:
    import torch
    return hashlib.sha256(tensor.detach().cpu().contiguous().view(torch.uint8).numpy().tobytes()).hexdigest()


def write_candidate(directory: Path, output: Path, selection: dict, transform, *, provenance: dict) -> dict:
    """Write a new checkpoint atomically; never overwrite or modify the source.

    transform(name, tensor) may only change selected tensors. Every tensor gets
    before/after digests; unchanged shards are copied byte-for-byte.
    """
    from safetensors import safe_open
    from safetensors.torch import load_file, save_file
    import torch
    directory = directory.resolve(strict=True)
    output = output.resolve()
    if output.exists() or output == directory or directory in output.parents:
        raise ValueError("output must be a new directory outside the source checkpoint")
    current = plan(directory, selection["layers"], selection["modules"])
    if current != selection:
        raise ValueError("checkpoint inventory changed after planning")
    output.parent.mkdir(parents=True, exist_ok=True)
    staging = Path(tempfile.mkdtemp(prefix=f".{output.name}-", dir=output.parent))
    report = {"schema_version": 1, "plan": selection, "provenance": provenance, "shards": {}, "tensors": {}}
    try:
        for shard_name in inventory(directory)["shards"]:
            src = directory / shard_name
            source_hash = sha256(src)
            sd = load_file(str(src), device="cpu")
            with safe_open(str(src), framework="pt", device="cpu") as f:
                metadata = f.metadata()
            changed = False
            for name, tensor in sd.items():
                before = tensor_digest(tensor)
                if name in selection["selected_tensors"]:
                    candidate = transform(name, tensor)
                    if candidate.shape != tensor.shape or candidate.dtype != tensor.dtype or not torch.isfinite(candidate).all():
                        raise ValueError(f"invalid transformed tensor: {name}")
                    sd[name] = candidate.contiguous()
                    changed = True
                after = tensor_digest(sd[name])
                report["tensors"][name] = {"selected": name in selection["selected_tensors"], "before_sha256": before, "after_sha256": after, "changed": before != after}
            dest = staging / shard_name
            if changed:
                save_file(sd, str(dest), metadata=metadata)
            else:
                shutil.copyfile(src, dest)
            del sd
            if sha256(src) != source_hash:
                raise ValueError("source checkpoint changed during export")
            report["shards"][shard_name] = {"before_sha256": source_hash, "after_sha256": sha256(dest)}
        for src in directory.iterdir():
            if src.is_file() and src.suffix in SIDECAR_SUFFIXES:
                shutil.copyfile(src, staging / src.name)
        inventory(staging)
        report["changed_tensor_count"] = sum(t["changed"] for t in report["tensors"].values())
        report["unselected_tensors_identical"] = all(not t["changed"] for t in report["tensors"].values() if not t["selected"])
        (staging / "edit-manifest.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
        staging.rename(output)
        return report
    except BaseException:
        # staging was exclusively created here, resolved beneath output.parent.
        if staging.parent.resolve() == output.parent and staging.is_dir():
            shutil.rmtree(staging)
        raise
