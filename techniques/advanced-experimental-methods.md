# Advanced experimental methods

These methods extend the standard mean-difference recipe. They are research
patterns, not universal defaults. Benchmark every candidate against the simpler
single-direction projected edit and require held-out causal interventions.

## T25 — Covariance-aware directions

The raw mean difference treats every activation dimension equally. A
shrinkage-Fisher candidate instead uses:

```text
delta = mean(H_bad) - mean(H_good)
Sigma = pooled_covariance(H_bad, H_good)
r = normalize((Sigma + gamma I)^-1 delta)
```

Never form a dense inverse. Solve the regularized linear system in FP32, sweep
`gamma`, and compare against raw DIM on the selection split. With hidden width
larger than the prompt count, the unregularized result is singular and usually
unstable. Geometry improvement without a held-out intervention effect is not a
win.

## T26 — Bootstrap consensus directions

Resample prompts, estimate one direction per replicate, sign-align each to a
reference, then summarize their cosine distribution and leading consensus
component. Use the lower confidence bound on held-out intervention effect to
select a layer. Reject a candidate whose sign or layer peak changes frequently;
do not hide instability by averaging it away.

## T27 — Cross-layer direction tracking

Refusal directions can rotate with depth. Estimate `r_l` independently per
layer and report adjacent-layer cosine, held-out separation, and causal effect.
Use each layer's own basis for a permanent edit. Procrustes alignment or a
shared low-rank basis can be explored for visualization, but residual-stream
coordinates are not automatically interchangeable across layers.

## T28 — Protected capability subspaces

Orthogonalize a refusal basis against a measured capability basis before
surgery. This generalizes projection away from a single harmless mean:

```text
R_protected = (I - GG^T) R
Q = orth(R_protected)
W_new = W - alpha QQ^T W
```

See [../methods/protected-subspace-abliteration.md](../methods/protected-subspace-abliteration.md).
Protection is only as broad as the probes used to build `G`.

## T29 — Conditional inference-time ablation

Instead of removing a direction at every token, apply a reversible hook only
when a calibrated projection score crosses a threshold. Fit the threshold on a
selection split, add hysteresis if it flickers token-to-token, and log trigger
rates by cohort. This can reduce unnecessary interventions but introduces a
runtime classifier and new distribution-shift failure modes.

## T30 — Quantization-aware surgery

Do not edit packed 4-bit integers as though they were floating weights.

1. Load or dequantize the target shard to FP16/FP32.
2. Compute directions, projectors, and edits in FP32.
3. Cast/save a floating reference candidate.
4. Quantize the edited candidate with frozen calibration settings.
5. Compare both `base-float -> edited-float` and `edited-float -> edited-quant`.

Report per-channel scale changes, saturation/clipping counts when available,
row-norm quantiles, and behavioral deltas. A quantized checkpoint can fail even
when the floating edit passes.

## T31 — Router-weighted MoE diagnostics

For routed experts, weight per-expert activation and edit statistics by observed
router probability and report cohort-specific expert utilization. Compare an
all-expert edit with a smaller set of causally implicated experts, but do not
assume rarely routed experts are irrelevant: routing can change after surgery.
Evaluate router entropy, expert load, and task quality before and after.

## T32 — Pareto-front checkpoint selection

Keep refusal improvement, benign over-refusal, task loss, KL, degeneration,
latency, and artifact size as separate objectives. Discard dominated candidates
and choose from the remaining Pareto frontier using deployment gates frozen in
advance. A single weighted score can conceal a catastrophic metric; if one is
used for search, still publish every component and the nondominated set.

Use `scripts/compare-abliteration-evals.py` for paired behavioral gates and
`scripts/experiment-manifest.py` to bind each frontier point to exact bytes.

## T33 — Negative-control interventions

Build label-shuffled, random-unit-vector, wrong-layer, and sign-reversed
controls. Run them through the same hook and scoring pipeline. If a negative
control performs comparably, the claimed refusal direction may instead reflect
generic activation damage, scorer bias, or prompt leakage.

## Shared acceptance checklist

```text
[ ] train / selection / test groups are disjoint
[ ] simple projected DIM baseline included
[ ] negative controls included
[ ] reversible causal sweep passes before surgery
[ ] tensor orientation and projector invariants pass
[ ] paired cohort gates and uncertainty intervals pass
[ ] exact inputs, parameters, environment, and artifacts are hashed
```

Related: [contrast-set design](../methods/contrast-set-design.md) ·
[direction diagnostics](../methods/direction-diagnostics-and-localization.md) ·
[multi-direction implementation](../methods/multi-direction-ablation.md) ·
[experiment provenance](../docs/experiment-provenance.md)
