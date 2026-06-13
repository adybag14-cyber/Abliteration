# Comparative abliteration benchmarks (2026)

Evidence-based tool selection from cross-architecture evaluation research.

**Source:** Young, R. J. — [arXiv:2512.13655](https://arxiv.org/abs/2512.13655) (v2, Jan 2026) — *Comparative Analysis of LLM Abliteration Methods: A Cross-Architecture Evaluation*

---

## Tools compared

| Tool | Type | Notes from paper |
|------|------|------------------|
| **Heretic** | Bayesian Optuna + projected abliteration | Variable KL (0.043–1.646); model-dependent capability impact |
| **DECCP** | Single-pass + deccp topics | Avg GSM8K Δ **-0.13 pp** on benchmarked subset |
| **ErisForge** | Single-pass toolkit | Avg GSM8K Δ **-0.28 pp** on benchmarked subset |
| **FailSpy/abliterator** | Early single-pass | Included in 16-model compatibility matrix |

16 instruction-tuned models (7B–14B) tested for tool compatibility; quantitative metrics on tool-supported subsets.

---

## Key findings (handbook interpretation)

| Finding | Implication for deploy |
|---------|------------------------|
| **GSM8K most sensitive** | Math/reasoning drops -0.13 to **-18.81 pp** (-26.5% relative) depending on tool + architecture |
| Single-pass (ErisForge, DECCP) | Better **capability preservation** on benchmarked math subset vs some Heretic runs |
| Heretic Optuna | Better **refusal/KL co-optimization** when tuned — KL varies widely by model |
| Not one-size-fits-all | Pick tool per architecture; always eval GSM8K/MMLU on your target model |

**This handbook default:** Heretic for automatic deploy + mandatory eval gates ([eval-driven-workflow.md](../instructions/eval-driven-workflow.md)). Use llm-abliteration / ErisForge when Heretic KL is poor on a specific architecture.

---

## Recommended eval after any tool

```text
[ ] Harmful refusal rate (Heretic --evaluate-model or custom)
[ ] GSM8K or MMLU-5 subset (capability)
[ ] Factory JSONL tool_call rate
[ ] XSTest over-refusal sample ≤ 5%
[ ] KL divergence harmless set
```

---

## Slop / style abliteration (community, 2026)

Separate from refusal removal — [Reddit: abliteration reducing slop](https://www.reddit.com/r/LocalLLaMA/comments/1qa0w6c/it_works_abliteration_can_reduce_slop_without/) reports directional edits can reduce sycophantic filler **without** full uncensoring. Distinct objective — do not confuse with safety guard removal.

Heretic ships optional configs: upstream `config.noslop.toml`, `config.nohumor.toml` — sync via `npm run fetch:heretic` if added to pin list.

---

## Related

- [research-landscape.md](research-landscape.md)
- [toolchain-safetensors-gguf-lora.md](toolchain-safetensors-gguf-lora.md)
- [tools/abliteration-tooling.md](tools/abliteration-tooling.md)