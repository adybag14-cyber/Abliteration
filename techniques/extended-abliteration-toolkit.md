# Extended abliteration toolkit

Four community tools that complement the handbook default (**Heretic**). Use this page to pick a backend by **automation**, **VRAM**, **architecture**, or **research depth** — then run the same eval gates as any Heretic run.

**Benchmark context:** [arXiv:2512.13655](https://arxiv.org/abs/2512.13655) (Young, Jan 2026) — handbook matrix in [../docs/comparative-abliteration-benchmarks.md](../docs/comparative-abliteration-benchmarks.md).

**Research map:** [../docs/refusal-research-beginners-guide.md](../docs/refusal-research-beginners-guide.md) · **defenses that resist surgery:** [../docs/defenses-against-abliteration.md](../docs/defenses-against-abliteration.md)

**Eval gates (mandatory):** [../instructions/eval-driven-workflow.md](../instructions/eval-driven-workflow.md) · [../docs/risks-and-ethics.md](../docs/risks-and-ethics.md)

---

## Quick comparison

| Tool | Type / strength | Best for in this handbook | Compatibility & notes | Link |
|------|-----------------|---------------------------|----------------------|------|
| **Abliterix** | Automated Optuna TPE (multi-objective: refusals + KL). Direct steering, LoRA abliteration, MoE expert-granular, ORBA, SAE, and more. 150+ pre-built configs. Broad arch support. | [model-family-playbook.md](model-family-playbook.md) (MoE/hybrid/VL), [advanced-abliteration-workflow.md](../instructions/advanced-abliteration-workflow.md) Track J, techniques/ as Heretic alternative/extension. **HonestAbliterationBench** for regression checks. | Strong automation + low-KL examples (e.g. Gemma-4-E4B: near-zero refusals, tiny KL per upstream reports). Derivative/extension of Heretic with extra techniques. Reported to break some defenses (Circuit Breakers, etc.) — treat as research signal, not deploy default. AGPL-3.0. | [github.com/wuwangzhang1216/abliterix](https://github.com/wuwangzhang1216/abliterix) |
| **ErisForge** | Simple layer-range ablation via `AblationDecoderLayer` / `AdditionDecoderLayer` + built-in `ExpressionRefusalScorer`. Minimal config. | [layer-selective-abliteration.md](layer-selective-abliteration.md), [mean-difference-direction.md](mean-difference-direction.md), beginner quick experiments, [advanced-abliteration-workflow.md](../instructions/advanced-abliteration-workflow.md) Track K. | Good capability preservation (avg GSM8K Δ **-0.28 pp** on benchmarked subset in arXiv:2512.13655). Lower model compatibility than Heretic. Research-oriented, dead-simple API. | [github.com/Tsadoq/ErisForge](https://github.com/Tsadoq/ErisForge) |
| **llm-abliteration** (NousResearch + forks: jim-plus, Orion-zhen) + **DECCP** | Manual/sharded direction measurement + ablation. Memory-efficient for large models. DECCP adds Chinese/multilingual prompt sets. | [low-vram-abliteration.md](../instructions/low-vram-abliteration.md) Path B, [projected-llm-abliteration.md](../methods/projected-llm-abliteration.md), [advanced-abliteration-workflow.md](../instructions/advanced-abliteration-workflow.md) Track C. | Strong capability preservation (DECCP avg GSM8K Δ **-0.13 pp** on benchmarked subset). Best when full Heretic load OOMs — `sharded_ablate.py` never holds full weights in VRAM. | [NousResearch/llm-abliteration](https://github.com/NousResearch/llm-abliteration) · [jim-plus/llm-abliteration](https://github.com/jim-plus/llm-abliteration) · [AUGMXNT/deccp](https://github.com/AUGMXNT/deccp) |
| **FailSpy/abliterator** | TransformerLens-based: activation caching, refusal direction computation, hook-based (temporary/permanent) ablation, layer whitelist/blacklist. | [beyond-single-direction.md](beyond-single-direction.md) mechanistic path, [mean-difference-direction.md](mean-difference-direction.md), [residual-hook-ablation.md](../methods/residual-hook-ablation.md). Complements SAE / multi-direction work. | Lowest compatibility in arXiv:2512.13655 matrix (TransformerLens arch limits). Excellent for notebooks, custom analysis, prototyping directions before baking with Heretic/Abliterix. | [github.com/FailSpy/abliterator](https://github.com/FailSpy/abliterator) |

---

## Abliterix — when Heretic is not enough

**Use when:** MoE/hybrid/VL/SSM families need expert-granular or architecture-specific configs; you want multi-objective Optuna (refusal rate + KL) with 150+ upstream presets; or you need LoRA abliteration / steering / ORBA / SAE paths in one CLI.

```bash
git clone https://github.com/wuwangzhang1216/abliterix.git
cd abliterix && pip install -e .
# Pick a preset from configs/ — verify model id matches your checkpoint revision
abliterix run --config configs/<model-family>.yaml
```

**HonestAbliterationBench:** upstream benchmark spec at `benchmarks/SPEC.md` in the Abliterix repo. Pair with handbook corpora (`data/eval/*.jsonl`) — upstream numbers are not a substitute for factory/CyberGym gates.

**Handbook placement:**

- MoE / VL / Gemma 4 families → [model-family-playbook.md](model-family-playbook.md)
- Production-hardening track → [advanced-abliteration-workflow.md](../instructions/advanced-abliteration-workflow.md) Track J
- Agent stack comparison → [../docs/tools/abliteration-tooling.md](../docs/tools/abliteration-tooling.md)

**Caveat:** Community fork of the Heretic lineage — verify license (AGPL-3.0), config model ids, and run full eval before any weights leave the lab.

---

## ErisForge — fast layer-band prototyping

**Use when:** You know the layer band (from Heretic `--print-residual-geometry` or manual silhouette) and want a **single-pass** ablation without Optuna overhead.

```bash
git clone https://github.com/Tsadoq/ErisForge.git
cd ErisForge && pip install -e .
# Minimal API: swap decoder layers + ExpressionRefusalScorer — see upstream README
```

- Layer band workflow → [layer-selective-abliteration.md](layer-selective-abliteration.md#erisforge--quick-prototyping)
- Mean-difference direction theory → [mean-difference-direction.md](mean-difference-direction.md#erisforge-expressionrefusalscorer)
- Capability-first fallback when Heretic KL is poor → [../docs/comparative-abliteration-benchmarks.md](../docs/comparative-abliteration-benchmarks.md)

---

## llm-abliteration + DECCP — low VRAM and multilingual measure

**Fork choice:**

| Fork | URL | Notes |
|------|-----|-------|
| **jim-plus** | [jim-plus/llm-abliteration](https://github.com/jim-plus/llm-abliteration) | v1.2+ projected/norm-preserving flags; handbook Path B default |
| **NousResearch** | [NousResearch/llm-abliteration](https://github.com/NousResearch/llm-abliteration) | Community maintenance; YAML per-layer control |
| **Orion-zhen** | Search GitHub for active fork | Pin commit if using in production |

**Sharded ablate** keeps peak memory at one layer matrix — critical for 20B+ on consumer hardware.

```bash
python measure.py -m <model> -o directions.pt --quant 4bit --projected
python measure.py -m <model> -o directions.pt --quant 4bit --deccp   # multilingual topics
python sharded_ablate.py config.yaml --projected --normpreserve
```

Full path → [../instructions/low-vram-abliteration.md](../instructions/low-vram-abliteration.md#path-b--llm-abliteration-4-bit-measure--sharded-ablate)

**DECCP** ([AUGMXNT/deccp](https://github.com/AUGMXNT/deccp)): Chinese/multilingual harmful/harmless topic sets for direction estimation — use when English-only `harmful_behaviors` misaligns with refusal geometry on CJK or multilingual instruct models.

---

## FailSpy/abliterator — mechanistic notebooks

**Use when:** You need to **cache activations**, compute refusal directions interactively, and test hook ablation (temporary vs permanent) before committing weight surgery.

```python
# Pattern: TransformerLens HookedTransformer + hook_resid_post
# Layer whitelist/blacklist — see upstream notebooks
```

- Interpretability stack → [beyond-single-direction.md](beyond-single-direction.md#6-mechanistic-tools-failspyabliterator)
- Zero-weight-edit VRAM path → [../instructions/low-vram-abliteration.md](../instructions/low-vram-abliteration.md#path-c--inference-hooks-only-zero-weight-edit)
- **Not** for broad architecture deploy — TransformerLens coverage is narrower than Heretic/Abliterix.

---

## Decision tree (summary)

```text
Need automatic deploy + eval gates?
  └─ Heretic (default) OR Abliterix if MoE/VL/SSM + preset exists

Heretic OOM or 20B+ on consumer GPU?
  └─ llm-abliteration measure 4-bit + sharded_ablate (+ DECCP if non-English)

GSM8K regression blocker on Heretic?
  └─ Try ErisForge or DECCP single-pass — re-eval factory JSONL anyway

Research / direction prototyping only?
  └─ FailSpy/abliterator hooks → bake winner with Heretic or Abliterix
```

Agent + tool-calling specifics → [../docs/tools/abliteration-tooling.md](../docs/tools/abliteration-tooling.md#agent--tool-calling-tool-picker-nous-huihui-obliteratus-supergemma)

---

## Related

- [../docs/refusal-research-beginners-guide.md](../docs/refusal-research-beginners-guide.md) — paper map + offline PDFs
- [../docs/defenses-against-abliteration.md](../docs/defenses-against-abliteration.md) — when tools report low refusal drop
- [../references.md](../references.md) — URLs and install snippets
- [../docs/toolchain-safetensors-gguf-lora.md](../docs/toolchain-safetensors-gguf-lora.md) — post-abliteration quant chain
- [steering-and-alternatives.md](steering-and-alternatives.md) — when not to edit weights