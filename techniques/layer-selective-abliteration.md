# Layer-selective abliteration

Refusal signal is **not uniform** across depth. Middle layers usually dominate; early layers carry syntax; late layers align to surface refusal tokens ("I cannot…").

---

## Observation (empirical)

| Depth region | Typical role |
|--------------|--------------|
| 0–25% | Token/pos encoding, weak refusal |
| 25–75% | **Refusal circuit** — highest silhouette |
| 75–100% | Output logits, template phrases |

Heretic searches this automatically via **depth kernel** — see [kernel-shaping-depth-profile.md](kernel-shaping-depth-profile.md).

---

## Manual strategy (llm-abliteration / research)

### Step 1 — Measure per-layer signal

```bash
pip install -U "heretic-llm[research]"
heretic <model> --print-residual-geometry
```

| Metric | Interpretation |
|--------|----------------|
| Silhouette per layer | Higher = better harmful/harmless separation |
| `S(g,r)` cosine | Projected direction quality |
| PaCMAP clusters | Visual check for outliers |

### Step 2 — Pick band

```
layers: start = L_peak - 4
        end   = L_peak + 4
```

| Model depth | Starting band (rule of thumb) |
|-------------|-------------------------------|
| 32 layers (Llama 8B) | 14–22 |
| 36 layers (Qwen3 4B) | 16–24 |
| 48 layers (Gemma 3 12B) | 22–34 |
| 80 layers (70B class) | 40–60 |

**Always re-tune** — architecture and chat template shift the peak.

### Step 3 — Ablate and eval

```yaml
# llm-abliteration config.yaml
layers:
  start: 16
  end: 24
modules:
  - mlp.down_proj
  - self_attn.o_proj
strength: 1.0
```

---

## Automated strategy (Heretic)

Optuna searches:

- Which layers receive non-zero kernel weight
- `max_weight_position` — normalized depth of peak
- `min_weight_distance` — kernel width
- `max_weight` / `min_weight` — amplitude bounds

**You do not need** manual layer lists for production — use `n_trials ≥ 120` and good eval sets.

---

## ErisForge — quick prototyping

When geometry is already known and you want a **single-pass** layer-band ablation without Optuna:

| Step | Tool |
|------|------|
| 1 | Heretic `--print-residual-geometry` or `analyze.py` → `L_peak` |
| 2 | ErisForge `AblationDecoderLayer` on `[L_peak-4, L_peak+4]` |
| 3 | `ExpressionRefusalScorer` quick check |
| 4 | Handbook eval gates |

```bash
git clone https://github.com/Tsadoq/ErisForge.git && cd ErisForge && pip install -e .
```

ErisForge averaged **-0.28 pp** GSM8K on the arXiv:2512.13655 subset — lower model compatibility than Heretic; always re-eval on your checkpoint.

→ [extended-abliteration-toolkit.md](extended-abliteration-toolkit.md) · [../instructions/advanced-abliteration-workflow.md](../instructions/advanced-abliteration-workflow.md) Track K · [mean-difference-direction.md](mean-difference-direction.md#erisforge-expressionrefusalscorer)

---

## MLP vs attention

| Target | Effect |
|--------|--------|
| `mlp.down_proj` | **Primary** refusal removal (Arditi recipe) |
| `self_attn.o_proj` | Complementary — sometimes reduces over-refusal |
| Both (Heretic default) | Best general results |

Manual research: ablate MLP-only first; add `o_proj` if harmful refusals persist.

→ [../methods/mlp-down-proj-abliteration.md](../methods/mlp-down-proj-abliteration.md) · [../methods/attention-o-proj-abliteration.md](../methods/attention-o-proj-abliteration.md)

---

## Partial strength per layer

Instead of binary on/off:

```
W'_ℓ = W_ℓ - α_ℓ · proj_{r_ℓ}(W_ℓ),   α_ℓ ∈ [0, 1]
```

Heretic kernel encodes continuous `α_ℓ`. Manual: [partial-strength-abliteration.md](partial-strength-abliteration.md).

---

## MoE caveat

Each **expert** has its own `down_proj` at every layer — layer band must apply to **all experts** in that band.

→ [moe-hybrid-abliteration.md](moe-hybrid-abliteration.md)

---

## Failure modes

| Symptom | Layer diagnosis |
|---------|-----------------|
| Grammar breaks | Peak too early — shift band later |
| Harmful still refused | Band too narrow or too late |
| Benign over-refusal | Band too wide or amplitude too high |
| Code quality drop | Likely layers 20–28 on 32L — reduce `max_weight` |

---

## Related

- [kernel-shaping-depth-profile.md](kernel-shaping-depth-profile.md)
- [../methods/automated-heretic-search.md](../methods/automated-heretic-search.md)
- [../instructions/advanced-abliteration-workflow.md](../instructions/advanced-abliteration-workflow.md) Track B