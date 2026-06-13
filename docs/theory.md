# Theory

## Core claim (Arditi et al.)

For many aligned LLMs, whether the model **complies** or **refuses** a prompt can be predicted largely from the **scalar projection** of the residual stream onto a single direction **r** at a given layer.

If `h` is the residual vector at layer ℓ:

```
refusal_score ≈ h · r_ℓ
```

High positive projection → refusal-like internal state.  
Removing the `r_ℓ` component from activations (or preventing the layer from writing along `r_ℓ`) reduces refusal rates.

## Estimating the direction

Classic **mean-difference** estimator:

```
r_ℓ = normalize( mean(H_harmful^ℓ) - mean(H_harmless^ℓ) )
```

Where `H_harmful^ℓ` are residual vectors collected on prompts that trigger refusals, and `H_harmless^ℓ` are matched benign prompts.

**Practical tips:**

- Use **paired** prompts (same topic, different framing) when possible
- Collect activations at **specific hook points**: post-attention residual, post-MLP residual, or sublayer outputs
- Average over **last token** or **prompt tokens** depending on recipe — be consistent
- L2-normalize `r_ℓ` before applying to weights

## Baking into weights (intuition)

If a linear layer writes `W x` into the residual stream, and you want to stop it from ever adding component along `r`, you can apply a projection operator:

```
P_⊥ = I - r rᵀ   (for unit r)
W' = P_⊥ W      (or analogous on output matrices)
```

Different implementations target:

- **MLP `down_proj`** — most common in public recipes
- **Attention `o_proj`**
- **Entire block output** via low-rank patch (W2SV)

The edit is **linear-algebraic** — not gradient descent.

## Layer selection

Not all layers contribute equally. Typical pattern:

- Early layers: semantics / parsing
- **Middle-to-late layers**: strongest refusal direction signal
- Final layers: output logits shaping

Automated tools (Heretic) search **which layers** to ablate and **strength** hyperparameters.

## Capability preservation

Refusal directions sometimes **overlap** with useful features (helpfulness, caution on ambiguous medical/legal queries). Over-ablating causes:

- Gibberish or repetition
- Loss of instruction following
- Increased hallucination rate

**Mitigation:** ablate fewer layers, use partial strength `α ∈ (0,1)`, or domain-specific directions.

## Projected & norm-preserving edits

**Projected abliteration** (Lai 2025): compute refusal direction with harmless component removed:

```
g = normalize(mean(H_harmless))
r_raw = mean(H_harmful) - mean(H_harmless)
r = normalize(r_raw - (r_raw · g) g)
```

Only the component of refusal **orthogonal to helpful behavior** is suppressed — lowers KL vs raw Arditi.

**Norm-preserving:** rescale rows of `W'` to match `‖W[i,:]‖` before and after ablation (biprojected). Heretic `row_normalization = full` approximates via rank-r LoRA.

→ [../techniques/projected-norm-preserving-abliteration.md](../techniques/projected-norm-preserving-abliteration.md)

Acceptance gates for projected / norm-preserving exports: score against deploy corpora in [../instructions/eval-driven-workflow.md](../instructions/eval-driven-workflow.md) (factory, XSTest over-refusal, platform-eval) before promoting to production agents.

## Beyond a single direction

Recent work ([QCRI 2026](https://arxiv.org/html/2602.02132v1), [TUM concept cones](https://arxiv.org/html/2502.17420v2)) shows:

- Multiple **geometrically distinct** refusal directions exist (safety, over-refusal, incomplete requests, …).
- Linear ablation along any one direction still acts as a **shared refusal knob** for rate trade-offs.
- Refusal may occupy **multi-dimensional cones** — gradient RDO and multi-direction subspace ablation are refinements when DIM fails.

For agent deployments, **domain-specific** harmful/harmless pairs (factory WMI vs cyber lab) often matter more than multi-direction math.

→ [../techniques/beyond-single-direction.md](../techniques/beyond-single-direction.md) · [research-landscape.md](research-landscape.md)

## Robust estimation

- **Geometric median** centroids (`r*` vs `r`) reduce outlier prompt influence.
- **Winsorization** clamps massive activation spikes before mean (Gemma-class models).

→ [../techniques/geometric-median-winsorization.md](../techniques/geometric-median-winsorization.md)

## MoE & hybrid blocks

Refusal writes propagate through **each expert's** `down_proj` independently. Abliteration must touch all experts on MoE layers, and `linear_attn.out_proj` on hybrid layers.

→ [../techniques/moe-hybrid-abliteration.md](../techniques/moe-hybrid-abliteration.md)

## Further reading

See [../references.md](../references.md) for papers and implementations.  
Advanced catalog: [advanced-techniques-catalog.md](advanced-techniques-catalog.md)