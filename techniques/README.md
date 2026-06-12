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

## 13. Projected & norm-preserving abliteration

Jim Lai refinements — `orthogonalize_direction`, `row_normalization = full`. Default in Heretic.

→ [projected-norm-preserving-abliteration.md](projected-norm-preserving-abliteration.md)

## 14. Geometric median & winsorization

Robust direction estimation; tame massive activations.

→ [geometric-median-winsorization.md](geometric-median-winsorization.md)

## 15. Beyond single direction (multi-D, RDO, SAE)

Concept cones, gradient RDO, sparse autoencoder refusal latents, multi-direction PCA.

→ [beyond-single-direction.md](beyond-single-direction.md)

## 16. MoE & hybrid architectures

Per-expert `down_proj`, linear attention `out_proj`.

→ [moe-hybrid-abliteration.md](moe-hybrid-abliteration.md)

## 17. Steering & alternatives

RepE, circuit breakers (defensive), OAS, fine-tune baselines.

→ [steering-and-alternatives.md](steering-and-alternatives.md)

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

\* SAE ablation can be baked to weights in advanced pipelines.