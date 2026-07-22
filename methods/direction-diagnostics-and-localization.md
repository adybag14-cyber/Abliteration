# Direction diagnostics and causal localization

Use this stage between direction extraction and permanent weight editing. A
vector can separate two training activation clouds while failing to mediate the
behavior on held-out prompts. Treat geometry as a candidate generator and
intervention as the causal test.

## Required data split

Create three disjoint splits before reading activations:

| Split | Purpose |
|-------|---------|
| Train | Estimate candidate directions or subspaces |
| Selection | Choose token position, layer, rank, and strength |
| Test | Report the frozen recipe once |

Normalize prompts before splitting and group paraphrases or shared templates so
they cannot cross splits. Keep category labels for slice reporting, but do not
assume that a topically matched harmless baseline is superior: the pinned
Qwen 3.5 study found that matching could cancel the dominant usable component.
Compare baseline designs empirically on the selection split.

## Geometry checks

For each layer and candidate direction `r`:

1. Unit-normalize in FP32 and fix its sign so the harmful-minus-control score is
   positive.
2. Report mean projection, standard deviation, standardized mean difference,
   and ROC AUC on held-out activations.
3. Bootstrap prompts, not tokens, to obtain an interval for the mean difference.
4. For a multi-direction basis, report singular values, effective rank, and the
   maximum pairwise cosine before orthogonalization.
5. Compare directions across splits with absolute cosine and principal angles.

Large train separation with weak selection separation is dataset leakage or an
unstable direction, not a reason to increase ablation strength.

## Causal layer sweep

Run reversible residual hooks before changing weights. At each candidate layer:

```text
baseline generation
  -> subtract alpha * (h dot r) * r at one layer
  -> score target refusal, benign over-refusal, task quality, degeneration
  -> restore hook and continue
```

Sweep a small fixed grid such as `alpha in {0.25, 0.5, 0.75, 1.0}`. Freeze
decoding and prompt order. A layer is eligible only if the intervention changes
the target metric in the expected direction on the selection split and stays
inside all preservation gates. Then test contiguous bands; do not assume the
single best layer remains optimal after permanent projection across modules.

## Direction necessity and sufficiency

Use two complementary interventions:

- **Ablation:** remove the component along `r`; tests whether it is necessary
  for the observed refusal behavior.
- **Addition:** add a signed component along `r` to benign prompts; tests whether
  it can induce the behavior.

A direction that only separates examples but has neither held-out ablation nor
addition effect is correlational. A direction with a causal effect but severe
capability loss is real but unusable for the intended checkpoint.

## Token-position checks

Measure at the same semantic position across templates, normally the final
instruction token. Test at least one alternate position because chat templates,
vision prefixes, and thinking tags can move the signal. Record the tokenizer,
chat template hash, truncation policy, and exact position rule.

## Permanent-edit invariants

Before saving a checkpoint, verify on a tiny synthetic tensor and on one real
module:

```python
assert torch.allclose(Q.T @ W_new.float(), torch.zeros_like(Q.T @ W_new.float()), atol=1e-4)
assert torch.isfinite(W_new).all()
assert W_new.shape == W.shape
```

For partial strength, verify the removed projection norm scales approximately
with `alpha`. For norm-preserving edits, report row-norm quantiles before and
after rather than only a global mean.

## Acceptance record

Record the chosen layer band, token rule, direction rank, singular values,
strength, held-out effect interval, task-score delta, KL delta, refusal markers,
and every rejected candidate. See [../docs/evaluation.md](../docs/evaluation.md)
for behavioral gates and [multi-direction-ablation.md](multi-direction-ablation.md)
for the correct projector implementation.

## Evidence

- [Arditi et al., 2024](https://arxiv.org/abs/2406.11717) — causal refusal direction pipeline
- [Geometry of Refusal, 2025](https://arxiv.org/abs/2502.17420) — independent directions and concept cones
- [COSMIC, 2025](https://arxiv.org/abs/2506.00085) — direction and layer selection without refusal-marker dependence
- [Topic-matched baseline study, 2026](https://arxiv.org/abs/2603.22061) — matched-baseline cancellation failure
