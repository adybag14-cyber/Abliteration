# Mean-difference refusal direction

## Idea

Refusal is associated with a shift in average activation. Estimate that shift per layer.

## Procedure

1. Collect two prompt sets of equal size (N ≥ 64 recommended):
   - **Set A** — prompts that elicit refusals on the base model
   - **Set B** — structurally similar but benign prompts that get compliance
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

- Pair prompts: *"Write a story about X"* vs *"Write explicit content about X"*
- Include **false-refusal** benign prompts (model refuses unnecessarily) in Set B analysis
- Avoid duplicate near-copies — biases mean

## Outputs

- `directions.pt` or JSON: `{layer_idx: [d_model floats]}`
- Metadata: model revision, hook point, token index strategy