# Techniques catalog

Conceptual **what-you-can-do** list. Implementation details live in [../methods/README.md](../methods/README.md).

## 1. Mean-difference refusal direction

Estimate `r = norm(E[h|harmful] - E[h|harmless])` per layer.

- ✅ Simple, fast, interpretable
- ❌ Sensitive to dataset quality

→ [mean-difference-direction.md](mean-difference-direction.md)

## 2. Inference-time directional ablation

Subtract `(h·r)r` during forward pass; weights unchanged.

- ✅ Reversible, safe experimentation
- ❌ Must keep hook infrastructure at inference

→ [inference-directional-ablation.md](inference-directional-ablation.md)

## 3. MLP output abliteration (weight edit)

Project `W_down` (or `down_proj`) orthogonal to `r`.

- ✅ Most common permanent uncensoring recipe
- ❌ Can harm capabilities if overdosed

→ See [../methods/mlp-down-proj-abliteration.md](../methods/mlp-down-proj-abliteration.md)

## 4. Attention output abliteration

Target `o_proj` instead of MLP — sometimes complementary.

→ [../methods/attention-o-proj-abliteration.md](../methods/attention-o-proj-abliteration.md)

## 5. Layer-selective abliteration

Only ablate layers `{L_min…L_max}` or auto-search with Heretic.

→ [layer-selective-abliteration.md](layer-selective-abliteration.md)

## 6. Partial-strength abliteration

Use `W' = W - α · projection(W)` with `α ∈ (0,1)`.

→ [partial-strength-abliteration.md](partial-strength-abliteration.md)

## 7. Domain-specific abliteration

Estimate `r` only on activations from a **topic slice** (e.g. creative writing).

→ [domain-specific-abliteration.md](domain-specific-abliteration.md)

## 8. W2SV / rank-1 weight patches

Low-rank update derived from activation statistics — alternative parameterization.

→ [w2sv-rank1-patch.md](w2sv-rank1-patch.md)

## 9. QLoRA loading for abliteration (4-bit measure)

Load base weights in NF4 so direction estimation and Heretic Optuna fit on **8–12 GB** GPUs. Not SGD training — compressed forward passes only.

→ [lora-qlora-abliteration.md](lora-qlora-abliteration.md) · [../instructions/low-vram-abliteration.md](../instructions/low-vram-abliteration.md)

## 10. Heretic norm-preserving LoRA (export)

`row_normalization = "full"` embeds a rank-r LoRA correction when orthogonalizing `o_proj` / `down_proj`.

→ [lora-qlora-abliteration.md](lora-qlora-abliteration.md)

## 11. LoRA adapter export (ΔW factorization)

Ship megabyte-scale PEFT adapter instead of full abliterated checkpoint; inference = 4-bit base + adapter.

→ [lora-qlora-abliteration.md](lora-qlora-abliteration.md) · [../methods/lora-adapter-export.md](../methods/lora-adapter-export.md)

## 12. QLoRA tool-repair (post-abliteration)

Jarvis SFT/DPO on tool-call JSONL — fixes residual false refusals on `wmic` / `nmap`; uses standard QLoRA training.

→ [../instructions/agentic-security-stack.md](../instructions/agentic-security-stack.md)

## 13. Projected & norm-preserving abliteration (T03)

Jim Lai refinements — `orthogonalize_direction`, `row_normalization = full`. Default in Heretic.

→ [projected-norm-preserving-abliteration.md](projected-norm-preserving-abliteration.md)

**T03 foundation note + catalog cross-link:** See T03/T08 table rows, cross-technique guidance (orthogonalize + row_normalization for MoE), and "always start MoE by reviewing T03 first" in [../docs/advanced-techniques-catalog.md](../docs/advanced-techniques-catalog.md) (which references this overview for high-level context) and [../instructions/eval-driven-workflow.md](../instructions/eval-driven-workflow.md) (T17 eval alignment used with these stacks). High-level selection + production use cases (factory/pentest/CyberGym) live in [../docs/overview.md](../docs/overview.md) "Advanced methods" and "Production use cases" sections (this README is the practical techniques entry point).

**Eval-driven usage (T17):** When applying projected/norm-preserving (T03) to production agents, align `[bad_prompts]` / `[good_prompts]` via the eval-driven workflow (factory, cybergym-subset, platform-eval, jarvis-safe) and run `npm run eval:stats` + post-abliteration gates before export. See overview advanced methods table + [../docs/advanced-techniques-catalog.md](../docs/advanced-techniques-catalog.md). Pair with T08 for hybrid models.

## 14. Geometric median & winsorization

Robust direction estimation; tame massive activations.

→ [geometric-median-winsorization.md](geometric-median-winsorization.md)

## 15. Beyond single direction (multi-D, RDO, SAE)

Concept cones, gradient RDO, sparse autoencoder refusal latents, multi-direction PCA.

→ [beyond-single-direction.md](beyond-single-direction.md)

## 16. MoE & hybrid architectures (T08)

Per-expert `down_proj`, linear attention `out_proj`.

→ [moe-hybrid-abliteration.md](moe-hybrid-abliteration.md)

