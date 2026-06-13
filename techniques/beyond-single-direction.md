# Beyond the single refusal direction

2025–2026 research shows refusal is **richer** than one global vector — but linear abliteration still works as a **behavioral knob**. Use these methods when single-direction Heretic under-performs or for research-grade control.

---

## 1. Multi-category directions (QCRI 2026)

[There Is More to Refusal in LLMs than a Single Direction](https://arxiv.org/abs/2602.02132) (Joad et al., QCRI, Feb 2026) — beginner summary: [multi-category-refusal-beginners-guide.md](multi-category-refusal-beginners-guide.md) · PDF: [../sources/fetched/arxiv-2602-02132.pdf](../sources/fetched/arxiv-2602-02132.pdf)

**Models studied:** `gemma-2-9b-it`, `Llama-3.1-8B-Instruct` · **Hook:** residual at chat-template index **−2** (decision token) · **SAEs:** GemmaScope layers 9/20/31, `andyrdt/saes-llama-3.1-8b-instruct`

- **11 refusal splits** from WildGuardMix, SorryBench (4), CoCoNot (5), XSTest — see beginners guide table
- **SafetyCore–WGM** direction is closest to Arditi 2024 single safety DIM
- Directions are **geometrically distinct** (cosine similarity 0.4–0.6; Incomplete vs OverRefusal near-orthogonal)
- **Linear steering** along *any* direction yields nearly identical refusal/over-refusal **rate** curves — a shared **one-dimensional control knob**
- What differs across directions is **refusal style** (policy text vs clarification vs soft deflection), not whether the knob exists
- **SAE structure:** small shared refusal **core** (~2.5–4% of latents in all 11 splits) + long **tail** of style-specific latents; linear interventions collapse both

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

## 6. Mechanistic tools (FailSpy/abliterator)

[FailSpy/abliterator](https://github.com/FailSpy/abliterator) is the handbook's **notebook-first** path when you need to understand refusal geometry before permanent weight edits.

| Capability | Use |
|------------|-----|
| Activation caching | Compare harmful vs harmless residuals per layer |
| Refusal direction compute | Validate mean-difference `r_ℓ` before YAML/Heretic |
| Hook ablation (temp) | A/B refusal rate without saving weights |
| Hook ablation (permanent) | Bake only after temp hooks pass eval |
| Layer whitelist/blacklist | Surgical bands — pairs with [layer-selective-abliteration.md](layer-selective-abliteration.md) |

**Limits:** TransformerLens architecture coverage is **narrower** than Heretic/Abliterix (lowest compatibility in arXiv:2512.13655). Use for prototyping; export winning directions to Heretic custom prompts or Abliterix presets.

```python
# Pattern — see upstream notebooks for full API
from transformer_lens import HookedTransformer
# cache activations → compute r → hook blocks.{L}.hook_resid_post
```

Complements SAE latent work (§4) and multi-direction PCA (§3). VRAM path: [../instructions/low-vram-abliteration.md](../instructions/low-vram-abliteration.md#path-c--inference-hooks-only-zero-weight-edit)

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
| FailSpy hooks | ★★☆ | Notebook prototyping → bake with Heretic/Abliterix |

---

## Related

- [multi-category-refusal-beginners-guide.md](multi-category-refusal-beginners-guide.md) — QCRI 2026 plain-language guide
- [domain-specific-abliteration.md](domain-specific-abliteration.md)
- [layer-selective-abliteration.md](layer-selective-abliteration.md)
- [extended-abliteration-toolkit.md](extended-abliteration-toolkit.md)
- [../docs/research-landscape.md](../docs/research-landscape.md)