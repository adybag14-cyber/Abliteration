# Comparative abliteration benchmarks (2026)

Evidence-based tool selection from cross-architecture evaluation research.

**Source:** Young, R. J. — [arXiv:2512.13655](https://arxiv.org/abs/2512.13655) (v2, Jan 2026) — *Comparative Analysis of LLM Abliteration Methods: A Cross-Architecture Evaluation*

**Repo PDF:** [../sources/research/papers/arxiv-2512.13655.pdf](../sources/research/papers/arxiv-2512.13655.pdf) · **Comparison repo:** [github.com/ricyoung/abliteration-comparison](https://github.com/ricyoung/abliteration-comparison) · **Beginner summary:** [refusal-research-beginners-guide.md](refusal-research-beginners-guide.md) §3

The benchmark matrix and handbook interpretation of capability deltas integrate directly into the broader research taxonomy, method families, and capability-aware decision tree in [research-landscape.md](research-landscape.md). Cross-reference both when selecting tools for MoE/hybrid models or when GSM8K regression is a primary concern (see also the MoE per-expert technique in [../techniques/moe-hybrid-abliteration.md](../techniques/moe-hybrid-abliteration.md)).

---

## Tools compared

| Tool | Type | Notes from paper / upstream |
|------|------|----------------------------|
| **Heretic** | Bayesian Optuna + projected abliteration | **16/16 model compatibility** (paper); variable KL (0.043–1.646); model-dependent capability impact |
| **DECCP** | Single-pass + deccp topics | Avg GSM8K Δ **-0.13 pp** on benchmarked subset |
| **ErisForge** | Single-pass toolkit | Avg GSM8K Δ **-0.28 pp** on benchmarked subset |
| **FailSpy/abliterator** | TransformerLens hook ablation | **Lowest compatibility** in 16-model matrix (research/notebook); best for prototyping |
| **Abliterix** | Optuna TPE multi-objective (refusals + KL); Heretic-lineage extension | Not in arXiv:2512.13655 matrix — upstream **HonestAbliterationBench** + low-KL Gemma-4-E4B examples; verify per model |

16 instruction-tuned models (7B–14B) tested for tool compatibility in the paper; quantitative GSM8K metrics on tool-supported subsets. GSM8K change range across tools/models: **+1.51 pp to −18.81 pp** (−26.5% relative worst case).

**Extended toolkit (handbook):** Full placement, commands, and decision tree → [../techniques/extended-abliteration-toolkit.md](../techniques/extended-abliteration-toolkit.md)

---

## Key findings (handbook interpretation)

| Finding | Implication for deploy |
|---------|------------------------|
| **GSM8K most sensitive** | Math/reasoning drops -0.13 to **-18.81 pp** (-26.5% relative) depending on tool + architecture |
| Single-pass (ErisForge, DECCP) | Better **capability preservation** on benchmarked math subset vs some Heretic runs |
| Heretic Optuna | Better **refusal/KL co-optimization** when tuned — KL varies widely by model |
| Not one-size-fits-all | Pick tool per architecture; always eval GSM8K/MMLU on your target model |

**This handbook default:** Heretic for automatic deploy + mandatory eval gates ([eval-driven-workflow.md](../instructions/eval-driven-workflow.md)). Use **llm-abliteration** / **DECCP** / **ErisForge** when Heretic KL or GSM8K regression is poor on a specific architecture. Use **Abliterix** when MoE/hybrid/VL/SSM needs upstream presets or multi-technique automation (always re-run handbook eval gates). Use **FailSpy/abliterator** for mechanistic direction work only — bake winners with Heretic or Abliterix.

Capability preservation is not optional — different tools carry different regression profiles on reasoning and tool-calling. All selections must be gated by the mandatory sanity checks, labeling, and authorized-scope rules in [../docs/risks-and-ethics.md](../docs/risks-and-ethics.md). For agentic security, factory, and research deployments, align prompt sets and pass/fail criteria to the specific use-case corpora and workflows.

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

Heretic ships optional configs: `sources/heretic-tools/config.noslop.toml`, `config.nohumor.toml` — sync via `npm run fetch:heretic`.

---

## Responsible selection & cross-references

Tool selection from this benchmark data **must** be paired with the handbook's risk framework and eval gates. Different tools show different capability regressions on reasoning/tool-calling; there is no universal winner.

- **Risks, scope, labeling, capability sanity gates, authorized use:** [../docs/risks-and-ethics.md](../docs/risks-and-ethics.md) — read before choosing any backend for agentic workloads.
- **Eval-driven workflow, corpora choice, JSONL gates, deploy checklist:** [../instructions/eval-driven-workflow.md](../instructions/eval-driven-workflow.md) (mandatory post-abliteration checks).
- **Agentic use-case evals & prompt corpora (gate your chosen tool against these):**
  - Factory firmware QA (hardware commands, tool compliance): [../docs/use-cases/factory-firmware-qa.md](../docs/use-cases/factory-firmware-qa.md)
  - Pentest / cyber analysis (OSINT, recon, scoped offensive): [../docs/use-cases/pentest-cyber-analysis.md](../docs/use-cases/pentest-cyber-analysis.md)
  - CyberGym benchmark proxy (real vuln execution tasks): [../docs/use-cases/cybergym-benchmark.md](../docs/use-cases/cybergym-benchmark.md)
- **Full corpora, capability thresholds, xstest/jarvis/platform slices:** [../docs/evaluation.md](../docs/evaluation.md)
- **Agentic security stack (abliteration + repair + runtime gate):** [../instructions/agentic-security-stack.md](../instructions/agentic-security-stack.md)
- **Measurement theory (eval-driven-abliteration):** [../techniques/eval-driven-abliteration.md](../techniques/eval-driven-abliteration.md)
- **Advanced pipelines:** [../instructions/advanced-abliteration-workflow.md](../instructions/advanced-abliteration-workflow.md)

**Rule:** Pick tool per [key findings](#key-findings-handbook-interpretation) for your architecture, then enforce the full risks-and-ethics + eval-driven pipeline + use-case-specific gates before any weights leave the lab.

## Related

- [research-landscape.md](research-landscape.md)
- [toolchain-safetensors-gguf-lora.md](toolchain-safetensors-gguf-lora.md)
- [tools/abliteration-tooling.md](tools/abliteration-tooling.md) — agent/tool-calling picker, failure matrix, decision flowcharts (Nous, huihui, OBLITERATUS, SuperGemma)
- [../techniques/extended-abliteration-toolkit.md](../techniques/extended-abliteration-toolkit.md) — Abliterix, ErisForge, Nous/DECCP, FailSpy placement + commands