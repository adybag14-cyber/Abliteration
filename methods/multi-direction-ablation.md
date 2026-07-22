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
    # [k, hidden_dim], normalized but not necessarily independent.
    return torch.stack([v / v.norm().clamp_min(1e-12) for v in vectors], dim=0)

def orthonormal_basis(R: torch.Tensor, rtol: float = 1e-6) -> torch.Tensor:
    """Return Q[d, rank] after removing numerically dependent directions."""
    _, singular_values, vh = torch.linalg.svd(R.float(), full_matrices=False)
    keep = singular_values > singular_values.max() * rtol
    return vh[keep].T.to(dtype=R.dtype, device=R.device)

def ablate_output_space(W: torch.Tensor, Q: torch.Tensor, alpha: float = 1.0):
    """W[out, in]; remove the component of each output column in span(Q)."""
    assert W.shape[0] == Q.shape[0], "transpose Q or W for this architecture"
    removed = Q @ (Q.T @ W.float())
    return W - alpha * removed.to(W.dtype)
```

At `alpha=1`, this computes `(I - QQᵀ)W`. The earlier-looking expression
`W - alpha * (P_perp @ W)` is **wrong** when `P_perp = I - QQᵀ`: at full
strength it keeps only the refusal subspace. Name the removed projector and the
kept projector explicitly in code to avoid this complement error.

For a module stored as `W[in, out]`, apply on the right:

```python
removed = (W.float() @ Q) @ Q.T
W_new = W - alpha * removed.to(W.dtype)
```

Never infer orientation from a parameter name. Assert the dimension against
`hidden_size`, run a one-vector synthetic test, and verify `Q.T @ W_new` is
approximately zero at `alpha=1`.

## Basis construction choices

| Input | Recommended basis | Why |
|-------|-------------------|-----|
| Category mean differences | SVD/QR with rank cutoff | Drops duplicate or nearly collinear categories |
| Per-prompt paired differences | Center, SVD, choose `k` on held-out data | Separates stable modes from prompt noise |
| Gradient-optimized directions | SVD after optimization | Optimization does not guarantee independence |
| Layer-specific directions | Build a basis per layer | Directions can rotate with depth |

Do not choose `k` from training refusal alone. Sweep `k=1..k_max` and retain the
smallest rank that improves held-out target behavior without crossing the KL or
capability gate. Report singular values and the rank cutoff in the experiment
manifest.

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
- Run the synthetic projector invariants before editing real tensors
- Measure held-out causal effect per direction; cosine separation alone is not evidence

→ [direction-diagnostics-and-localization.md](direction-diagnostics-and-localization.md) · [../techniques/beyond-single-direction.md](../techniques/beyond-single-direction.md)
