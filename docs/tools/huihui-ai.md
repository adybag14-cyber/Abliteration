# Huihui-ai: checkpoints, methods and evidence

Checked **2026-10-05**. Huihui-ai publishes abliterated checkpoints and quantized variants on [Hugging Face](https://huggingface.co/huihui-ai). Treat the publisher, the procedure, and each exported artifact as separate things: there is no single version-independent "huihui method" established by the inspected cards.

The [machine-readable snapshot](../../sources/research/huihui-2026-10.json) pins eight model revisions, their declared base models, card hashes, creation/modification dates and source URLs. These are publisher records, not local performance certifications.

## Concrete disclosures worth knowing

| Checkpoint / card | What the publisher reports | How to interpret it |
| --- | --- | --- |
| [Qwen3.8-27B GGUF, pinned card](https://huggingface.co/huihui-ai/Huihui-Qwen3.8-27B-abliterated-GGUF/blob/b146b417080fd3e0e842e9539e69921707360aae/README.md) | Several newer variants list layers 22–52; an older UD section lists 17–52. The card also retains earlier notes and says MTP/vision were not modified. | Ranges are zero-based and variant-specific. Record the exact file and section; do not collapse the whole repository into one layer recipe. |
| [GLM-5.3-Flash GGUF, pinned card](https://huggingface.co/huihui-ai/Huihui-GLM-5.3-Flash-abliterated-GGUF/blob/06f66b01ee15bc22b326f733fcc1518ec472e373/README.md) | Layers 15–35 are edited; other layers and expert modules are described as untouched. The card names an upstream quantized source. | This is a selective-support claim, not proof that expert preservation guarantees behavioural/capability preservation. |
| [Qwen3-4B v2](https://huggingface.co/huihui-ai/Huihui-Qwen3-4B-abliterated-v2/blob/a494c65b10bf8fdc56c0ff11d36987c1d018f162/README.md) and [14B v2](https://huggingface.co/huihui-ai/Huihui-Qwen3-14B-abliterated-v2/blob/3b79629fdd65004d3b9cdf5beb0739e8c7e1becd/README.md) | Their notes associate a layer/candidate-layer change with correcting garbled output. | Useful motivation for layer ablations and coherence checks. It is not a universal instruction to exclude layer zero. |
| [Qwen3-30B-A3B Instruct](https://huggingface.co/huihui-ai/Huihui-Qwen3-30B-A3B-Instruct-2507-abliterated/blob/e2f73ec7e99ee316beb8069ca90e4c3cbef8aa0f/README.md) | Describes a faster, improved approach while linking the Transformers-based reference implementation. | The inspected card does not supply a complete benchmarked recipe proving the comparative claim. |
| [Gemma-4-31B](https://huggingface.co/huihui-ai/Huihui-gemma-4-31B-it-abliterated/blob/2abf02b3a9cd51ce98a41d9ecd2d0d9e142ae5e6/README.md) | Claims modification of both thinking and non-thinking modes. | Evaluate both modes separately with the correct chat template; the claim is not itself a measured score. |

The Qwen3.8-27B card also describes mixed tensor types: selected tensors use Q8_0 in some K_L variants and BF16 in Q8_0_L. File names therefore do not reliably predict uniform bit width or memory use. Its Ternary section requires a specific llama.cpp fork. These are card-reported packaging/runtime constraints; they were not tested here.

## Recent entries are not necessarily new techniques

The inspected listing includes [Qwen3.8-Flash-Next](https://huggingface.co/huihui-ai/Huihui-Qwen3.8-Flash-Next-abliterated/tree/298f94632b784e26a7fe576114f82066689d5baa), [Xing4.0-29B-A4B](https://huggingface.co/huihui-ai/Huihui-Xing4.0-29B-A4B-abliterated/tree/25d14eb6346cfb83d2a22e4cbc1454366c5cc984), and the GLM variant above. The first two were created on September 29; the GLM repository on September 26. Recent modification timestamps can describe card edits, metadata fixes or replacement shards rather than new model training.

Check per-model licensing and dependencies. For example, the Flash-Next card declares a Qwen community license, so the publisher name must not be used to infer one shared license for every model.

## Reference implementation and inspection tools

Many cards link [Sumandora/remove-refusals-with-transformers at the reviewed commit](https://github.com/Sumandora/remove-refusals-with-transformers/tree/7786b0a8c50f4e7c16a0e300e697b2876decc0c6). That establishes a cited Transformers-based reference, not proof that each huihui export was generated using exactly that revision and defaults.

[huihui-support/compare_models](https://github.com/huihui-support/compare_models/tree/a1d10b38cb7242cdd67149f2b1b8df47f6c5b9da) computes mean absolute weight differences and plots them. The reviewed script accepts `--model1` and `--model2`. A heatmap can help locate changed matrices, but cannot recover the original contrast data, prove a particular edit algorithm, or establish retained capability. The [tooling record](../../sources/research/tooling-2026-10.json) preserves source hashes.

## Evaluate a candidate without confusing causes

1. Pin the base model and candidate revision, tokenizer/processor, template, inference runtime, quantization and decoding settings.
2. Compare like-for-like artifacts. A quantizer, template or prompt-format change can mimic an abliteration effect.
3. Test task quality, false refusals, coherence, languages, thinking modes and tool use separately.
4. For a selective-edit claim, inspect tensor names/shapes and record changed versus unselected tensors. Weight similarity is not behavioural equivalence.
5. Report repeated measurements where sampling matters, together with uncertainty and failure cases.
6. Keep an original checkpoint and a rollback path; apply the existing [evaluation gates](../evaluation.md) before treating a community release as suitable for a deployment.

The source snapshot records exactly what was checked. It does not rank these checkpoints or claim the latest upload is the best choice.
