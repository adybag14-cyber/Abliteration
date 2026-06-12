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

## Comparison matrix

| Technique | Alters weights | Needs dataset | Typical difficulty |
|-----------|----------------|---------------|------------------|
| Inference ablation | No | Small | ★★☆☆☆ |
| Mean-diff + MLP edit | Yes | Medium | ★★★☆☆ |
| Layer search (Heretic) | Yes | Medium | ★★☆☆☆ (tooling) |
| Domain-specific | Yes | Large (filtered) | ★★★★☆ |