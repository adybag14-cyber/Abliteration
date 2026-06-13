# Kernel shaping & depth profiles

Heretic does not apply the same ablation strength at every layer. Optuna searches a **depth kernel** — how refusal removal is distributed across transformer blocks.

---

## What Heretic searches

Beyond per-layer on/off, Heretic optimizes kernel hyperparameters (names from upstream `config.default.toml` / Optuna study):

| Parameter | Meaning |
|-----------|---------|
| `max_weight` | Peak ablation amplitude |
| `min_weight` | Floor amplitude (can be 0) |
| `max_weight_position` | Normalized depth (0–1) where kernel peaks |
| `min_weight_distance` | Spread — how wide the peak is |

**Intuition:** refusal is often concentrated in **middle layers** (60–75% depth on Llama-class 32L). A Gaussian-like kernel centered too early damages syntax; too late misses the refusal circuit.

---

## Manual layer bands vs kernel

| Approach | When |
|----------|------|
| **Heretic kernel search** | Default — let Optuna find peak position |
| **Manual band** | Research reproduction, llm-abliteration YAML |
| **Single layer** | Debugging only — rarely production |

Manual bands from residual geometry:

```bash
heretic <model> --print-residual-geometry
```

| Silhouette pattern | Action |
|--------------------|--------|
| Sharp peak layers 18–22 | Narrow kernel; lower `min_weight_distance` |
| Flat mid-depth plateau | Wider kernel; higher `max_weight` |
| Early+late bimodal | Consider two-pass iterative abliteration |

→ [layer-selective-abliteration.md](layer-selective-abliteration.md) · [iterative-abliteration.md](iterative-abliteration.md)

---

## Architecture-specific starting heuristics

| Architecture | Layers | Typical peak (rule of thumb) |
|--------------|--------|------------------------------|
| Llama 3.1 8B | 32 | 0.55–0.70 normalized |
| Qwen2.5 7B | 28 | 0.50–0.65 |
| Gemma 3 12B | 48 | 0.60–0.75 |
| Qwen3 4B dense | 36 | 0.55–0.68 |
| MoE (Qwen3-30B-A3B) | varies | Per-expert — see [moe-hybrid-abliteration.md](moe-hybrid-abliteration.md) |

**Always re-measure** — chat template and instruct tuning shift the peak.

---

## Tuning when quality collapses

| Symptom | Kernel fix |
|---------|------------|
| MMLU/GSM8K drop | ↓ `max_weight`; narrow band (↓ spread) |
| Harmful still refused | ↑ `max_weight` at peak; add second pass |
| Benign over-refusal | Peak too late or too wide — constrain search |
| Perplexity spike on code | Peak too early — shift `max_weight_position` later |

Combine with:

```toml
orthogonalize_direction = true
row_normalization = "full"
winsorization_quantile = 0.95   # Gemma, some Qwen
kl_divergence_target = 0.01
```

---

## llm-abliteration manual kernel

In `config.yaml` for `sharded_ablate.py`:

```yaml
layers:
  start: 14
  end: 22
  strength: 0.8   # partial α — see partial-strength-abliteration.md
```

Sharded ablate processes one layer shard at a time — essential for 70B+ on consumer GPUs.

→ [../methods/projected-llm-abliteration.md](../methods/projected-llm-abliteration.md)

---

## Related

- [layer-selective-abliteration.md](layer-selective-abliteration.md)
- [partial-strength-abliteration.md](partial-strength-abliteration.md)
- [../docs/advanced-techniques-catalog.md](../docs/advanced-techniques-catalog.md)
- [../instructions/advanced-abliteration-workflow.md](../instructions/advanced-abliteration-workflow.md)