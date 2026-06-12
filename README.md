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
│   ├── fetch-docs.mjs           # headless Chromium/Firefox upstream fetch
│   ├── hardware-tool-gate.py    # from JARVIS v7 — runtime command gate
│   └── validate-dataset.py
├── data/eval/
│   ├── hardware-factory-prompts.jsonl
│   └── cyber-research-prompts.jsonl
├── sources/
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

## Quick start paths

| Goal | Start here |
|------|------------|
| Abliterate a model | [instructions/heretic-workflow.md](instructions/heretic-workflow.md) |
| Factory QA agent | [instructions/agentic-security-stack.md](instructions/agentic-security-stack.md) |
| Hardware commands | [docs/hardware-command-catalog.md](docs/hardware-command-catalog.md) |
| Security tool catalogs | [docs/tools/README.md](docs/tools/README.md) |
| Evaluate | [docs/evaluation.md](docs/evaluation.md) |

## Refresh upstream docs

```bash
node scripts/fetch-docs.mjs          # Chromium
node scripts/fetch-docs.mjs --firefox  # npx playwright install firefox
```

GitHub-first references: [references.md](references.md) · Context7: [docs/context7.md](docs/context7.md)

## JARVIS Tool Repair Pack v7

Imported from `jarvis-tool-repair-pack-expanded-v7.zip` — tool-use repair data (48k SFT/DPO rows) and `hardware-tool-gate.py`. Safety-guide noise removed; technical catalog kept. See [sources/jarvis-pack/IMPORT.md](sources/jarvis-pack/IMPORT.md).

## License

Documentation: CC0-1.0. Third-party tools retain their own licenses.