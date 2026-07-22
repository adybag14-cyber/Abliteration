# Protected-subspace abliteration

Projected abliteration protects one harmless mean direction. Generalize that
idea by protecting a low-dimensional capability subspace before constructing
the refusal basis.

## Construction

Let `G[d,p]` be an orthonormal basis of protected directions and `R[d,k]` the
candidate refusal directions for one layer. Remove from `R` every component in
the protected span, then orthonormalize:

```python
import torch

def protected_refusal_basis(R: torch.Tensor, G: torch.Tensor, rtol: float = 1e-6):
    # R[d,k], G[d,p]; build both in FP32.
    G, _ = torch.linalg.qr(G.float(), mode="reduced")
    residual = R.float() - G @ (G.T @ R.float())
    u, s, _ = torch.linalg.svd(residual, full_matrices=False)
    keep = s > s.max() * rtol
    return u[:, keep], s

Q, singular_values = protected_refusal_basis(R, G)
W_new = W - alpha * (Q @ (Q.T @ W.float())).to(W.dtype)  # W[out,in]
```

This enforces `G.T @ Q approximately 0`. It does not guarantee that every
capability is preserved: the supplied `G` only represents the measured
protected behaviors.

## Building the protected basis

Candidate sources include harmless-instruction mean differences, activation
directions for named capabilities, principal components of capability prompts,
or gradients of a frozen capability loss. Use train data to estimate `G`, a
selection split to choose its rank, and a separate test split for the final
claim.

Keep `p` small. A large protected span can leave no stable refusal direction;
report the singular values after residualization and reject directions beneath
the rank cutoff rather than amplifying them.

## Diagnostics

Require all of the following:

- `||G.T @ Q||` is near zero in FP32;
- the refusal basis remains stable across bootstrap resamples;
- held-out reversible hooks retain a causal effect after protection;
- named protected-task scores improve relative to an unprotected edit;
- unrelated capability, benign refusal, KL, and degeneration gates still pass.

Compare against three baselines: no edit, ordinary projected abliteration, and
the same-rank unprotected subspace. If protection only helps the training tasks,
it is overfit.

## Failure modes

| Symptom | Likely cause | Response |
|---------|--------------|----------|
| Refusal effect vanishes | `G` overlaps the useful refusal component | Reduce protected rank or redesign contrasts |
| Capability still drops | Protected probes do not span the lost behavior | Add held-out capability families; do not raise alpha |
| Basis rank changes by split | Too few prompts or collinear directions | Bootstrap, shrink rank, collect more data |
| Edit invariant fails | Wrong tensor orientation | Test `W[out,in]` versus `W[in,out]` explicitly |

This is an experimental constrained projection, not evidence that safety and
capability occupy cleanly separable subspaces. Use the causal workflow in
[direction-diagnostics-and-localization.md](direction-diagnostics-and-localization.md)
and the paired gates in [../docs/evaluation.md](../docs/evaluation.md).
