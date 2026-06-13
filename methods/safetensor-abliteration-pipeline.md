# Safetensor abliteration pipeline

How alignment refusal directions are **removed from Hugging Face checkpoint files** (`*.safetensors`) — the correct surgery surface.

---

## Target tensors

| Module | Tensor | Architectures |
|--------|--------|---------------|
| MLP block | `model.layers.{L}.mlp.down_proj.weight` | Llama, Mistral, Qwen dense |
| Attention | `model.layers.{L}.self_attn.o_proj.weight` | Same |
| MoE expert | `...experts.{E}.down_proj.weight` | Qwen3-MoE, Phi-3.5-MoE, Mixtral |
| Granite hybrid | `shared_mlp.output_linear`, expert `output_linear` | IBM Granite MoE |

Heretic discovers layer kernel automatically. llm-abliteration uses YAML per destination layer.

---

## Math (applied in-place on weights)

**Projected direction** (Heretic default, `orthogonalize_direction = true`):

```
g = normalize(mean(h_harmless))
r = normalize(mean(h_harmful) - mean(h_harmless))
r_proj = normalize(r - (r·g)g)
W' = W - λ · outer(r_proj, r_proj @ W)   # on down_proj / o_proj rows
```

**Norm-preserving** (`row_normalization = "full"`): approximate row magnitude restoration via rank-r LoRA correction bundled in output shards.

→ [../techniques/projected-norm-preserving-abliteration.md](../techniques/projected-norm-preserving-abliteration.md)

---

## Pipeline A — Heretic (automatic)

```bash
pip install -U heretic-llm bitsandbytes accelerate safetensors
cp sources/heretic-tools/config.production.toml config.toml
heretic ./models/Qwen3-4B-Instruct-2507
```

**On completion**, choose save path — writes standard HF layout:

```
out/
├── config.json
├── model.safetensors          # or sharded model-00001-of-00004.safetensors
├── tokenizer.json
├── generation_config.json
└── (optional lora_* keys if row_normalization=full)
```

**Backup rule:** copy source to `*-ORIGINAL` before run. Never overwrite original shards.

---

## Pipeline B — llm-abliteration (manual)

```bash
python measure.py -m ./base -o directions.pt --quant 4bit --projected
python analyze.py directions.pt -c
python sharded_ablate.py my-model.yml --projected --normpreserve
```

`sharded_ablate.py` reads **full-precision** safetensors one shard at a time, writes new safetensors to output dir.

**Critical:** 4-bit quantized checkpoints are for measurement only. Ablation mutates FP16/BF16 weights.

---

## Pipeline C — Hook prototype (no safetensor edit)

TransformerLens / HF hooks subtract `(h·r)r` at inference — produces `direction.pt` only.

Use to validate prompts before permanent edit:

→ [residual-hook-ablation.md](residual-hook-ablation.md) · [../instructions/quickstart.md](../instructions/quickstart.md)

---

## Verification before GGUF export

```bash
# Spot-check shard keys unchanged count
python -c "
from safetensors import safe_open
for p in ['ORIGINAL/model.safetensors','ABLITERATED/model.safetensors']:
    with safe_open(p, framework='pt') as f:
        print(p, len(f.keys()))
"

# Heretic built-in
heretic --evaluate-model ./ABLITERATED
```

| Check | Pass |
|-------|------|
| Shard count / keys | Same keys as base (values differ on target modules) |
| Refusal rate harmful set | Down vs original |
| KL harmless set | Heretic target ~0.01–0.5 depending on deploy |
| Factory JSONL | [../data/eval/hardware-factory-prompts.jsonl](../data/eval/hardware-factory-prompts.jsonl) |

---

## Common mistakes

| Mistake | Consequence |
|---------|-------------|
| Abliterate GGUF directly | Not supported — convert to HF first |
| Abliterate 4-bit stored weights | Use Heretic/llm-abliteration on load-quant or FP base |
| Skip `orthogonalize_direction` | Higher KL / capability loss |
| Overwrite ORIGINAL folder | No rollback |
| Merge wrong adapter before GGUF | Garbage logits — verify PEFT target modules |

---

## Next step

→ [gguf-export-notes.md](gguf-export-notes.md) · [../docs/toolchain-safetensors-gguf-lora.md](../docs/toolchain-safetensors-gguf-lora.md)