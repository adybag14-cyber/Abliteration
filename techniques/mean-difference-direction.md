# Mean-difference refusal direction (DIM / Arditi)

## Idea

Refusal is associated with a shift in average activation. Estimate that shift per layer.

## Procedure

1. Collect two prompt sets of equal size (N ≥ 64 recommended):
   - **Set A** — prompts that elicit refusals on the base model
   - **Set B** — unmatched harmless prompts that get compliance (alpaca-style; not topic-matched pairs)
2. Run forward pass; hook residual at layer ℓ (post-block or post-MLP — pick one)
3. For each prompt, take hidden state vector `h` at chosen token position
4. Compute:

```
μ_A^ℓ = mean of h for Set A
μ_B^ℓ = mean of h for Set B
r_ℓ    = (μ_A^ℓ - μ_B^ℓ) / ||μ_A^ℓ - μ_B^ℓ||
```

5. Store `{r_ℓ}` for all layers you intend to modify

## Dataset tips

- Default: unmatched harmful vs alpaca-style harmless (Petrov 2026, arXiv:2603.22061: topic-matched pairs can cancel `r`)
- Topic-matched pairs (*"Write a story about X"* vs *"Write explicit content about X"*) are an experiment, not the baseline
- Avoid duplicate near-copies — biases mean

## Outputs

- `directions.pt` or JSON: `{layer_idx: [d_model floats]}`
- Metadata: model revision, hook point, token index strategy

---

## ErisForge `ExpressionRefusalScorer`

[ErisForge](https://github.com/Tsadoq/ErisForge) implements the same mean-difference intuition with a built-in scorer — useful for **quick layer-band experiments** without writing custom hooks:

1. Collect harmful/harmless sets (unmatched by default; or use upstream examples).
2. Compute per-layer separation signal.
3. Apply `AblationDecoderLayer` on the peak band only.

Pairs with [layer-selective-abliteration.md](layer-selective-abliteration.md#erisforge--quick-prototyping) and [extended-abliteration-toolkit.md](extended-abliteration-toolkit.md).

For deeper mechanistic control (caching, temp hooks), use [FailSpy/abliterator](https://github.com/FailSpy/abliterator) → [beyond-single-direction.md](beyond-single-direction.md#6-mechanistic-tools-failspyabliterator).