# SVD refusal-subspace pipeline

How to bake a **k-direction** wipe. Theory: [../techniques/svd-whitened-obliteratus.md](../techniques/svd-whitened-obliteratus.md) (T37) · [multi-direction-ablation.md](multi-direction-ablation.md).

---

## From a difference matrix

Given last-token residuals `H_bad`, `H_good` at one layer (`n × d`):

```python
delta = H_bad - H_good.mean(0)
# optional whiten with harmless covariance
# L = chol(cov(H_good) + eps I); delta = solve(L, delta.T).T
U, S, Vh = torch.linalg.svd(delta, full_matrices=False)
R = U[:, :k]          # if delta is d×n use left vectors in residual dim
# handbook helper orients this as (n, d) → Vh[:k] are rows in R^d
```

`scripts/estimate-refusal-direction.py --mode svd --rank 4` writes `r.pt` with shape `[k, d]`.

---

## Projector

```text
R ∈ ℝ^{d × k}   (orthonormal columns)
P_⊥ = I − R Rᵀ
W' = P_⊥ W      # W is [d_out, d_in], d_out = d_model
```

Same as k independent Arditi wipes if the columns are orthonormal (apply once, not sequentially with renormalization).

```bash
python scripts/apply-weight-abliteration.py --mode subspace --rank 4 \
  --weights ./base --direction r.pt --out ./abliterated
```

---

## Layer policy

- Start **middle third** of the stack (refusal silhouette peak).
- k=2 on first attempt. Raise k only if factory leftovers remain **and** GSM8K holds.
- Whitening helps when Gemma-scale **massive activations** dominate SVD-1 (also try [../techniques/geometric-median-winsorization.md](../techniques/geometric-median-winsorization.md)).

---

## OBLITERATUS shortcut

```bash
obliteratus obliterate <model> --method advanced --output-dir ./out
```

Then run the same eval gates as Heretic. Do not skip [../instructions/eval-driven-workflow.md](../instructions/eval-driven-workflow.md).
