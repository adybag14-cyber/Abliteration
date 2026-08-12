# COSMIC direction-ID pipeline

Implementation notes for [../techniques/cosmic-refusal-direction.md](../techniques/cosmic-refusal-direction.md) (T36). Upstream: [wang-research-lab/COSMIC](https://github.com/wang-research-lab/COSMIC) · arXiv:2506.00085.

This handbook ships a **minimal cosine scorer** (no full paper reproduction). Use upstream COSMIC for the ACL experiments; use the snippet below to rank layers when you already have activation caches.

---

## Cache

Same as any DIM run: last-token (or chat index `−2`) residual at each layer, two prompt lists.

```text
H_bad[ℓ]  ∈ ℝ^{n_bad × d}
H_good[ℓ] ∈ ℝ^{n_good × d}
```

---

## Score (handbook approximation)

```python
def cosmic_layer_score(h_bad, h_good):
    mu_b, mu_g = h_bad.mean(0), h_good.mean(0)
    r = mu_b - mu_g
    r = r / r.norm().clamp_min(1e-8)
    # separation: mean cosine of rows to r
    sep = (h_bad @ r).mean() - (h_good @ r).mean()
    # inversion: swapping means should flip the sign of sep
    return float(sep)
```

Pick `ℓ* = argmax_ℓ score(ℓ)`. Optionally compare PCA-1 of `concat(H_bad, −H_good)` vs DIM; COSMIC prefers the candidate whose **cosine neighborhoods** invert most cleanly (upstream adds extra inversion metrics).

```bash
python scripts/estimate-refusal-direction.py --mode cosmic --self-test
```

---

## Bake

COSMIC stops at `r`. Bake with:

- Heretic (import direction if your build allows; otherwise use `r` only to choose layer band)
- `python scripts/apply-weight-abliteration.py --mode projected --direction r.pt`
- Inference hook: `python scripts/inference-hook-ablation.py --direction r.pt`

---

## Failure modes

| Symptom | Cause |
|---------|--------|
| All layers score ~0 | Contrast set too similar (Petrov topic-match cancel) or hook on the wrong token |
| Best layer is embedding or final | Measurement leak; exclude first 2 and last 1 layers |
| High score, no behavioral change | You found a **style** direction (QCRI) — change prompts, not the scorer |
