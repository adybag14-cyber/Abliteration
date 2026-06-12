# JARVIS Tool Repair Pack v7 — curated import

**Source:** `jarvis-tool-repair-pack-expanded-v7.zip`  
**Imported:** 2026-06-12

## What we kept

| Asset | Location | Purpose |
|-------|----------|---------|
| `tool_gate.py` | [../../scripts/hardware-tool-gate.py](../../scripts/hardware-tool-gate.py) | Runtime ALLOW / CONFIRM / BLOCK for agent terminal calls |
| `validate_dataset.py` | [../../scripts/validate-dataset.py](../../scripts/validate-dataset.py) | JSONL dataset validation |
| Platform command lists | [../../docs/hardware-command-catalog.md](../../docs/hardware-command-catalog.md) | Factory / firmware / USB / storage diagnostics |
| Training datasets (full) | `jarvis-tool-repair-pack/data/*.jsonl` | SFT/DPO repair data (48k+ rows) — local only |
| `manifest.json` | `manifest.json` | Version metadata |

## What we dropped (noise)

- Repeated safety guide prose in README / DATASET_RULES / PLACEHOLDERS
- Placeholder refusal training examples (`[SECRET_READ_COMMAND]`, etc.)
- Hugging Face upload workflow sections
- v3–v6 changelog duplication in QUICK_START

## Dataset stats (v7)

```text
SFT rows:     48557
DPO rows:     47029
Eval prompts: 2857
Platforms:    Windows PowerShell/cmd/DiskPart, Termux, macOS
```

## Use with abliteration

1. **Abliterate** base model (Heretic) → fewer false refusals on security/hardware tasks  
2. **Optional SFT/DPO** from Jarvis pack → restores disciplined tool use (read-only vs confirm)  
3. **Always** run `hardware-tool-gate.py` at runtime on factory floor agents

See [../../instructions/agentic-security-stack.md](../../instructions/agentic-security-stack.md).