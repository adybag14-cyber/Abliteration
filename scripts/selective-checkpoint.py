#!/usr/bin/env python3
"""Inspect, plan, apply, and independently verify a selected-tensor checkpoint edit."""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from checkpoint_tools import inventory, parse_layers, plan, sha256, tensor_digest, write_candidate


def verify(base: Path, candidate: Path) -> dict:
    from safetensors.torch import load_file
    before, after = inventory(base), inventory(candidate)
    manifest = json.loads((candidate / "edit-manifest.json").read_text(encoding="utf-8"))
    expected_plan = plan(base, manifest["plan"]["layers"], manifest["plan"]["modules"])
    for key, value in expected_plan.items():
        if key != "checkpoint" and manifest["plan"].get(key) != value:
            raise ValueError(f"manifest selection disagrees with the source inventory: {key}")
    if before["tensors"] != after["tensors"] or set(manifest["tensors"]) != set(before["tensors"]):
        raise ValueError("tensor names, storage, shapes, dtypes, or manifest coverage differ")
    selected = set(manifest["plan"]["selected_tensors"])
    changed, untouched = [], 0
    for shard in before["shards"]:
        expected = manifest["shards"][shard]
        if sha256(base / shard) != expected["before_sha256"] or sha256(candidate / shard) != expected["after_sha256"]:
            raise ValueError(f"shard digest mismatch: {shard}")
        b, a = load_file(str(base / shard)), load_file(str(candidate / shard))
        for name in b:
            bh, ah = tensor_digest(b[name]), tensor_digest(a[name])
            record = manifest["tensors"][name]
            if bh != record["before_sha256"] or ah != record["after_sha256"]:
                raise ValueError(f"tensor digest mismatch: {name}")
            if bh != ah:
                if name not in selected:
                    raise ValueError(f"unselected tensor changed: {name}")
                changed.append(name)
            elif name not in selected:
                untouched += 1
        del b, a
    return {"verified": True, "changed_tensors": changed, "unselected_tensors_identical": untouched, "selected_tensors": len(selected), "total_tensors": len(before["tensors"])}


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest="command", required=True)
    inspect = sub.add_parser("inspect", help="Read tensor metadata without loading model weights")
    inspect.add_argument("--model", type=Path, required=True)
    for command in ["plan", "apply"]:
        p = sub.add_parser(command)
        p.add_argument("--model", type=Path, required=True)
        p.add_argument("--layers", required=True, help="zero-based indices, e.g. 10,12-14")
        p.add_argument("--modules", default="o_proj,down_proj", help="o_proj and/or down_proj")
        if command == "plan":
            p.add_argument("--output", type=Path)
        else:
            p.add_argument("--direction", type=Path, required=True)
            p.add_argument("--mode", choices=["arditi", "projected", "orba-directional", "orba-householder", "subspace", "norm-preserving"], default="projected")
            p.add_argument("--alpha", type=float, default=1.0)
            p.add_argument("--output", type=Path, required=True)
    v = sub.add_parser("verify")
    v.add_argument("--base", type=Path, required=True)
    v.add_argument("--candidate", type=Path, required=True)
    args = parser.parse_args()
    try:
        if args.command == "inspect":
            result = inventory(args.model)
        elif args.command == "verify":
            result = verify(args.base, args.candidate)
        else:
            selection = plan(args.model, parse_layers(args.layers), args.modules.split(","))
            if args.command == "plan":
                result = selection
                if args.output:
                    args.output.parent.mkdir(parents=True, exist_ok=True)
                    with args.output.open("x", encoding="utf-8") as f:
                        f.write(json.dumps(result, indent=2) + "\n")
            else:
                import torch
                from abliteration_math import apply_mode
                directions = torch.load(args.direction, map_location="cpu", weights_only=True)
                def transform(name, tensor):
                    if isinstance(directions, dict):
                        layer = str(selection["selected_tensors"][name]["layer"])
                        if layer not in directions:
                            raise ValueError(f"missing direction for layer {layer}")
                        direction = directions[layer]
                    else:
                        direction = directions
                    return apply_mode(tensor, direction, args.mode, args.alpha)
                report = write_candidate(args.model, args.output, selection, transform, provenance={"operation": "selected-output-projection", "mode": args.mode, "alpha": args.alpha, "direction_sha256": sha256(args.direction)})
                result = {"output": str(args.output.resolve()), "selected_tensors": len(selection["selected_tensors"]), "changed_tensors": report["changed_tensor_count"], "unselected_tensors_identical": report["unselected_tensors_identical"]}
        print(json.dumps(result, indent=2))
        return 0
    except (ValueError, OSError, KeyError, RuntimeError, TypeError) as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
