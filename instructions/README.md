# Instructions

Step-by-step workflows. **Start here if you are improving a local model for the first time.**

---

## Beginner path (read in order)

| Step | Doc | What you do |
|------|-----|-------------|
| 1 | [setup-environment.md](setup-environment.md) | Install Python, CUDA, venv, smoke test |
| 2 | [beginner-local-model-guide.md](beginner-local-model-guide.md) | Download model → Heretic → save abliterated weights |
| 3 | [run-locally-ollama-lmstudio.md](run-locally-ollama-lmstudio.md) | Convert to GGUF → Ollama / LM Studio |
| 4 | [heretic-workflow.md](heretic-workflow.md) | Reference + troubleshooting for Heretic |
| 5 | [../docs/evaluation.md](../docs/evaluation.md) | Check quality before daily use |

**Optional experiment first (no permanent edit):** [quickstart.md](quickstart.md)

---

## Choose by goal

| I want to… | Start here |
|------------|------------|
| Fix refusals on my Ollama model | [beginner-local-model-guide.md](beginner-local-model-guide.md) |
| Only have 8 GB GPU | [low-vram-abliteration.md](low-vram-abliteration.md) after Step 1–2 above |
| Test idea without saving weights | [quickstart.md](quickstart.md) |
| Security / factory agent | [agentic-security-stack.md](agentic-security-stack.md) |
| Best quality / research | [advanced-abliteration-workflow.md](advanced-abliteration-workflow.md) |
| Pick model by GPU / family | [model-family-guide.md](model-family-guide.md) |
| Thinking / CoT models | [thinking-models-guide.md](thinking-models-guide.md) |
| Eval-aligned factory deploy | [eval-driven-workflow.md](eval-driven-workflow.md) |
| Something broke | [troubleshooting-encyclopedia.md](troubleshooting-encyclopedia.md) |
| Manual control | [manual-full-pipeline.md](manual-full-pipeline.md) |

---

## All workflows

| Workflow | Time | Difficulty |
|----------|------|------------|
| **[beginner-local-model-guide.md](beginner-local-model-guide.md)** | ~2–4 hr | ★☆☆☆☆ |
| [setup-environment.md](setup-environment.md) | ~30 min | ★☆☆☆☆ |
| [run-locally-ollama-lmstudio.md](run-locally-ollama-lmstudio.md) | ~30–60 min | ★★☆☆☆ |
| [quickstart.md](quickstart.md) | ~45 min | ★★☆☆☆ |
| [heretic-workflow.md](heretic-workflow.md) | ~1–2 hr | ★★☆☆☆ |
| [low-vram-abliteration.md](low-vram-abliteration.md) | ~1–3 hr | ★★★☆☆ |
| [advanced-abliteration-workflow.md](advanced-abliteration-workflow.md) | ~2–8 hr | ★★★★☆ |
| [model-family-guide.md](model-family-guide.md) | ~10 min | ★☆☆☆☆ |
| [thinking-models-guide.md](thinking-models-guide.md) | ~2–4 hr | ★★★☆☆ |
| [eval-driven-workflow.md](eval-driven-workflow.md) | ~1–3 hr | ★★★☆☆ |
| [troubleshooting-encyclopedia.md](troubleshooting-encyclopedia.md) | reference | — |
| [agentic-security-stack.md](agentic-security-stack.md) | ~2–4 hr | ★★★☆☆ |
| Tool catalogs | [../docs/tools/README.md](../docs/tools/README.md) | reference |
| Abliteration tooling | [../docs/tools/abliteration-tooling.md](../docs/tools/abliteration-tooling.md) | reference |
| Heretic pins + HF models | [../docs/tools/heretic-tools-reference.md](../docs/tools/heretic-tools-reference.md) | reference |
| [llm-abliteration-workflow.md](llm-abliteration-workflow.md) | ~2–4 hr | ★★★☆☆ |
| [manual-full-pipeline.md](manual-full-pipeline.md) | ~4–8 hr | ★★★★☆ |
| [inference-only-prototype.md](inference-only-prototype.md) | ~1 hr | ★★☆☆☆ |

---

## Research & advanced methods

| Doc | Topic |
|-----|-------|
| [../docs/research-landscape.md](../docs/research-landscape.md) | Papers, taxonomy, decision tree |
| [../docs/advanced-techniques-catalog.md](../docs/advanced-techniques-catalog.md) | Heretic params, math, module map |
| [advanced-abliteration-workflow.md](advanced-abliteration-workflow.md) | Tracks A–G (production → RDO → MoE) |

## LoRA / QLoRA techniques

| Doc | Topic |
|-----|-------|
| [../techniques/lora-qlora-abliteration.md](../techniques/lora-qlora-abliteration.md) | 4-bit measure, Heretic LoRA rank, adapter export |
| [../methods/lora-adapter-export.md](../methods/lora-adapter-export.md) | ΔW → PEFT adapter |

---

## Prerequisites (all workflows)

- [ ] GPU: **8 GB+** with `bnb_4bit` (4B) · **12 GB+** (8B 4-bit) · **24 GB** for FP16 8B — see [setup-environment.md](setup-environment.md)
- [ ] Python 3.10+
- [ ] 30–50 GB free disk for 4B model path
- [ ] **Original checkpoint backed up** before abliteration
- [ ] Read [../docs/risks-and-ethics.md](../docs/risks-and-ethics.md)