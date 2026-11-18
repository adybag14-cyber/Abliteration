# November 2026 research update

Verified through **18 November 2026**. Eight primary preprints first submitted this month bring the Research Explorer to **80 papers**. The [November catalogue](../sources/research/catalog-2026-11.json) records versioned URLs, retrieval dates, source digests and the limits of each result. The findings below are author-reported.

## New primary evidence

| Record | What the paper adds | What to check in your own evaluation |
| --- | --- | --- |
| [TopoSteer, 2611.01493v1](https://arxiv.org/abs/2611.01493v1) | A layer selector ranks standardized paired-activation displacements by minimum-spanning-tree length. The intervention still uses the raw mean-difference direction. | Compare candidate layers on separate prompts. The reported study covers persona tasks. |
| [Sparse Internal Control, 2611.04349v1](https://arxiv.org/abs/2611.04349v1) | Driver-OMP and Coverage-Driver choose small sets of internal sites to reconstruct a target response or cover more prompts. | Report fixed training directions alongside pair-specific directions. The held-out fixed-dose refusal criterion passed in zero of eight seeds for all three tested selectors in both conditions. |
| [Addition by Subtraction, 2611.06553v1](https://arxiv.org/abs/2611.06553v1) | Removing identified safety-critical neurons during preference training encourages behavior to be represented by other parts of the model. The authors evaluated four models. | Measure robustness under several interventions and keep capability measurements alongside it. |
| [Preventative Persona Steering Audit, 2611.17620v1](https://arxiv.org/abs/2611.17620v1) | Steering sycophancy and hallucination during fine-tuning affected refusal behavior in a trait-dependent way across the three tested models. | Record refusal, coherence, trait expression and task utility separately. |
| [Matched Heretic comparison, 2611.17846v1](https://arxiv.org/abs/2611.17846v1) | Five pairs of model releases produce different conclusions depending on the pair, edit family, cohort and divergence budget. | Keep the comparison matched and repeat stochastic trials. The paper bases each pairwise ARA verdict on one ARA run. |
| [Centered Ablation, 2611.20148v1](https://arxiv.org/abs/2611.20148v1) | Removing the common-mode component of the final-layer direction changes the behavior of the intervention. The authors observed less repetition and fewer benign rewrites in their affected settings. | Measure degeneration and fluent response outcomes independently. The two judges in the paper disagree sharply on collapsed text. |
| [Refusal Register, 2611.20405v1](https://arxiv.org/abs/2611.20405v1) | Interventions changed how two Gemma 2 models worded refusals while the refusals continued. | Score the answer decision and linguistic register separately. Distinct geometric directions still require causal controls. |
| [Abstention Direction, 2611.20441v1](https://arxiv.org/abs/2611.20441v1) | Counterfactual pairs for ambiguous queries, missing knowledge and value disagreement show cross-category effects under middle-layer steering. | Check whether a change also affects justified uncertainty and helpful clarification. |

The [November methods chapter](../methods/activation-control-november-2026.md) explains the layer score, centered projection, sparse control and matched evaluation procedure. It links each method to its measured scope.

## Heretic release evidence

**Heretic 2.0.0**, released 1 November, ships Arbitrary-Rank Ablation (ARA) under the modifier plugin system. Its configuration schema changed for 2.x. Upstream directs users of the former research features to Lophius. Pin the 1.x environment when replaying a 1.x result and use the migration guide for a 2.x comparison. [2.0 release notes](https://github.com/p-e-w/heretic/releases/tag/v2.0.0) · [Migration guide at v2.1.0](https://github.com/p-e-w/heretic/blob/v2.1.0/docs/migration_v1_to_v2.md)

**Heretic 2.1.0**, released 8 November, adds a response-length scorer and corrects plugin-setting export and handles reset errors during export. Measure response length alongside semantic outcomes and degeneration. Record the actual modifier, scorer configuration and exported artifact when comparing trials. [2.1 release notes](https://github.com/p-e-w/heretic/releases/tag/v2.1.0) · [PyPI 2.1.0](https://pypi.org/project/heretic-llm/2.1.0/) · [Release provenance](../sources/research/tooling-2026-11.json)

## Source verification

Exa searches covered intervention design, causal mechanisms and evaluation. The catalogue was generated from canonical arXiv citation metadata, with the versioned methods and limitations checked against the primary records. The [August](research-2026-update.md), [September](research-september-2026.md) and [October](research-october-2026.md) maps give the earlier evidence.

To retrieve the metadata in a fresh file, run the repository's catalogue generator and validate the checked-in records.

```bash
python scripts/refresh-research-catalog.py \
  --seeds data/research-refresh-2026-11-seeds.json \
  --output research-catalog-verify.json
npm run research:validate
```

arXiv pages can acquire revisions and change byte-for-byte. Compare the paper ID, version, submission date and content before adopting a newer retrieval.
