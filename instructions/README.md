# Instructions

Step-by-step workflows. Read [../docs/overview.md](../docs/overview.md) first.

| Workflow | Time | Difficulty |
|----------|------|------------|
| [quickstart.md](quickstart.md) | ~30 min | ★★☆☆☆ |
| [heretic-workflow.md](heretic-workflow.md) | ~1–2 hr | ★★☆☆☆ |
| **[low-vram-abliteration.md](low-vram-abliteration.md)** | ~1–3 hr | ★★★☆☆ |
| [agentic-security-stack.md](agentic-security-stack.md) | ~2–4 hr | ★★★☆☆ |
| Tool catalogs (OSINT/Kali/hashcat) | [../docs/tools/README.md](../docs/tools/README.md) | reference |
| Abliteration tooling (PEFT, GGUF, …) | [../docs/tools/abliteration-tooling.md](../docs/tools/abliteration-tooling.md) | reference |
| [llm-abliteration-workflow.md](llm-abliteration-workflow.md) | ~2–4 hr | ★★★☆☆ |
| [manual-full-pipeline.md](manual-full-pipeline.md) | ~4–8 hr | ★★★★☆ |
| [inference-only-prototype.md](inference-only-prototype.md) | ~1 hr | ★★☆☆☆ |

## LoRA / QLoRA techniques

| Doc | Topic |
|-----|-------|
| [../techniques/lora-qlora-abliteration.md](../techniques/lora-qlora-abliteration.md) | 4-bit measure, Heretic LoRA rank, adapter export |
| [../methods/lora-adapter-export.md](../methods/lora-adapter-export.md) | ΔW → PEFT adapter (`scripts/export-abliteration-lora.py`) |

## Prerequisites (all workflows)

- [ ] GPU: **8 GB+** with `bnb_4bit` (4B) · **12 GB+** (8B 4-bit) · **24 GB** for FP16 8B (see [low-vram-abliteration.md](low-vram-abliteration.md))
- [ ] Python 3.10+
- [ ] Git — clone tools from GitHub ([references.md](../references.md))
- [ ] Model files on disk or accessible model path (gated weights may still need HF login)
- [ ] **Original checkpoint backed up**
- [ ] Read [../docs/risks-and-ethics.md](../docs/risks-and-ethics.md)
- [ ] Optional: Context7 MCP → [../docs/context7.md](../docs/context7.md)