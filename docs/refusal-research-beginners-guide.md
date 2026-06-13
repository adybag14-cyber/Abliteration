# Refusal & abliteration research — beginner guide (2024–2026)

Plain-language map of the papers and tools that matter for this handbook. Every entry links to a **PDF in the repo** where available.

**Offline corpus:** [../sources/research/README.md](../sources/research/README.md) · refresh: `npm run fetch:research-papers`

**Hands-on first run:** [../instructions/beginner-reproduction-methodology.md](../instructions/beginner-reproduction-methodology.md)

---

## How to read this (recommended order)

```text
1. Arditi 2024        — why abliteration exists (one direction)
2. Jim Lai blogs      — projected + norm-preserving (production default)
3. Young 2025/26      — which tool to pick (Heretic vs DECCP vs ErisForge)
4. QCRI 2026          — eleven refusal types, one volume knob
5. Defenses section   — what can block abliteration (extended-refusal)
6. Everything else    — when you hit edge cases
```

---

## 1. Foundational — where abliteration starts

### arXiv:2406.11717 — Arditi et al. (NeurIPS 2024)

**Title:** *Refusal in Language Models Is Mediated by a Single Direction*

| | |
|--|--|
| **One sentence** | Refusal is mostly a **single arrow** in the model’s activation space; remove it from weights → model stops refusing as much. |
| **Method** | Mean-difference direction: average activations on harmful vs harmless prompts → subtract that component from `down_proj` / `o_proj`. |
| **Code** | [github.com/andyrdt/refusal_direction](https://github.com/andyrdt/refusal_direction) |
| **Repo PDF** | [sources/research/papers/arxiv-2406.11717.pdf](../sources/research/papers/arxiv-2406.11717.pdf) |
| **Handbook** | [../techniques/mean-difference-direction.md](../techniques/mean-difference-direction.md) · [../techniques/safety-guardrail-abliteration-methodology.md](../techniques/safety-guardrail-abliteration-methodology.md) |

**Beginner takeaway:** Almost every 2025–2026 paper still builds on this. Heretic automates the same idea with Optuna search.

---

## 2. Production stack — Jim Lai (2025, not arXiv but standard)

| Article | What it adds | Flags in tools |
|---------|--------------|----------------|
| [Projected abliteration](https://huggingface.co/blog/grimjim/projected-abliteration) | Remove only the refusal part **orthogonal to harmless behavior** → lower KL damage | Heretic `orthogonalize_direction = true`; `measure.py --projected` |
| [Norm-preserving biprojected](https://huggingface.co/blog/grimjim/norm-preserving-biprojected-abliteration) | Restore row weight norms after edit | `row_normalization = "full"`; `--normpreserve` |

**Beginner takeaway:** Handbook `config.production.toml` and `config.low-vram.toml` already enable both. **Do not skip** these on first serious run.

→ [../techniques/projected-norm-preserving-abliteration.md](../techniques/projected-norm-preserving-abliteration.md)

---

## 3. Tool benchmarks — pick Heretic vs alternatives

### arXiv:2512.13655 — Young (Dec 2025 / Jan 2026 v2)

**Title:** *Comparative Analysis of LLM Abliteration Methods*

| | |
|--|--|
| **One sentence** | Same 16 models, four tools — **no universal winner**; math (GSM8K) is the most sensitive capability. |
| **Models** | 16 instruction-tuned, 7B–14B |
| **Tools** | Heretic, DECCP, ErisForge, FailSpy/abliterator |
| **Key numbers** | Heretic: **16/16 compatibility**; DECCP avg GSM8K Δ **−0.13 pp**; ErisForge **−0.28 pp**; Heretic KL **0.043–1.646**; GSM8K swing up to **−18.81 pp** |
| **Repo** | [github.com/ricyoung/abliteration-comparison](https://github.com/ricyoung/abliteration-comparison) |
| **Repo PDF** | [sources/research/papers/arxiv-2512.13655.pdf](../sources/research/papers/arxiv-2512.13655.pdf) |
| **Handbook** | [comparative-abliteration-benchmarks.md](comparative-abliteration-benchmarks.md) |

**Beginner decision:**

| Your priority | Start with |
|---------------|------------|
| Automatic + broad arch support | **Heretic** |
| Lowest math regression on benchmarked subset | **DECCP** or **ErisForge** |
| Notebook / direction prototyping | **FailSpy** → bake with Heretic |

---

## 4. Multi-direction geometry — beyond one arrow

### arXiv:2502.17420 — Wollschläger et al. (TUM, Feb 2025)

**Title:** *The Geometry of Refusal — Concept Cones and Representational Independence*

| | |
|--|--|
| **One sentence** | Refusal lives in **multi-dimensional cones**, not one line; gradient **RDO** can search better directions. |
| **Code** | [cs.cit.tum.de/daml/geometry-of-refusal](https://www.cs.cit.tum.de/daml/geometry-of-refusal/) |
| **Repo PDF** | [sources/research/papers/arxiv-2502.17420.pdf](../sources/research/papers/arxiv-2502.17420.pdf) |
| **Handbook** | [../techniques/beyond-single-direction.md](../techniques/beyond-single-direction.md) §2 · [../methods/gradient-rdo-pipeline.md](../methods/gradient-rdo-pipeline.md) |

**Beginner takeaway:** Use when single-direction Heretic leaves stubborn refusals and you have GPU for RDO (~100–500 steps).

### arXiv:2602.02132 — QCRI (Feb 2026)

**Title:** *There Is More to Refusal than a Single Direction*

| | |
|--|--|
| **One sentence** | **11 refusal types** = **11 different directions**, but steering any of them moves the same **volume knob**; style of refusal changes, not the trade-off curve. |
| **Repo PDF** | [sources/research/papers/arxiv-2602.02132.pdf](../sources/research/papers/arxiv-2602.02132.pdf) |
| **Handbook** | [../techniques/multi-category-refusal-beginners-guide.md](../techniques/multi-category-refusal-beginners-guide.md) |

**Beginner takeaway:** Factory false-refusal is often **over-refusal** (XSTest direction), not classic safety — use factory prompt pairs in Heretic config.

### arXiv:2603.22061 — Petrov (Mar 2026)

**Title:** *On the Failure of Topic-Matched Contrast Baselines*

| | |
|--|--|
| **One sentence** | Matching harmful/harmless prompts by **topic** can **cancel** the refusal signal — unmatched contrast (different topics) works better. |
| **Repo PDF** | [sources/research/papers/arxiv-2603.22061.pdf](../sources/research/papers/arxiv-2603.22061.pdf) |

**Beginner takeaway:** Heretic’s default `harmful_behaviors` vs `harmless_alpaca` (different topics) is intentional. Do not over-engineer “matched” pairs unless you know why.

---

## 5. Defenses — what fights abliteration

→ Full beginner section: [defenses-against-abliteration.md](defenses-against-abliteration.md)

| Paper | Defense idea | Effect on abliteration |
|-------|--------------|------------------------|
| [2505.19056](https://arxiv.org/abs/2505.19056) Shairah et al. | **Extended-refusal** fine-tuning — long justification before “I refuse” | Refusal drop **≤10%** vs **70–80%** on baselines |
| [2406.04313](https://arxiv.org/abs/2406.04313) Circuit Breakers | Training-time orthogonalization of harmful activations | Adds safety; still bypassable in research |
| [2605.26526](https://arxiv.org/abs/2605.26526) Kuo et al. | TAR/SEAM defenses vulnerable to **abliteration + prefilling**; proposes **ART** (abliteration-resistant tuning) | ART reduces attack success ~10–20% |

**Beginner takeaway:** If abliteration “does nothing,” the base model may use **extended-refusal** or **ART** training. Try stronger measure prompts or a different checkpoint — not more `max_weight` alone.

---

## 6. Direction finding & measurement advances

### arXiv:2506.00085 — COSMIC (Siu et al., ACL 2025 Findings)

| | |
|--|--|
| **One sentence** | Find refusal directions with **cosine similarity** in activations — no need to see “I cannot” in outputs. |
| **Code** | [github.com/wang-research-lab/COSMIC](https://github.com/wang-research-lab/COSMIC) |
| **Repo PDF** | [sources/research/papers/arxiv-2506.00085.pdf](../sources/research/papers/arxiv-2506.00085.pdf) |

**Beginner takeaway:** Advanced alternative to mean-difference when refusal has no template phrase (weakly aligned models). Complements Heretic measure pass.

### arXiv:2510.02768 — Safety pretraining study

| | |
|--|--|
| **One sentence** | Which **safety pretraining stages** survive abliteration on SmolLM2-1.7B checkpoints. |
| **Code** | [github.com/shashankskagnihotri/safety_pretraining](https://github.com/shashankskagnihotri/safety_pretraining) |
| **Repo PDF** | [sources/research/papers/arxiv-2510.02768.pdf](../sources/research/papers/arxiv-2510.02768.pdf) |

**Beginner takeaway:** Not a how-to — informs **which base checkpoints** abliterate cleanly vs fight back.

### arXiv:2606.05396 — Code LLMs

| | |
|--|--|
| **One sentence** | On Qwen2.5-Coder, abliteration separates **willingness** (refusal) from **capability** (can it write valid code). |
| **Repo PDF** | [sources/research/papers/arxiv-2606.05396.pdf](../sources/research/papers/arxiv-2606.05396.pdf) |

**Beginner takeaway:** CyberGym / agent coders — refusal removal ≠ skill gain; still eval HumanEval slice.

---

## 7. Tools beyond Heretic (complementary)

| Tool | Best for | Handbook |
|------|----------|----------|
| **Heretic** | Default automatic deploy | [../instructions/heretic-workflow.md](../instructions/heretic-workflow.md) |
| **Abliterix** | MoE/VL/SSM presets, multi-objective | [../techniques/extended-abliteration-toolkit.md](../techniques/extended-abliteration-toolkit.md) |
| **llm-abliteration + DECCP** | Sharded 20B+, multilingual measure | [../instructions/low-vram-abliteration.md](../instructions/low-vram-abliteration.md) |
| **ErisForge** | Quick layer-band prototype | [../techniques/layer-selective-abliteration.md](../techniques/layer-selective-abliteration.md) |
| **FailSpy/abliterator** | TransformerLens notebooks | [../techniques/beyond-single-direction.md](../techniques/beyond-single-direction.md) §6 |
| **COSMIC** | Output-independent direction ID | This page §6 |
| **refusal_direction** | Paper reproduction | [../methods/manual-transformers-pipeline.md](../methods/manual-transformers-pipeline.md) |
| **spkgyk/abliteration** | Pure PyTorch hooks (no TransformerLens) | Community — verify arch |
| **RumiAllbert/llm-abliterator** | Prompt-induced variants | Research only |

---

## Quick glossary

| Term | Meaning |
|------|---------|
| **DIM / mean-difference** | `r = norm(mean(harmful) − mean(harmless))` |
| **Abliteration** | Bake direction removal into **weights** (permanent) |
| **Steering** | Add/subtract direction at **inference** (reversible) |
| **Projected** | Remove only refusal ⊥ harmless subspace |
| **Over-refusal** | Refusing **benign** prompts (factory `wmic` case) |
| **KL drift** | Harmless outputs change distribution after edit |

---

## Related

- [research-landscape.md](research-landscape.md) — taxonomy + decision tree
- [../references.md](../references.md) — full citation table
- [../techniques/README.md](../techniques/README.md) — technique index