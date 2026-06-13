# Automated Heretic search

Source of truth: **[github.com/p-e-w/heretic](https://github.com/p-e-w/heretic)** · PyPI `heretic-llm` · Live docs [mintlify](https://p-e-w-heretic.mintlify.app/).

**Output:** Hugging Face safetensors layout — convert to GGUF separately ([gguf-export-notes.md](gguf-export-notes.md)).

## What Heretic optimizes

Per upstream README, Heretic co-minimizes:

1. **Refusal rate** on harmful prompt set
2. **KL divergence** from original model on harmless prompts

Optimizer: **Optuna TPE** over ablation kernel parameters.

## Target modules

- Attention **o_proj**
- MLP **down_proj**

Refusal directions: **difference-of-means** between first-token residuals (harmful vs harmless).

## Key parameters (see `config.default.toml` on GitHub)

| Parameter | Meaning |
|-----------|---------|
| `direction_index` | Layer index or `per layer` |
| `max_weight` / `min_weight` | Ablation kernel amplitude |
| `max_weight_position` / `min_weight_distance` | Kernel shape over depth |
| `quantization` | `bnb_4bit` for VRAM savings |
| `offload_outputs_to_cpu` | Lower peak during residual/KL passes |
| `max_memory` | Per-device cap; spill to CPU RAM |
| `row_normalization` | `full` enables norm-preserving LoRA in export |
| `full_normalization_lora_rank` | Rank of bundled LoRA correction (default 3) |

Low VRAM guide: [../instructions/low-vram-abliteration.md](../instructions/low-vram-abliteration.md)

## Install & run

```bash
pip install -U heretic-llm
heretic <model_name_or_path>
```

## Evaluate two checkpoints

```bash
heretic --model google/gemma-3-12b-it --evaluate-model p-e-w/gemma-3-12b-it-heretic
```

## Prior art (all GitHub)

Listed in Heretic README: FailSpy/abliterator, wassname/abliterator, ErisForge, Sumandora/remove-refusals-with-transformers, deccp — see [../references.md](../references.md).