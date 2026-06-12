# Automated Heretic search

Source of truth: **[github.com/p-e-w/heretic](https://github.com/p-e-w/heretic)** (fetch with `node scripts/fetch-docs.mjs`).

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