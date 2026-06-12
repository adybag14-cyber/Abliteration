# JARVIS Tool Repair Pack v7 (curated)

Imported into the abliteration handbook. See [../IMPORT.md](../IMPORT.md) for what was kept vs dropped.

**Train from abliterated base** — full workflow: [../../../instructions/agentic-security-stack.md](../../../instructions/agentic-security-stack.md)

```bash
python -m venv .venv && .\.venv\Scripts\activate
pip install -r requirements.txt
python ../../../scripts/validate-dataset.py
```

Dataset counts (v7): SFT 48557 · DPO 47029 · Eval 2857

Technical references:
- [docs/V7_WEB_RESEARCHED_PLATFORM_EXPANSION.md](docs/V7_WEB_RESEARCHED_PLATFORM_EXPANSION.md)
- [docs/SAFE_TOOL_CATALOG.md](docs/SAFE_TOOL_CATALOG.md)
- [../../../docs/hardware-command-catalog.md](../../../docs/hardware-command-catalog.md)