**T08 + T03 cross-link:** Builds on projected + norm-preserving (T03). See T03/T08 rows (explicit cross-links, dedicated guidance section, recommended MoE config, module targets) in [../docs/advanced-techniques-catalog.md](../docs/advanced-techniques-catalog.md) (catalog mentions overview for pipeline). Pair with [../instructions/eval-driven-workflow.md](../instructions/eval-driven-workflow.md) for MoE eval alignment. See [../docs/overview.md](../docs/overview.md) for the "Production default stack (T03 + T08 + T17)" guidance and use-case tie-ins.

**Eval-driven usage (T17) for MoE/hybrid:** Per-expert changes can shift routing and capability; always gate MoE ablations with deploy-specific corpora (factory-firmware, osint-pentest, cybergym) + XSTest over-refusal before/after. Full details in catalog T08 section and [../instructions/eval-driven-workflow.md](../instructions/eval-driven-workflow.md). See also [../docs/overview.md](../docs/overview.md) advanced methods for T03/T08 selection guidance.

## 17. Steering & alternatives

RepE, circuit breakers (defensive), OAS, fine-tune baselines.

→ [steering-and-alternatives.md](steering-and-alternatives.md)

## 18. Thinking-model / CoT handling

Strip `chain_of_thought` blocks before refusal scoring; longer `max_response_length`.

→ [thinking-model-abliteration.md](thinking-model-abliteration.md) · [../instructions/thinking-models-guide.md](../instructions/thinking-models-guide.md)

## 19. Kernel shaping & depth profiles

Heretic Optuna searches `max_weight_position`, kernel width, per-layer amplitude.

→ [kernel-shaping-depth-profile.md](kernel-shaping-depth-profile.md)

## 20. Iterative & multi-pass abliteration

Second pass for factory refusals; partial α stacking with eval gates.

→ [iterative-abliteration.md](iterative-abliteration.md)

## 21. Eval-driven measurement

Align `[bad_prompts]` with deploy JSONL; XSTest over-refusal checks.

→ [eval-driven-abliteration.md](eval-driven-abliteration.md) · [../instructions/eval-driven-workflow.md](../instructions/eval-driven-workflow.md)

## 22. Refusal marker tuning

Customize `refusal_markers` for tool-refusal phrasing and multilingual models.

→ [refusal-marker-tuning.md](refusal-marker-tuning.md)

## 23. Model family playbook

Qwen, Gemma, Llama, MoE, VL — per-family targets and configs.

→ [model-family-playbook.md](model-family-playbook.md) · [../instructions/model-family-guide.md](../instructions/model-family-guide.md)

## 24. Vision / multimodal

Text-trunk abliteration for VLMs; mmproj export notes.

→ [vision-multimodal-abliteration.md](vision-multimodal-abliteration.md)

## Comparison matrix

| Technique | Alters weights | Needs dataset | Typical difficulty |
|-----------|----------------|---------------|------------------|
| Inference ablation | No | Small | ★★☆☆☆ |
| Mean-diff + MLP edit | Yes | Medium | ★★★☆☆ |
| Layer search (Heretic) | Yes | Medium | ★★☆☆☆ (tooling) |
| Domain-specific | Yes | Large (filtered) | ★★★★☆ |
| QLoRA 4-bit measure (Heretic/bnb) | Yes | Small | ★★☆☆☆ |
| LoRA adapter export | Adapter only | After abliteration | ★★★☆☆ |
| QLoRA Jarvis repair | Adapter | 48k tool rows | ★★★☆☆ |
| Projected + norm-preserving | Yes | Medium | ★★☆☆☆ (config) |
| Multi-direction / RDO | Yes | Large | ★★★★☆ |
| MoE per-expert | Yes | Medium | ★★★★☆ |
| SAE latent steering | No* | Large | ★★★★★ |
| RepE inference steer | No | Small | ★★☆☆☆ |
| Thinking-model CoT skips | Yes | Small | ★★★☆☆ |
| Eval-driven custom prompts | Yes | Custom JSONL | ★★☆☆☆ |
| Iterative multi-pass | Yes | Per pass | ★★★☆☆ |
| Kernel depth shaping | Yes | Medium | ★★☆☆☆ (Heretic auto) |

\* SAE ablation can be baked to weights in advanced pipelines.

## Config profiles (handbook)

| Profile | File | Use |
|---------|------|-----|
| Low VRAM 8 GB | `sources/heretic-tools/config.low-vram.toml` | Qwen 1.5B / 4B 4-bit |
| Production agent | `sources/heretic-tools/config.production.toml` | 12–24 GB |
| Thinking / CoT | `sources/heretic-tools/config.thinking-model.toml` | Qwen3-Thinking, R1 |
| Factory QA domain | `sources/heretic-tools/config.factory-qa.toml` | WMI/firmware bench |

## Evidence-based tool choice

Cross-architecture benchmark (Heretic vs DECCP vs ErisForge vs FailSpy, GSM8K sensitivity): [../docs/comparative-abliteration-benchmarks.md](../docs/comparative-abliteration-benchmarks.md) · [arXiv:2512.13655](https://arxiv.org/abs/2512.13655)

Extended toolkit (Abliterix, ErisForge, Nous/DECCP, FailSpy — placement + commands): [extended-abliteration-toolkit.md](extended-abliteration-toolkit.md)

Eval gates and corpora: [eval-driven-abliteration.md](eval-driven-abliteration.md) · `npm run eval:stats`