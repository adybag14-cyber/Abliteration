#!/usr/bin/env python3
"""Factorize abliteration weight delta into low-rank LoRA tensors (PEFT-compatible keys)."""

import argparse
from pathlib import Path

import torch
from safetensors.torch import load_file, save_file

TARGET_SUFFIXES = ("o_proj", "down_proj")


def delta_lowrank(delta: torch.Tensor, rank: int) -> tuple[torch.Tensor, torch.Tensor]:
    u, s, vh = torch.linalg.svd(delta.float(), full_matrices=False)
    r = min(rank, s.shape[0])
    u, s, vh = u[:, :r], s[:r], vh[:r, :]
    scale = torch.sqrt(s)
    lora_b = u * scale.unsqueeze(0)
    lora_a = scale.unsqueeze(1) * vh
    return lora_b.cpu(), lora_a.cpu()


def load_sharded(model_dir: Path) -> dict[str, torch.Tensor]:
    sd: dict[str, torch.Tensor] = {}
    for path in sorted(model_dir.glob("*.safetensors")):
        sd.update(load_file(path))
    if not sd:
        raise FileNotFoundError(f"No .safetensors in {model_dir}")
    return sd


def collect_deltas(base_dir: Path, ablit_dir: Path) -> dict[str, torch.Tensor]:
    base_sd = load_sharded(base_dir)
    ablit_sd = load_sharded(ablit_dir)
    deltas: dict[str, torch.Tensor] = {}
    for key, w_base in base_sd.items():
        if not any(key.endswith(suffix) for suffix in TARGET_SUFFIXES):
            continue
        if key not in ablit_sd:
            continue
        deltas[key] = (ablit_sd[key].float() - w_base.float()).cpu()
    if not deltas:
        raise RuntimeError("No o_proj/down_proj deltas found — check paths and abliteration targets")
    return deltas


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--base", required=True, help="Original model directory (safetensors)")
    ap.add_argument("--abliterated", required=True, help="Abliterated model directory")
    ap.add_argument("--out", required=True, help="Output directory for adapter_model.safetensors")
    ap.add_argument("--rank", type=int, default=16, help="LoRA rank (default 16)")
    ap.add_argument("--dtype", choices=("bf16", "fp16", "fp32"), default="bf16")
    args = ap.parse_args()

    dtype_map = {
        "bf16": torch.bfloat16,
        "fp16": torch.float16,
        "fp32": torch.float32,
    }
    out_dtype = dtype_map[args.dtype]

    deltas = collect_deltas(Path(args.base), Path(args.abliterated))
    adapter_sd: dict[str, torch.Tensor] = {}
    for key, delta in deltas.items():
        lora_b, lora_a = delta_lowrank(delta, args.rank)
        adapter_sd[f"base_model.model.{key}.lora_B.weight"] = lora_b.to(out_dtype)
        adapter_sd[f"base_model.model.{key}.lora_A.weight"] = lora_a.to(out_dtype)

    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)
    save_file(adapter_sd, out / "adapter_model.safetensors")
    print(f"Exported {len(deltas)} modules at rank {args.rank} -> {out / 'adapter_model.safetensors'}")


if __name__ == "__main__":
    main()