#!/usr/bin/env python3
"""Inference-time residual ablation (reversible). --self-test needs no model.

With transformers installed:
  python scripts/inference-hook-ablation.py --model ./base --direction r.pt \\
      --prompt "List USB devices on this bench PC."
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

from abliteration_math import inference_ablate, unit  # noqa: E402


def self_test() -> int:
    torch.manual_seed(2)
    r = unit(torch.tensor([1.0, 0.0, 0.0, 0.0]))
    h = torch.tensor([[2.0, 3.0, 4.0, 5.0]])
    h2 = inference_ablate(h, r, alpha=1.0)
    if abs(float(h2[0, 0])) > 1e-6:
        print(f"FAIL first component {h2[0, 0]}")
        return 1
    if not torch.allclose(h2[0, 1:], h[0, 1:]):
        print("FAIL orthogonal components changed")
        return 1
    print(json.dumps({"ok": True, "h_prime": h2.squeeze().tolist()}))
    return 0


def run_model(model_path: str, direction: Path, prompt: str, layers: str, alpha: float) -> int:
    from transformers import AutoModelForCausalLM, AutoTokenizer

    r = torch.load(direction, map_location="cpu", weights_only=True)
    if isinstance(r, dict):
        r = r.get("direction", next(iter(r.values())))
    r = torch.as_tensor(r).float()
    if r.ndim == 2:
        r = r[0]

    tok = AutoTokenizer.from_pretrained(model_path, trust_remote_code=True)
    model = AutoModelForCausalLM.from_pretrained(
        model_path, torch_dtype=torch.float16, device_map="auto", trust_remote_code=True
    )
    want = None
    if layers:
        want = {int(x) for x in layers.split(",") if x.strip()}

    handles = []

    def hook_factory(_idx: int):
        def hook(_mod, _inp, out):
            hidden = out[0] if isinstance(out, tuple) else out
            hidden = inference_ablate(hidden, r.to(hidden.device), alpha)
            if isinstance(out, tuple):
                return (hidden,) + out[1:]
            return hidden

        return hook

    for i, block in enumerate(model.model.layers):
        if want is not None and i not in want:
            continue
        handles.append(block.register_forward_hook(hook_factory(i)))

    ids = tok(prompt, return_tensors="pt").to(model.device)
    with torch.no_grad():
        out = model.generate(**ids, max_new_tokens=128)
    print(tok.decode(out[0], skip_special_tokens=True))
    for h in handles:
        h.remove()
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(description="Hook-based directional ablation")
    ap.add_argument("--model", help="HF model id or path")
    ap.add_argument("--direction", type=Path)
    ap.add_argument("--prompt", default="")
    ap.add_argument("--layers", default="", help="comma layer indices; default=all")
    ap.add_argument("--alpha", type=float, default=1.0)
    ap.add_argument("--self-test", action="store_true")
    args = ap.parse_args()
    if args.self_test:
        return self_test()
    if not args.model or not args.direction:
        ap.error("--model and --direction required unless --self-test")
    return run_model(args.model, args.direction, args.prompt, args.layers, args.alpha)


if __name__ == "__main__":
    raise SystemExit(main())
