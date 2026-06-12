# Beyond the single refusal direction

2025–2026 research shows refusal is **richer** than one global vector — but linear abliteration still works as a **behavioral knob**. Use these methods when single-direction Heretic under-performs or for research-grade control.

---

## 1. Multi-category directions (QCRI 2026)

[There Is More to Refusal in LLMs than a Single Direction](https://arxiv.org/html/2602.02132v1) (Joad et al., QCRI):

- **11 refusal splits:** safety, hate speech, over-refusal (XSTest), incomplete/unsupported requests (CoCoNot), anthropomorphization, etc.
- Directions are **geometrically distinct** (cosine similarity 0.4–0.6, some near-orthogonal).
- **Linear steering** along any direction yields similar refusal/over-refusal trade-off — differences show in **refusal style** (policy text vs clarification vs soft deflection).

**Practical implication for agents:**

| Goal | Direction dataset |
|------|-------------------|
| CyberGym / exploit PoC | Standard harmful_behaviors DIM |
| Factory false-refusal (`wmic`) | Custom factory bad/good `.txt` |
| Reduce over-refusal on benign security tasks | Include XSTest-style pairs in `good_prompts` eval |

---

## 2. Concept cones & gradient RDO (TUM 2025)

[The Geometry of Refusal — Concept Cones](https://arxiv.org/html/2502.17420v2) (Wollschläger et al.):

- Refusal directions form **multi-dimensional cones**, not a single line.
- **Refusal Direction Optimization (RDO):** gradient-based search for `r` optimizing:
  - **Ablation loss:** answer harmful prompts when `r` is projected out
  - **Addition loss:** refuse harmless when `+αr` added
  - **Retain loss:** KL on harmless outputs unchanged under ablation

```text
L = λ_abl · CE(f_ablate(r)(p_harm), t_answer)
  + λ_add · CE(f_add(r)(p_safe), t_refusal)
  + λ_ret · KL(f_ablate(r)(p_safe), f(p_safe))
```

**Code:** [cs.cit.tum.de/daml/geometry-of-refusal](https://www.cs.cit.tum.de/daml/geometry-of-refusal/)

**When to use:** single DIM direction leaves refusals; you have GPU for ~100–500 steps of `r` optimization; research on independent directions.

→ [../methods/gradient-rdo-pipeline.md](../methods/gradient-rdo-pipeline.md)

---

## 3. Multi-direction PCA ablation

When multiple independent refusal mechanisms exist, ablate a **subspace** spanned by top-k directions:

```
R = [r₁ | r₂ | … | r_k]   ∈ ℝ^{d×k}
P_⊥ = I - R (Rᵀ R)⁻¹ Rᵀ
W' = P_⊥ W
```

Directions `r_i` from:

- Different dataset splits (SorryBench categories)
- PCA on residual differences per topic
- Top-k singular vectors of `(H_bad - H_good)` matrix

**Risk:** over-ablation → capability collapse. Start k=2, middle layers only.

→ [../methods/multi-direction-ablation.md](../methods/multi-direction-ablation.md)

---

## 4. SAE refusal latents (sparse autoencoders)

QCRI 2026 + [GemmaScope](https://huggingface.co/google/gemma-scope-9b-it-res):

1. Hook residual at **decision token** (index -2 in chat template).
2. Encode with JumpReLU SAE at layers 9/20/31.
3. Rank latents by **firing-rate separation** Δ = P(fire|refusal) - P(fire|comply).
4. Build direction: `d_SAE = mean(decoder directions of top-K latents)`.
5. Steer: `x' = x + β d_SAE` or zero latents and decode back.

**Use:** interpret **which features** fire on factory false-refusals; combine with targeted ablation on layers where silhouette is highest (Heretic `--print-residual-geometry`).

**Tools:** GemmaScope SAEs, [andyrdt/saes-llama-3.1-8b-instruct](https://huggingface.co/andyrdt/saes-llama-3.1-8b-instruct)

---

## 5. Representational independence

Orthogonal `r₁ ⊥ r₂` does **not** imply independent intervention effects. The TUM paper defines **representational independence** — directions whose ablations commute approximately.

**Heuristic for practitioners:** ablate `r_factory` (custom WMI/nmap pairs) **first**; if `r_safety` refusals remain, add second pass on standard harmful set with **lower α** on non-overlapping layer bands.

---

## Comparison

| Method | Complexity | Best for |
|--------|------------|----------|
| Single DIM | ★☆☆ | Heretic default, 90% of deployments |
| Projected DIM | ★★☆ | Lower KL (always enable) |
| Multi-direction PCA | ★★★ | Stubborn multi-topic refusals |
| Gradient RDO | ★★★★ | Research / hard models |
| SAE latents | ★★★★ | Interpretability + targeted edits |
| Domain-specific DIM | ★★☆ | Factory / pentest false-refusal |

---

## Related

- [domain-specific-abliteration.md](domain-specific-abliteration.md)
- [layer-selective-abliteration.md](layer-selective-abliteration.md)
- [../docs/research-landscape.md](../docs/research-landscape.md)