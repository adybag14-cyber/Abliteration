# ORBA / directional rank-1 pipeline

How to apply [../techniques/orba-orthogonal-reflection.md](../techniques/orba-orthogonal-reflection.md) (T34) without Abliterix. Concepts: Lai 2026 ORBA blog · jim-plus `llm-abliteration`.

---

## Estimate `r` (subtract, then normalize)

```python
r = H_forbidden.mean(0) - H_harmless.mean(0)
r = r / r.norm()
```

Optional T03 + “twice is enough”:

```python
g = H_harmless.mean(0)
g = g / g.norm()
for _ in range(2):
    r = r - torch.dot(r, g) * g
r = r / r.norm()
```

Do **not** L2-normalize each prompt row before the mean-difference unless you are running an ablation study. Lai: subtract-then-normalize keeps magnitude contrast.

---

## Apply modes

Shared implementation: `scripts/abliteration_math.py`.

| `--mode` | Formula on output dim of `W` `[d_out, d_in]` |
|----------|-----------------------------------------------|
| `arditi` | `W ← W − α r rᵀ W` |
| `projected` | same after Gram–Schmidt of `r` off `g` |
| `orba-directional` | Output-space wipe `W ← (I − α r rᵀ) W`. Equivalent to Lai’s rank-1 abliteration (`steer α=0`) when `r` is the residual **write** direction. |
| `orba-householder` | `W ← (I − 2 uuᵀ) W` (output-space). Research only. |

Handbook default bake: **output-space directional** = classic Arditi on `down_proj` / `o_proj`, which **is** ORBA’s recommended operator.

Householder (`I − 2uuᵀ`) is available for A/B tests. Expect semantic drift, not just residual refusal.

---

## CLI

```bash
python scripts/estimate-refusal-direction.py --mode projected --self-test
python scripts/apply-weight-abliteration.py \
  --mode orba-directional --alpha 1.0 \
  --weights ./base --direction r.pt --out ./abliterated
```

On a full HF tree, only keys ending in `down_proj.weight` / `o_proj.weight` (and MoE `*.down_proj.weight`) are touched.

---

## Cross-check vs Heretic

Heretic `orthogonalize_direction = true` + `row_normalization = full` ≈ projected directional + MPOA. Prefer Heretic when you want Optuna layer kernels. Use this pipeline when you already have `r.pt` from COSMIC / SOM / factory DIM.
