# T37 — SVD / whitened-SVD refusal subspace (OBLITERATUS)

Single-direction abliteration is rank-1. **OBLITERATUS** ([elder-plinius/OBLITERATUS](https://github.com/elder-plinius/OBLITERATUS)) estimates a **k-dimensional refusal subspace** with PCA / SVD / **whitened SVD**, then projects that subspace out of weights. Related method notes: [../methods/svd-refusal-subspace.md](../methods/svd-refusal-subspace.md).

**One sentence:** treat leftover refusal after DIM as extra singular vectors, not a bigger `α`.

---

## Presets (upstream names)

| Method | Typical rank | Extra | Use |
|--------|--------------|-------|-----|
| `basic` | 1 (DIM) | Single pass | Quick experiment — same family as Arditi |
| `advanced` | ~4 SVD | Norm-preserving, bias projection, 2 passes | Default production-style |
| `aggressive` | ~8 whitened SVD | Iterative, 3 passes | Maximum guardrail removal — high KL risk |
| `surgical` | ~8 | SAE, head surgery, layer-adaptive, MoE-aware, CoT | R1 / thinking / MoE |

```bash
git clone https://github.com/elder-plinius/OBLITERATUS.git
cd OBLITERATUS && pip install -e ".[spaces]"
obliteratus obliterate Qwen/Qwen2.5-1.5B-Instruct --method advanced --output-dir ./out
```

Hermes Agent skill docs map reasoning models → `surgical` (~1–2 h) and MoE → expert-granular / `nuclear` naming in some write-ups. **Always re-check the installed CLI `--help`** — preset names have moved.

---

## Math (subspace)

Collect contrast residuals `Δ = H_harmful − μ_harmless` (or a stacked difference matrix). SVD:

```text
Δ = U Σ Vᵀ
R = U[:, :k]          # top-k left singular vectors in residual space
P_⊥ = I − R Rᵀ        # R orthonormal
W' = P_⊥ W            # output-space wipe, same as multi-direction
```

**Whitened SVD** (Mahalanobis): whiten with the harmless (or pooled) covariance so high-variance nuisance directions do not dominate `U`.

```text
Σ_h = cov(H_harmless) + εI
Δ_w = Σ_h^{−1/2} Δ
```

Then SVD on `Δ_w` and map singular vectors back with `Σ_h^{1/2}`.

This is the same projector as [../methods/multi-direction-ablation.md](../methods/multi-direction-ablation.md); OBLITERATUS adds presets, bias projection, and optional SAE/head surgery.

---

## When to use

| Situation | Preset / path |
|-----------|----------------|
| Heretic DIM leftovers on a dense 8B | `advanced` **or** handbook multi-D with k=2–4 |
| Qwen3-Thinking / R1 distill | `surgical` + [thinking-model-abliteration.md](thinking-model-abliteration.md) |
| MoE | `surgical` / per-expert T08 — do not use `basic` only on shared MLP |
| You only need rank-1 | Stay on Heretic T03 — fewer moving parts |

**Honest limit:** OBLITERATUS is **not** in Young’s 16-model matrix (arXiv:2512.13655). Marketing copy is not a GSM8K number. Run [../instructions/eval-driven-workflow.md](../instructions/eval-driven-workflow.md).

---

## Related tools

- Abliterix SAE / ORBA paths — another multi-technique automation
- FailSpy — cache + hooks before you commit a subspace bake
- Handbook: `python scripts/apply-weight-abliteration.py --mode subspace --rank 4`
