# Abliteration — One-Stop Reference

Living handbook for **LLM abliteration** — weight-level refusal removal — plus **agentic security** stacks for factory firmware QA, pentest labs, and [CyberGym](https://cybergym.io) evaluation.

## What is abliteration?

**Abliteration** surgically removes refusal-related directions from transformer weights (Arditi et al., 2024). Result: models that **execute** legitimate security and hardware diagnostics instead of false-refusing `wmic`, `nmap`, firmware analysis, and multi-step agent workflows.

> Model surgery, not fine-tuning. Keep pristine base weights.

## Who this is for

| Use case | Doc |
|----------|-----|
| Factory new-hardware acceptance | [docs/use-cases/factory-firmware-qa.md](docs/use-cases/factory-firmware-qa.md) |
| Pentest / DFIR / firmware analysis (authorized) | [docs/use-cases/pentest-cyber-analysis.md](docs/use-cases/pentest-cyber-analysis.md) |
| CyberGym agent benchmarking | [docs/use-cases/cybergym-benchmark.md](docs/use-cases/cybergym-benchmark.md) |
| OSINT / Kali / hashcat tool library | [docs/tools/README.md](docs/tools/README.md) |
| Full agent stack (Heretic + Jarvis v7) | [instructions/agentic-security-stack.md](instructions/agentic-security-stack.md) |

## Repo layout

```
abliteration/
├── README.md
├── scripts/
│   ├── fetch-docs.mjs              # headless Chromium/Firefox upstream fetch
│   ├── fetch-heretic-tools.mjs     # sync pinned Heretic configs from GitHub
│   ├── fetch-hf-heretic-models.mjs # HF heretic/abliterated registry (Playwright)
│   ├── build-heretic-models-doc.mjs
│   ├── export-abliteration-lora.py # ΔW → PEFT adapter safetensors
│   ├── ralph-validate.mjs          # handbook integrity checks
│   ├── ralph-loop.mjs              # validate → refresh → re-validate
│   ├── ralph-next-task.mjs         # pick next dev task from backlog
│   ├── ralph-turn-end.mjs          # agent turn hook + autostart
│   ├── ralph-autostart.mjs         # background validate + dev handoff
│   ├── count-eval-prompts.mjs      # eval corpus line counts
│   ├── hardware-tool-gate.py       # from JARVIS v7 — runtime command gate
│   └── validate-dataset.py
├── data/
│   ├── ralph-backlog.json          # agent development task queue
│   ├── ralph-agent-handoff.md      # next-task prompt for agents
│   ├── heretic-models-registry.jsonl
│   └── eval/
│       ├── hardware-factory-prompts.jsonl
│       └── cyber-research-prompts.jsonl
├── sources/
│   ├── heretic-tools/           # immutable Heretic config pins (refresh via npm)
│   ├── jarvis-pack/             # extracted v7 zip (curated)
│   └── fetched/                 # GitHub/doc snapshots
├── docs/
│   ├── tools/                   # OSINT, Kali, Windows, macOS, Zig
│   ├── examples/                # 2.6k commands, 17.5k prompts (generated)
│   ├── hardware-command-catalog.md
│   ├── use-cases/
│   ├── context7.md
│   └── ...
├── techniques/  methods/  instructions/
└── references.md
```

## Improve your local model (beginners)

**Start here** if you use Ollama / LM Studio and want fewer refusals:

1. [instructions/setup-environment.md](instructions/setup-environment.md) — install Python + GPU check  
2. [instructions/beginner-local-model-guide.md](instructions/beginner-local-model-guide.md) — Heretic step by step  
3. [instructions/run-locally-ollama-lmstudio.md](instructions/run-locally-ollama-lmstudio.md) — GGUF + Ollama import  

Optional: [instructions/quickstart.md](instructions/quickstart.md) — test with hooks before permanent edit.

## Quick start paths

| Goal | Start here |
|------|------------|
| **First local model improvement** | [instructions/beginner-local-model-guide.md](instructions/beginner-local-model-guide.md) |
| Abliterate a model (reference) | [instructions/heretic-workflow.md](instructions/heretic-workflow.md) |
| **8 GB GPU / low RAM** | [instructions/low-vram-abliteration.md](instructions/low-vram-abliteration.md) |
| **LoRA / QLoRA techniques** | [techniques/lora-qlora-abliteration.md](techniques/lora-qlora-abliteration.md) |
| **Advanced methods (projected, MoE, RDO)** | [instructions/advanced-abliteration-workflow.md](instructions/advanced-abliteration-workflow.md) |
| Research landscape & papers | [docs/research-landscape.md](docs/research-landscape.md) |
| Abliteration tools (PEFT, GGUF, SAE, …) | [docs/tools/abliteration-tooling.md](docs/tools/abliteration-tooling.md) |
| **Heretic pins + HF model registry** | [docs/tools/heretic-tools-reference.md](docs/tools/heretic-tools-reference.md) |
| **Model family picker (Qwen/Gemma/Llama)** | [instructions/model-family-guide.md](instructions/model-family-guide.md) |
| **Thinking models (CoT)** | [instructions/thinking-models-guide.md](instructions/thinking-models-guide.md) |
| **Eval-driven factory deploy** | [instructions/eval-driven-workflow.md](instructions/eval-driven-workflow.md) |
| **Troubleshooting** | [instructions/troubleshooting-encyclopedia.md](instructions/troubleshooting-encyclopedia.md) |
| **Safetensors → GGUF → LoRA toolchain** | [docs/toolchain-safetensors-gguf-lora.md](docs/toolchain-safetensors-gguf-lora.md) |
| Factory QA agent | [instructions/agentic-security-stack.md](instructions/agentic-security-stack.md) |
| Hardware commands | [docs/hardware-command-catalog.md](docs/hardware-command-catalog.md) |
| Security tool catalogs | [docs/tools/README.md](docs/tools/README.md) |
| Evaluate | [docs/evaluation.md](docs/evaluation.md) |

## Refresh upstream docs & Heretic pins

```bash
npm install
npx playwright install chromium firefox   # once

npm run fetch:all                         # Heretic pins + docs + HF registry
# or:
npm run fetch:heretic
npm run fetch:docs
npm run fetch:hf-models:firefox           # HF blocks bare curl on some networks
```

Pinned Heretic files: [sources/heretic-tools/IMPORT.md](sources/heretic-tools/IMPORT.md) · Model list: [docs/tools/heretic-models-registry.md](docs/tools/heretic-models-registry.md)

**Validate + develop (Ralph loop):**

```bash
npm run ralph:next        # pick next backlog task — implement before ending turn
npm run validate          # links, jsonl, pins, python syntax
npm run ralph             # validate → refresh → re-validate
npm run eval:stats        # eval corpus line counts
npm run ralph:turn-end    # log turn + background daemon (blocks if backlog unfinished)
```

→ [docs/ralph-loop.md](docs/ralph-loop.md) · [docs/agent-development-loop.md](docs/agent-development-loop.md)

GitHub-first references: [references.md](references.md) · Context7: [docs/context7.md](docs/context7.md)

## JARVIS Tool Repair Pack v7

Imported from `jarvis-tool-repair-pack-expanded-v7.zip` — tool-use repair data (48k SFT/DPO rows) and `hardware-tool-gate.py`. Safety-guide noise removed; technical catalog kept. See [sources/jarvis-pack/IMPORT.md](sources/jarvis-pack/IMPORT.md).

## License

Documentation: CC0-1.0. Third-party tools retain their own licenses.