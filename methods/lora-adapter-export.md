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

## Export script (in repo)

```bash
python scripts/export-abliteration-lora.py \
  --base ./models/Qwen3-4B-ORIGINAL \
  --abliterated ./models/Qwen3-4B-abliterated \
  --out ./adapters/abliteration-r16 \
  --rank 16
```

Writes `adapter_model.safetensors` with `{module}.lora_A` / `{module}.lora_B` keys for each `o_proj` / `down_proj` delta.

**GGUF sidecar:** `convert_lora_to_gguf.py` → [gguf-export-notes.md](gguf-export-notes.md)

**Alternative:** community abliteration LoRA checkpoints (train/export refusal removal as adapter): [grimjim/Llama-3-Instruct-abliteration-LoRA-8B](https://huggingface.co/grimjim/Llama-3-Instruct-abliteration-LoRA-8B)

> Align `target_modules` with your abliteration recipe if wrapping in full PEFT `LoraConfig`.

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