# Partial-strength abliteration

Full orthogonal projection can be too aggressive. Scale the edit:

```
W' = W - α · (W projected onto span{r})
```

Or equivalently blend:

```
W' = (1-α)W + α · W_ablated
```

## Choosing α

| α | Effect |
|---|--------|
| 0.25 | Mild — fewer capability hits, refusals may remain |
| 0.50 | Balanced starting point for experiments |
| 1.00 | Full ablation — maximum refusal reduction, highest damage risk |

Sweep α ∈ {0.25, 0.5, 0.75, 1.0} on a **small** eval suite before committing.