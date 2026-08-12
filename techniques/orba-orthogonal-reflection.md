# T34 — ORBA (Orthogonal Reflection Bounded Ablation)

Jim Lai, March 2026: [Orthogonal Reflection Bounded Ablation](https://huggingface.co/blog/grimjim/orthogonal-reflection-bounded-ablation). Builds on [projected-norm-preserving-abliteration.md](projected-norm-preserving-abliteration.md) (T03) and Magnitude-Preserving Orthogonal Ablation (MPOA).

**One sentence:** treat “harmless → forbidden” as a **geometric map**. Householder reflection is the exact isometry; **directional ablation** (`α = 0` rank-1) is the **stable** weight edit. Full reflection can flip signs and drift semantics.

Implementation: [../methods/orba-pipeline.md](../methods/orba-pipeline.md) · math in `scripts/abliteration_math.py`.

---

## Why it exists

Young et al. (arXiv:2512.13655) showed GSM8K swings from **+1.51 to −18.81 pp** depending on tool. Lai argues much of that is **geometry of the edit**, not “abliteration is doomed.”

Two measurement facts from the ORBA write-up:

1. Unit-normalized difference-of-means is the **normal of the Householder reflector** that maps the harmless unit vector toward the forbidden unit vector.
2. **Subtract then normalize** (classic DIM) beat **normalize then subtract** both geometrically (keeps magnitude contrast) and numerically (less cancellation when cosine is high).

Handbook default estimator stays:

```text
r = normalize(mean(h_forbidden) − mean(h_harmless))
```

---

## Two interventions

### A. Householder reflection (isometric, risky)

```text
H = I − 2 u uᵀ
H w = w − 2 (uᵀ w) u
```

Flips the component along `u`. Exact, reversible in exact arithmetic. In float32 on LLM weights, angular error **reflects** into the opposite half-space → characteristic failure: **wrong-sign / topic flip**, not “still refuses.”

Lai released a Householder comparison checkpoint (v3) vs directional (v4) on Gemma 3 12B.

### B. Directional ablation (recommended)

Geodesic from `u` toward `−u` with interpolation `λ`. At `λ = 1` the component is rotated onto the orthogonal complement (**zeroed**, not flipped):

```text
w' = w + (cos θ − 1) (w · u) u
```

Rank-1 form (no trig at apply time):

```text
W' = W + α (W s) ⊗ s
abliteration ⇔ α = 0  ⇒  W' = W − (W s) ⊗ s
```

This is the same primitive as activation steering and rank-1 LoRA.

### C. Capability boundary (Gram–Schmidt, “twice is enough”)

Project `u` off the harmless mean `ĥ` **twice**, then renormalize — Horning et al. “twice is enough” for floating-point Gram–Schmidt:

```text
u ← u − (u·ĥ) ĥ
u ← u − (u·ĥ) ĥ
u ← u / ‖u‖
```

This is T03 `orthogonalize_direction` with an explicit second pass.

---

## When to use

| Situation | Choice |
|-----------|--------|
| Production agent | T03 Heretic (`orthogonalize_direction`, `row_normalization=full`) — already directional + norm restore |
| Abliterix preset lists ORBA | Enable only if you will re-run factory/XSTest/GSM8K |
| Reproducing Lai v3 vs v4 | Householder vs directional on the same `r` |
| Semantic drift after reflection | Switch to directional (`α=0`) |

---

## Tools

| Tool | Flag / note |
|------|-------------|
| jim-plus llm-abliteration | `--projected` + `--normpreserve` ≈ directional + MPOA |
| Abliterix | ORBA listed among extra techniques — verify preset |
| This repo | `python scripts/apply-weight-abliteration.py --mode orba-directional` |

Do **not** confuse ORBA with “more layers” or “higher `max_weight`.” It is a **different operator** on the same `r`.
