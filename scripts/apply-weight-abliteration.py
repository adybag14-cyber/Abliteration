#!/usr/bin/env python3
"""Project refusal direction(s) out of down_proj / o_proj safetensors.

Examples:
  python scripts/apply-weight-abliteration.py --self-test
  python scripts/apply-weight-abliteration.py --mode projected \\
      --weights ./base-model --direction r.pt --out ./abliterated
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

from abliteration_math import apply_mode, is_target_key  # noqa: E402


def load_direction(path: Path) -> torch.Tensor:
    obj = torch.load(path, map_location="cpu", weights_only=True)
    if isinstance(obj, dict):
        obj = obj.get("direction", obj.get("r", next(iter(obj.values()))))
    return torch.as_tensor(obj).float()


def iter_shards(model_dir: Path) -> list[Path]:
    shards = sorted(model_dir.glob("*.safetensors"))
    if not shards:
        raise FileNotFoundError(f"no .safetensors in {model_dir}")
    return shards


def self_test() -> int:
    torch.manual_seed(1)
    d_out, d_in = 16, 32
    r = torch.zeros(d_out)
    r[0] = 1.0
    w = torch.randn(d_out, d_in)
    w_abl = apply_mode(w, r, "orba-directional", alpha=1.0)
    leftover = float((w_abl[0] - 0).norm())
    # output row 0 is the r-direction: should be ~0
    if leftover > 1e-4:
        # more precise: rᵀ W' ≈ 0
        resid = float((r @ w_abl).norm())
        if resid > 1e-4:
            print(f"FAIL residual {resid}")
            return 1
    resid = float((r @ apply_mode(w, r, "arditi", 1.0)).norm())
    hh = apply_mode(w, r, "orba-householder", 1.0)
    # Householder flips: rᵀ H W ≈ − rᵀ W
    if float((r @ hh + r @ w).norm()) > 1e-4:
        print("FAIL householder not a reflection")
        return 1
    R = torch.stack([r, torch.nn.functional.normalize(torch.randn(d_out), dim=0)])
    w_sub = apply_mode(w, R, "subspace", 1.0)
    if float((R[0] @ w_sub).norm()) > 1e-3:
        print("FAIL subspace")
        return 1
    print(json.dumps({"ok": True, "arditi_resid": resid, "householder_ok": True}))
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(description="Bake refusal direction into Linear weights")
    ap.add_argument("--weights", type=Path, help="HF model directory of safetensors")
    ap.add_argument("--direction", type=Path, help="r.pt from estimate-refusal-direction.py")
    ap.add_argument("--out", type=Path, help="output directory")
    ap.add_argument(
        "--mode",
        default="projected",
        choices=("arditi", "projected", "orba-directional", "orba-householder", "subspace"),
    )
    ap.add_argument("--alpha", type=float, default=1.0)
    ap.add_argument("--self-test", action="store_true")
    args = ap.parse_args()

    if args.self_test:
        return self_test()
    if not args.weights or not args.direction or not args.out:
        ap.error("--weights --direction --out required unless --self-test")

    try:
        from safetensors.torch import load_file, save_file
    except ImportError:
        print("safetensors is required for baking: pip install safetensors")
        return 2

    r = load_direction(args.direction)
    args.out.mkdir(parents=True, exist_ok=True)
    n = 0
    for shard in iter_shards(args.weights):
        sd = load_file(shard)
        out_sd = {}
        for k, w in sd.items():
            if is_target_key(k):
                out_sd[k] = apply_mode(w, r, args.mode, args.alpha)
                n += 1
            else:
                out_sd[k] = w
        save_file(out_sd, args.out / shard.name)
    # copy sidecar json if present
    for name in ("config.json", "generation_config.json", "tokenizer.json", "tokenizer_config.json"):
        src = args.weights / name
        if src.exists():
            (args.out / name).write_bytes(src.read_bytes())
    print(f"projected {n} tensors → {args.out} mode={args.mode} alpha={args.alpha}")
    if n == 0:
        print("warning: no down_proj/o_proj keys — check architecture names")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
