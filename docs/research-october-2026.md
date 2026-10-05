# October 2026 research refresh

Verified on **2026-10-05**. This edition adds [eight primary records](../sources/research/catalog-2026-10.json), bringing the searchable catalog to **72 papers**. The August 50-paper and September 14-paper snapshots remain unchanged.

The new papers were submitted between 27 September and 1 October. Inclusion means the primary record and its scope were checked; it does not mean this repository independently reproduced the results. Versioned citations, source-page digests, limitations and implementation status are recorded in the catalog.

## What changed in the research map

| Primary record | Contribution | Boundary to preserve |
| --- | --- | --- |
| [Kernelized Activation Steering — 2610.01062v1](https://arxiv.org/abs/2610.01062v1) | Replaces a single fixed vector with an activation-dependent kernel steering field. | Training-free activation control is not automatically a permanent weight-editing recipe. |
| [MetaSteer — 2609.38718v1](https://arxiv.org/abs/2609.38718v1) | Learns context-dependent attention-projection interventions from preference data. | The inspected abstract says code/checkpoints are forthcoming. Its transfer results are not a reproduction in this handbook. |
| [Values as Style — 2609.39701v1](https://arxiv.org/abs/2609.39701v1) | Separates editable value representations from semantic content on two tested backbones. | Preserving the intended topic, facts and constraints must be measured separately from changing behaviour. |
| [Refusal Localizes, the Damage Relocates — 2610.00320v1](https://arxiv.org/abs/2610.00320v1) | Tests whether localized recovery and spectral repair survive changed fine-tuning conditions. | A recoverable layer or successful repair is not a durable defense against adaptation. |
| [Tool Mediation Alters Refusal Mechanisms — 2609.35117v1](https://arxiv.org/abs/2609.35117v1) | Finds different conversion of harm-related representations into refusal across chat and tool-mediated inputs. | Chat-only capability/refusal measurements do not certify an agent workflow. |
| [CAM-Steer — 2609.34514v2](https://arxiv.org/abs/2609.34514v2) | Coordinates multiple category-specific safety directions through adaptive, norm-preserving steering. | This is a defensive intervention, not evidence for stronger refusal removal. |
| [Training Against Probes — 2609.38645v2](https://arxiv.org/abs/2609.38645v2) | Compares frozen and continually updated probes as alignment-training signals. | Monitorability, probe separability and behavioural robustness are distinct claims. |
| [Accounting for Stochasticity — 2609.33743v1](https://arxiv.org/abs/2609.33743v1) | Shows why a single refusal observation can be misleading near a decision boundary. | The study's 15–25 repetition range is specific to its GPT-4.1/topic/source setup; determine sample size for the actual experiment. |

Read [adaptive interventions and ARA](../methods/adaptive-interventions-2026.md) for the method distinctions. Existing [contrast design](../methods/contrast-set-design.md), [causal diagnostics](../methods/direction-diagnostics-and-localization.md), and [paired evaluation](evaluation.md) remain the foundation.

## Huihui and tool developments

The new [huihui-ai guide](tools/huihui-ai.md) distinguishes model-card claims, selective layer choices, quantized artifact provenance, and evidence still needed for a reproducible method. [Eight pinned card records](../sources/research/huihui-2026-10.json) include recent entries and older cards with explicit revision qualifications.

Heretic's latest stable GitHub release and PyPI version remain **1.4.0** at this check. Development source `208c0ca35b3feade91dc74755cb80b529affa325` contains ARA and an October 4 fix for LoRA state carried between trials. The author reports that this state could affect restored ARA results and exported adapter hashes. The [fix](https://github.com/p-e-w/heretic/pull/476) makes trial initialization/reset explicit. Preserve the exact code revision, seed, trial parameters and exported hashes when evaluating it.

This observation does not silently upgrade the handbook's stable installation instructions. See [tooling provenance](../sources/research/tooling-2026-10.json) and the [ARA discussion](../methods/adaptive-interventions-2026.md#arbitrary-rank-ablation-in-heretic-development).

## How sources were checked

The requested Devbox Hermes discovery completed all six queries and returned **29 parsed documents against a target of 50**. Review classified 15 as this repository's own pages, three as version duplicates, and two as discovery/profile pages. They were not counted as new independent research evidence.

Built-in web search, targeted Hermes retrieval, the arXiv API, canonical citation metadata, GitHub APIs, and revision-pinned Hugging Face cards supplied complementary checks. Targeted Hermes fetching successfully retrieved the eight selected canonical paper pages. The [discovery receipt](../sources/research/discovery-2026-10.json) records coverage and exclusions. The combined search was bounded, not a claim to have exhausted all literature.

No model weights were downloaded and no new paper-specific algorithm was executed for this edition. The [existing MiniCPM5 measurements](minicpm5-selective-study.md) retain their original scope.

## Reproduce metadata acquisition

```bash
python scripts/refresh-research-catalog.py \
  --seeds data/research-refresh-2026-10-seeds.json \
  --output sources/research/catalog-NEW-DATE.json
npm run research:validate
```

Use a new output path and review any changed version before integration. A card's modification date is not a model creation date, and neither proves a new algorithm or a measured quality improvement.
