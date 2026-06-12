# Multi-direction subspace ablation

Ablate a **k-dimensional subspace** of refusal directions when single `r` leaves residual refusals.

## Collect multiple directions

Sources for `r_1 … r_k`:

1. **Category splits** — SorryBench hate / crime / advice separate DIM vectors
2. **PCA** — SVD on matrix of per-prompt residual differences
3. **Gradient RDO** — k independent optimized directions (see gradient-rdo-pipeline.md)
4. **Factory + safety** — `r_factory` from WMI false-refusal pairs + `r_safety` from harmful_behaviors

```python
import torch

def stack_directions(vectors: list[torch.Tensor]) -> torch.Tensor:
    # [k, hidden_dim], unit normalized
    R = torch.stack([v / v.norm() for v in vectors], dim=0)
    return R

def subspace_projector(R: torch.Tensor) -> torch.Tensor:
    # P_perp = I - R^T (R R^T)^{-1} R  for row vectors in R
    k, d = R.shape
    Gram = R @ R.T  # [k, k]
    return torch.eye(d) - R.T @ torch.linalg.solve(Gram, R)

def ablate_subspace(W: torch.Tensor, P_perp: torch.Tensor, alpha: float = 1.0):
    return W - alpha * (P_perp @ W)
```

## Layer strategy

| Pass | Layers | Directions |
|------|--------|------------|
| 1 | 50%–70% depth | `r_safety` only, α=0.75 |
| 2 | 60%–80% depth | `r_factory` only, α=0.5 |
| Avoid | Early 25% | Preserves parsing |

Do **not** apply full k=5 subspace at α=1.0 on all layers — KL will spike.

## Eval

- Harmful refusal ↓ on both safety and factory sets
- XSTest over-refusal must not ↑ (use projected directions)
- Compare KL to single-direction baseline

→ [../techniques/beyond-single-direction.md](../techniques/beyond-single-direction.md)