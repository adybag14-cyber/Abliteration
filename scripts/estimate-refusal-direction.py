#!/usr/bin/env python3
"""Estimate a refusal direction from activation caches or synthetic clouds.

Examples:
  python scripts/estimate-refusal-direction.py --mode dim --self-test
  python scripts/estimate-refusal-direction.py --mode svd --rank 4 \\
      --bad bad.pt --good good.pt --out r.pt
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

import torch

ROOT = Path(__file__).resolve().parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from abliteration_math import (  # noqa: E402
    cosmic_layer_score,
    mean_difference,
    projected_direction,
    svd_directions,
)


def load_matrix(path: Path) -> torch.Tensor:
    obj = torch.load(path, map_location="cpu", weights_only=True)
    if isinstance(obj, dict):
        if "activations" in obj:
            obj = obj["activations"]
        else:
            obj = next(iter(obj.values()))
    t = torch.as_tensor(obj).float()
    if t.ndim == 1:
        t = t.unsqueeze(0)
    if t.ndim != 2:
        raise ValueError(f"{path}: expected 2-D activations, got {tuple(t.shape)}")
    return t


def self_test() -> int:
    torch.manual_seed(0)
    d = 32
    r_true = torch.zeros(d)
    r_true[0] = 1.0
    h_bad = torch.randn(40, d) + 2.0 * r_true
    h_good = torch.randn(40, d)
    r_dim = mean_difference(h_bad, h_good)
    r_proj = projected_direction(h_bad, h_good)
    r_svd = svd_directions(h_bad, h_good, rank=3)
    score = cosmic_layer_score(h_bad, h_good)
    align = float(torch.dot(r_dim, r_true).abs())
    if align < 0.8:
        print(f"FAIL dim alignment {align:.3f}")
        return 1
    if r_svd.shape != (3, d):
        print(f"FAIL svd shape {tuple(r_svd.shape)}")
        return 1
    if score <= 0:
        print(f"FAIL cosmic score {score}")
        return 1
    print(
        json.dumps(
            {
                "ok": True,
                "dim_align": round(align, 4),
                "proj_align": round(float(torch.dot(r_proj, r_true).abs()), 4),
                "cosmic": round(score, 4),
                "svd_rank": r_svd.shape[0],
            }
        )
    )
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(description="Estimate refusal direction(s)")
    ap.add_argument("--mode", choices=("dim", "projected", "cosmic", "svd"), default="dim")
    ap.add_argument("--bad", type=Path, help="Tensor file of harmful/false-refuse activations [n,d]")
    ap.add_argument("--good", type=Path, help="Tensor file of harmless activations [n,d]")
    ap.add_argument("--out", type=Path, default=Path("r.pt"))
    ap.add_argument("--rank", type=int, default=4)
    ap.add_argument("--self-test", action="store_true")
    args = ap.parse_args()

    if args.self_test:
        return self_test()
    if not args.bad or not args.good:
        ap.error("--bad and --good are required unless --self-test")

    h_bad, h_good = load_matrix(args.bad), load_matrix(args.good)
    if args.mode == "dim":
        r = mean_difference(h_bad, h_good)
    elif args.mode == "projected":
        r = projected_direction(h_bad, h_good)
    elif args.mode == "cosmic":
        print(json.dumps({"cosmic_score": cosmic_layer_score(h_bad, h_good)}))
        r = mean_difference(h_bad, h_good)
    else:
        r = svd_directions(h_bad, h_good, args.rank)

    args.out.parent.mkdir(parents=True, exist_ok=True)
    torch.save(r, args.out)
    print(f"wrote {args.out} shape={tuple(r.shape)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
