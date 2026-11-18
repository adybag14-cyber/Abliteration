# Activation control practices from November 2026

Start with two questions. Which intervention fits the behavior you want to study, and which held-out outcome would show that it worked? November's evidence gives distinct tools for choosing layers, diagnosing a final-layer projection, and checking what a model actually did. [November primary-source map](../docs/research-november-2026.md)

| Research question | Method to consider | Outcome to record |
| --- | --- | --- |
| Which layers should enter a controlled study? | TopoSteer layer ranking alongside separability and random baselines | Held-out behavior at the same layer budget and dose |
| Does final-layer projection distort ordinary answers? | Centered Ablation and a common-mode overlap diagnostic | Both ordinary task quality and degeneration rates |
| Can a few internal sites control a measured behavior? | Sparse internal control with a fixed training-derived direction | Off-target change, dose response and held-out reuse |
| Did a model change its decision or its wording? | Paired response and register scoring | Decision, content, register and justified abstention |
| Does a fitted checkpoint edit transfer across versions? | Matched direction-based and ARA experiments | Results by release pair, cohort, budget and repeat |

## Rank layers with displacement geometry

TopoSteer starts with paired prompts and computes a displacement between their standardized activations at a given layer. Each pair contributes one point to that layer's displacement cloud. Total degree-zero persistence is the sum of the edge lengths of the Euclidean minimum spanning tree connecting those points. Translating an already-formed cloud leaves this length unchanged. The per-layer standardization can still reflect class separation. [TopoSteer method](https://arxiv.org/html/2611.01493v1)

Select the highest-scoring layers for a fixed layer budget. The paper applies the raw mean-difference vector at the selected sites. In its sequential variant, it recomputes scores after each intervention. Record the selection order and compare the sequential and simultaneous variants at the same budget. A useful comparison holds token position, direction estimator, layer budget and intervention dose constant while varying the layer selector. Select and fit on calibration pairs, then evaluate outcomes on separate prompts. The paper evaluates persona tasks, so a refusal experiment needs its own evidence. [TopoSteer evaluation](https://arxiv.org/html/2611.01493v1)

## Diagnose a final-layer direction before changing it

In the setting described by Centered Ablation, a final-layer intervention has a fixed vocabulary footprint and an activation-dependent gate. A direction that overlaps a strong common mode can receive a large gate on ordinary inputs. This can change benign answers or induce repetition. Inspect overlap and the distribution of gate values on a reference cohort before picking the strength. [Centered Ablation, sections 3.2 and 3.3](https://arxiv.org/html/2611.20148v1)

The correction projects the direction away from the reference mean and normalizes the remainder. With unit candidate direction d and normalized reference mean m, the resulting direction is unit(d − (d · m)m). In a two-dimensional illustration with m along the first axis and d diagonal, the correction leaves a direction along the second axis. A very small remainder makes the normalization sensitive to noise, so report its norm and treat that estimate as indeterminate at your numerical tolerance. [Centered Ablation, section 3.4](https://arxiv.org/html/2611.20148v1)

The final-layer result describes inference-time behavior. Evaluate a weight edit or an earlier-layer intervention separately. In the eight-model study, the authors reported that degeneration on Gemma-2-9B fell from 50% to 1% in the tested setting, with about the same fluent-only success rate. The practical consequence is to keep the output-quality count visible even when a behavior score changes. [Centered Ablation, section 4](https://arxiv.org/html/2611.20148v1)

## Test sparse controls on held-out prompts

Treat a candidate as a site and a direction. Measuring each candidate's local effect gives a map from a sparse combination of interventions to a behavioral readout. Driver-OMP chooses candidates for reconstructing a desired change. Coverage-Driver chooses candidates for their coverage across prompts. Report the site budget, the observed response to a changed dose, and the measured effect on unrelated tasks. [Sparse Internal Control](https://arxiv.org/html/2611.04349v1)

Run a fixed-direction test using directions estimated from training data. Keep it distinct from a test that recomputes directions using each evaluation pair. The November study reports zero held-out fixed-dose refusal passes in eight seeds across the tested selectors under either direction condition. The refusal endpoint was a pre-generation lexical readout from Qwen3-1.7B. Report full-response behavior separately. The study also defines evaluation axes for target reachability, signed reversal, dose response, feedback tracking and off-target preservation. [Sparse Internal Control, appendix G.2](https://arxiv.org/html/2611.04349v1)

## Score decisions, wording and justified abstention

Use separate labels for an answer decision, the usefulness of the generated content, the wording of a refusal and an unusable generation. Use benign counterfactuals for ambiguity and missing knowledge alongside clearly answerable controls. Score whether the response asks for clarifying information, correctly expresses uncertainty or answers the task. Keep repetition, empty output and truncation visible in the denominators.

The refusal-register study changed wording while the model continued to refuse. The abstention study found shared effects across ambiguity, missing knowledge and value-disagreement contrasts. Together they show why a change in a marker word or first-token score needs a full-response assessment. [Refusal Register](https://arxiv.org/abs/2611.20405v1) · [Abstention Direction](https://arxiv.org/abs/2611.20441v1)

Hold the chat template, decoding limits and scoring rubric constant across conditions. Use paired differences and an uncertainty interval that respects which outputs came from the same prompt. If judges disagree, report the counts by judge and show how degeneration affected their scores. Track ordinary task accuracy as a separate endpoint, as the preventative persona audit recommends evaluating several safety measures even when MMLU holds. [Centered Ablation evaluation](https://arxiv.org/html/2611.20148v1) · [Preventative Persona Steering Audit](https://arxiv.org/abs/2611.17620v1)

## Compare fitted edits under a matched protocol

An ARA modifier fits a module update against captured input/output behavior. A rank-r adapter writes that update as BA, with the inner dimension r setting the rank limit. A fitted checkpoint and a runtime direction intervention need separate evidence about compute, retained behavior and artifact identity. [October ARA method background](adaptive-interventions-2026.md) · [Heretic 2.0 release](https://github.com/p-e-w/heretic/releases/tag/v2.0.0)

Heretic 2.x uses named plugins. Record the version, plugin configuration, base model revision, test-set fingerprint, tested export and the exact inference template. If comparing older and newer models, match prompt cohorts, search budget, divergence limit and scoring setup. Repeat the comparison where rank or checkpoint selection is stochastic. The November five-pair comparison shows how different cohorts or budgets can reverse the ordering, with one ARA run per reported pairwise verdict. [Heretic 2.x migration guide](https://github.com/p-e-w/heretic/blob/v2.1.0/docs/migration_v1_to_v2.md) · [Matched comparison](https://arxiv.org/abs/2611.17846v1)

Use the [evaluation protocol](../docs/evaluation.md) and [experiment provenance checklist](../docs/experiment-provenance.md) to record the results. The [November research map](../docs/research-november-2026.md) gives the scope and source for each method.
