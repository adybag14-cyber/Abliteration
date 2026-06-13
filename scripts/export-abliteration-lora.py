#!/usr/bin/env python3
"""Factorize abliteration weight delta into low-rank safetensors (PEFT-compatible keys)."""
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


def load_sharded_dict(model_dir: Path) -> dict[str, torch.Tensor]:
    sd: dict[str, torch.Tensor] = {}
    shards = sorted(model_dir.glob("*.safetensors"))
    if not shards:
        raise FileNotFoundError(f"No safetensors in {model_dir}")
    for path in shards:
        sd.update(load_file(path))
    return sd


def collect_deltas(base_path: Path, ablit_path: Path) -> dict[str, torch.Tensor]:
    base_sd = load_sharded_dict(base_path)
    ablit_sd = load_sharded_dict(ablit_path)
    deltas = {}
    for key, w_base in base_sd.items():
        if not any(key.endswith(s) for s in TARGET_SUFFIXES):
            continue
        if key not in ablit_sd:
            continue
        deltas[key] = (ablit_sd[key].float() - w_base.float()).cpu()
    return deltas


def main() -> None:
    ap = argparse.ArgumentParser(description="Export abliteration delta as LoRA safetensors")
    ap.add_argument("--base", required=True, help="Original HF model directory")
    ap.add_argument("--abliterated", required=True, help="Abliterated HF model directory")
    ap.add_argument("--out", required=True, help="Output adapter directory")
    ap.add_argument("--rank", type=int, default=16)
    args = ap.parse_args()

    deltas = collect_deltas(Path(args.base), Path(args.abliterated))
    if not deltas:
        raise SystemExit("No o_proj/down_proj deltas found — check paths and module names")

    adapter_sd: dict[str, torch.Tensor] = {}
    errors = []
    for key, delta in deltas.items():
        lb, la = delta_lowrank(delta, args.rank)
        recon = lb @ la
        rel_err = (delta - recon).norm() / delta.norm().clamp(min=1e-8)
        if rel_err > 0.15:
            errors.append((key, float(rel_err)))
        adapter_sd[f"{key}.lora_B"] = lb.to(torch.bfloat16)
        adapter_sd[f"{key}.lora_A"] = la.to(torch.bfloat16)

    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)
    save_file(adapter_sd, out / "adapter_model.safetensors")

    print(f"Wrote {len(deltas)} module deltas, rank={args.rank} -> {out}")
    if errors:
        print(f"Warning: {len(errors)} modules with rel_err > 0.15 — try higher --rank")
        for k, e in errors[:5]:
            print(f"  {k}: {e:.3f}")


if __name__ == "__main__":
    main()