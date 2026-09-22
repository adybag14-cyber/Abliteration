# September 2026 research refresh

Verified on **2026-09-22**. The [August 50-paper catalog](../sources/research/catalog-2026.json)
and its [guide](research-2026-update.md) are preserved unchanged. This update adds
[14 primary records](../sources/research/catalog-2026-09.json), including the
September DDO paper and previously missing earlier connections. "Added in
September" does not mean "published in September."

The machine-readable entries include title, authors, publication date, version
URL, retrieved date, source-page digest, methodological scope, and a short
editorial implication. These are primary references, not claims of independent
replication. Paper-specific LoMC, NeST, DDO, and ART implementations are not
silently substituted with the repository's generic mathematical operators.

## Reading route

| Question | Primary reference | Why it matters here |
| --- | --- | --- |
| Can the editable support be localized first? | [LoMC](https://arxiv.org/abs/2606.13709) | Support selection and direction estimation are different decisions; MoE scope must be respected. |
| Can training affect a small neuron subset? | [NeST](https://arxiv.org/abs/2602.16835) | A localized safety-strengthening method, distinct from selected-matrix SFT. |
| Can the estimator select the wrong feature? | [DDO](https://arxiv.org/abs/2609.16204) | Separation does not establish causal control. |
| Do fine-tuning defenses cover weight edits? | [ART study](https://arxiv.org/abs/2605.26526) | Evaluate more than a single intervention family. |
| Does a refusal phrase imply a safe answer? | [Refusal-cue shortcut](https://arxiv.org/abs/2608.03201) | Lexical screening cannot replace semantic judging. |
| Do static checks predict adaptive robustness? | [SkillSafe-Bench](https://arxiv.org/abs/2608.08542) | Keep capability, refusal, and robustness as separate axes. |
| What changes when the model operates tools? | [ToolAlignBench](https://arxiv.org/abs/2607.14285) | Agent behavior needs its own tests. |
| How can representations be scored? | [SafeVec / RAS](https://arxiv.org/abs/2606.25750) | A calibrated representation metric is different from a raw norm. |
| Why does update selectivity vary? | [Pretraining curricula](https://arxiv.org/abs/2607.04846) | Controlled evidence links learning history and circuit separation. |
| How should legitimate sensitive work be evaluated? | [TF-RefusalBench](https://arxiv.org/abs/2606.23375) | Refusal and task faithfulness require separate measures across languages. |
| Are SFT, RLVR, and ablation equivalent? | [Behind Harmful Compliance](https://arxiv.org/abs/2604.18510) | Similar compliance can conceal different collateral effects. |
| Is refusal geometry the same as harmfulness geometry? | [From Refusal Geometry to Safety Geometry](https://arxiv.org/abs/2606.16349) | Representation and behavior can diverge during training. |
| Does matching contrast topics always help? | [Topic-matched baseline failure](https://arxiv.org/abs/2603.22061) | Record estimator failures instead of assuming a better-sounding baseline works. |
| How do multiple directions and layer selection interact? | [Gabliteration](https://arxiv.org/abs/2512.18901) | Adds a historical connection to adaptive multidirectional edits. |

## Reproduce the metadata refresh

```bash
python scripts/refresh-research-catalog.py \
  --seeds data/research-refresh-seeds.json \
  --output sources/research/catalog-NEW-DATE.json
```

The helper refuses an existing output path. Edit and review a new seed list,
fetch canonical primary metadata, validate the resulting catalog, and only then
add it to the site's combined index. Discovery never enables an untested method
or downloads executable paper code. Original research snapshots remain readable.

The [selective-method guide](selective-methods-2026.md) and
[MiniCPM5 example](minicpm5-selective-study.md) distinguish implemented controls
from paper-specific algorithms and report measured results without assuming the
unverified 98% figure.
