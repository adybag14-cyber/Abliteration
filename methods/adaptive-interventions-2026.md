# Adaptive interventions and ARA: an October 2026 method map

Checked **2026-10-05**. This chapter separates methods that are often grouped under "advanced abliteration." It adds research context, not new implementations to the C++ toy CLI or the selective-checkpoint tools.

## Choose the intervention object first

| Family | What changes | Evidence and practical distinction |
| --- | --- | --- |
| Fixed-direction or subspace projection | A selected activation or weight component | Existing [projected pipeline](projected-llm-abliteration.md) and [subspace guide](svd-refusal-subspace.md). A basis and scope must be validated causally. |
| Kernelized Activation Steering | An input-dependent activation field | [KAS](https://arxiv.org/abs/2610.01062v1) generalizes a constant direction through kernels. A nonlinear field cannot be assumed equivalent to one global weight projection. |
| Context-conditioned adaptation | Learned attention-projection changes | [MetaSteer](https://arxiv.org/abs/2609.38718v1) trains from preference data and studies transfer. This differs from training-free subtraction; implementation release was still described as forthcoming. |
| Selective representation editing | An editable value code with semantic content held fixed | [Values as Style](https://arxiv.org/abs/2609.39701v1) motivates semantic-preservation controls. Its two-backbone evidence is not a general preservation guarantee. |
| Module-I/O optimization | A fitted module update | Heretic development's ARA uses captured input/output data rather than extracting one refusal direction. The exact development revision matters. |
| Adaptive safety steering / probe training | Stronger refusal or alignment | [CAM-Steer](https://arxiv.org/abs/2609.34514v2) and [probe-guided alignment](https://arxiv.org/abs/2609.38645v2) are defensive comparisons, not removal recipes. |

## Arbitrary-Rank Ablation in Heretic development

The inspected [ARA source](https://github.com/p-e-w/heretic/blob/208c0ca35b3feade91dc74755cb80b529affa325/src/heretic/modifiers/ara.py) uses module I/O, a preservation/steering objective, low-rank adapters and L-BFGS optimization. It is not the same algorithm as subtracting a single normalized direction or removing the first few singular vectors.

For a pedagogical linear module, let `W` have shape `[d_out, d_in]` and row-batched inputs `X` have shape `[n, d_in]`. Then `Y = X Wᵀ`. A rank-`r` adapter can express `ΔW = B A` with `A: [r, d_in]` and `B: [d_out, r]`. These shapes explain the adapter parameterization; they are not a complete reproduction of the upstream implementation or a guarantee about non-linear/MoE modules.

The current source includes row-magnitude preservation and configurable rank. Neither bounds every downstream capability change. Separate calibration and held-out prompts, verify module layout/orientation, check finite losses and outputs, and compare the exported model with the scored trial.

### Trial reset is part of the experiment

[Heretic PR #476](https://github.com/p-e-w/heretic/pull/476), merged October 4 as `208c0ca`, fixes adapter state carried between trials. The reported symptoms include restored ARA results differing from their scores and exported adapter hash mismatches. Record the full revision and seed, start trials from clean state, and verify the selected export rather than assuming its label reproduces the study.

The earlier [ARA proposal #211](https://github.com/p-e-w/heretic/pull/211) was closed without a merge. The current source file, rather than the old proposal's status or early performance claims, establishes what code was inspected.

[Heretic v1.4.0](https://github.com/p-e-w/heretic/releases/tag/v1.4.0) remains the latest stable release verified for this edition; its source tree does not contain the development modifier layout. Keep development experiments in a separate pinned environment. The handbook has not benchmarked ARA or promoted the development revision to the stable install path.

## Controls that apply across these families

- **Localization is not durability.** [Refusal Localizes, the Damage Relocates](https://arxiv.org/abs/2610.00320v1) shows that successful recovery/localization can coexist with failures under changed training conditions. Evaluate adaptation explicitly.
- **Geometry is not the complete outcome.** A preserved norm or separable probe does not establish factual consistency, calibrated confidence or retained tool behaviour.
- **Test interaction modes.** [Tool Mediation](https://arxiv.org/abs/2609.35117v1) motivates a separate tool-mediated evaluation instead of extrapolating chat results.
- **Measure uncertainty.** [Refusal stochasticity](https://arxiv.org/abs/2609.33743v1) motivates repetitions near unstable decisions; its sample-size observations are not a universal default.
- **Do not invent a shared publisher algorithm.** [Huihui card evidence](../docs/tools/huihui-ai.md) contains useful per-variant disclosures, but a publisher label does not replace code, data and export provenance.

Use [contrast-set design](contrast-set-design.md), [causal diagnostics](direction-diagnostics-and-localization.md), [experiment manifests](../docs/experiment-provenance.md) and [paired evaluation](../docs/evaluation.md) to turn a candidate method into a reviewable experiment.
