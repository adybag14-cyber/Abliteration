# Geometric median & winsorization

Robust refusal-direction estimation when mean-difference is polluted by **outliers** or **massive activations**.

---

## Geometric median (g*, b*)

Heretic research mode (`--print-residual-geometry`) reports both **mean** and **geometric median** centroids:

| Symbol | Definition |
|--------|------------|
| `g` | Mean residual, harmless prompts |
| `b` | Mean residual, harmful prompts |
| `g*` | Geometric median, harmless |
| `b*` | Geometric median, harmful |
| `r` | `b - g` (standard refusal direction) |
| `r*` | `b* - g*` |

**Why median:** a few prompts with extreme activations ("massive activations" in Gemma/Qwen) pull the mean. Median is robust in high dimensions (Weiszfeld algorithm).

```python
# Heretic analyzer.py pattern (conceptual)
from torch.linalg import vector_norm

def geometric_median(points, max_iter=100, tol=1e-5):
    # points: [n_prompts, hidden_dim]
    y = points.mean(dim=0)
    for _ in range(max_iter):
        dist = vector_norm(points - y, dim=1).clamp_min(1e-8)
        w = 1.0 / dist
        y_new = (points * w.unsqueeze(1)).sum(0) / w.sum()
        if vector_norm(y_new - y) < tol:
            break
        y = y_new
    return y
```

**When to prefer r*:** high silhouette variance across layers; `--print-residual-geometry` shows large `|g|` vs `|g*|` gap.

**Manual pipeline:** compute `directions.pt` with both estimators; A/B eval refusal + KL.

---

## Winsorization

Heretic clamps per-prompt residual components before aggregation:

```toml
# 0.95 = clamp each component to 95th percentile magnitude
winsorization_quantile = 0.95
```

```python
thresholds = torch.quantile(abs_residuals, q=0.95, dim=-1, keepdim=True)
residuals_clamped = torch.clamp(residuals, -thresholds, thresholds)
```

**Models that benefit:** Gemma family, some Qwen checkpoints with spike activations.

**Trade-off:** may under-estimate refusal on genuinely extreme harmful prompts — validate harmful refusal rate after enable.

---

## Combined recipe

```toml
orthogonalize_direction = true
winsorization_quantile = 0.95
row_normalization = "full"
```

Run geometry table:

```bash
pip install -U "heretic-llm[research]"
heretic <model> --print-residual-geometry
```

Interpret **Silhouette** column — higher mid/late layers = stronger refusal clustering → prioritize in manual layer bands.

---

## Related

- [projected-norm-preserving-abliteration.md](projected-norm-preserving-abliteration.md)
- [mean-difference-direction.md](mean-difference-direction.md)
- [../docs/advanced-techniques-catalog.md](../docs/advanced-techniques-catalog.md)