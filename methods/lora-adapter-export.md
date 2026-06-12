# LoRA adapter export from abliteration

Convert a **full abliteration** (or manual projection) into a **PEFT LoRA adapter** for low-VRAM inference and OTA updates.

## When to use

- Base model stays frozen on disk (one copy for many policies)
- Target machine has **8 GB VRAM** — run `4-bit base + adapter`
- You abliterated on a cloud GPU but deploy to factory benches with limited RAM

## Prerequisites

- Base model safetensors (original, pre-abliteration)
- Abliterated model safetensors (Heretic output or `sharded_ablate.py`)
- Python 3.10+, `torch`, `peft`, `safetensors`, `transformers`

```bash
pip install torch transformers peft safetensors accelerate
```

## Algorithm

For each target module (match Heretic: `o_proj`, `down_proj` per layer):

```
ΔW = W_abliterated - W_base
ΔW ≈ B @ A   with A ∈ R^{r×in}, B ∈ R^{out×r}
```

Use **truncated SVD** on ΔW (float32 on CPU for numerical stability). Store as LoRA `(lora_A, lora_B)` with scaling `α/r`.

## Reference script (sketch)

Save as `scripts/export-abliteration-lora.py` or run inline:

```python
#!/usr/bin/env python3
"""Factorize abliteration delta into PEFT LoRA per layer. Authorized research use."""
import argparse
from pathlib import Path

import torch
from peft import LoraConfig, get_peft_model
from safetensors.torch import load_file, save_file
from transformers import AutoModelForCausalLM


TARGET_SUFFIXES = ("o_proj", "down_proj")


def delta_lowrank(delta: torch.Tensor, rank: int) -> tuple[torch.Tensor, torch.Tensor]:
    """Return (lora_B, lora_A) so delta ≈ lora_B @ lora_A."""
    u, s, vh = torch.linalg.svd(delta.float(), full_matrices=False)
    r = min(rank, s.shape[0])
    u, s, vh = u[:, :r], s[:r], vh[:r, :]
    # B = U @ diag(sqrt(s)), A = diag(sqrt(s)) @ Vh
    scale = torch.sqrt(s)
    lora_b = u * scale.unsqueeze(0)
    lora_a = scale.unsqueeze(1) * vh
    return lora_b.cpu(), lora_a.cpu()


def collect_deltas(base_path: Path, ablit_path: Path) -> dict[str, torch.Tensor]:
    base_shards = sorted(base_path.glob("*.safetensors"))
    ablit_shards = sorted(ablit_path.glob("*.safetensors"))
    base_sd, ablit_sd = {}, {}
    for p in base_shards:
        base_sd.update(load_file(p))
    for p in ablit_shards:
        ablit_sd.update(load_file(p))
    deltas = {}
    for key, w_base in base_sd.items():
        if not any(key.endswith(s) for s in TARGET_SUFFIXES):
            continue
        if key not in ablit_sd:
            continue
        deltas[key] = (ablit_sd[key].float() - w_base.float()).cpu()
    return deltas


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--base", required=True, help="Original model directory")
    ap.add_argument("--abliterated", required=True, help="Abliterated model directory")
    ap.add_argument("--out", required=True, help="Output adapter directory")
    ap.add_argument("--rank", type=int, default=16)
    args = ap.parse_args()

    deltas = collect_deltas(Path(args.base), Path(args.abliterated))
    adapter_sd = {}
    for key, delta in deltas.items():
        lb, la = delta_lowrank(delta, args.rank)
        adapter_sd[f"{key}.lora_B"] = lb.to(torch.bfloat16)
        adapter_sd[f"{key}.lora_A"] = la.to(torch.bfloat16)

    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)
    save_file(adapter_sd, out / "adapter_model.safetensors")
    print(f"Wrote {len(deltas)} module deltas, rank={args.rank} -> {out}")


if __name__ == "__main__":
    main()
```

> **Note:** Production adapters should use PEFT's `save_pretrained` with `LoraConfig` targeting `q_proj`/`v_proj` only if you ablated attention MLP paths differently. Align `target_modules` with your abliteration recipe.

## Load at inference (4-bit + adapter)

```python
from transformers import AutoModelForCausalLM, BitsAndBytesConfig
from peft import PeftModel

bnb = BitsAndBytesConfig(load_in_4bit=True, bnb_4bit_compute_dtype=torch.bfloat16)
base = AutoModelForCausalLM.from_pretrained(
    "./base-model",
    quantization_config=bnb,
    device_map="auto",
)
model = PeftModel.from_pretrained(base, "./abliteration-lora")
```

Or merge for GGUF:

```python
merged = model.merge_and_unload()
merged.save_pretrained("./merged-abliterated")
```

Then [gguf-export-notes.md](gguf-export-notes.md).

## Quality checks

| Check | Pass criteria |
|-------|---------------|
| Reconstruction error | `‖ΔW - BA‖_F / ‖ΔW‖_F < 0.05` per layer (tune rank if higher) |
| Refusal eval | Same harmful set as full abliteration — ≤2% refusal delta |
| KL / harmless | Within 0.05 of full-weight abliteration |
| Rank sweep | Try r ∈ {8, 16, 32, 64}; pick smallest r that passes eval |

## Heretic shortcut

If you used `row_normalization = "full"`, Heretic may already emit LoRA-like correction tensors in the checkpoint. Inspect shard keys for `lora` before re-factorizing.

```bash
python -c "
from safetensors import safe_open
with safe_open('model.safetensors', framework='pt') as f:
    print([k for k in f.keys() if 'lora' in k.lower()][:20])
"
```

## Related

- [../techniques/lora-qlora-abliteration.md](../techniques/lora-qlora-abliteration.md)
- [../instructions/low-vram-abliteration.md](../instructions/low-vram-abliteration.md)
- [automated-heretic-search.md](automated-heretic-search.md)