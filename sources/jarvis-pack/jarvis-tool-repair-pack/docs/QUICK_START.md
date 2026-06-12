# Quick Start (training only)

```bash
cd sources/jarvis-pack/jarvis-tool-repair-pack
python -m venv .venv && .\.venv\Scripts\activate
pip install -r requirements.txt
python ../../../scripts/validate-dataset.py
```

SFT (1 epoch, QLoRA defaults in `train_sft.py`):

```bash
python scripts/train_sft.py \
  --base_model /path/to/abliterated-model \
  --data data/sft_train.jsonl \
  --output_dir output/security-agent-sft
```

DPO (0.5–1 epoch):

```bash
python scripts/train_dpo.py \
  --base_model /path/to/abliterated-model \
  --adapter_path output/security-agent-sft \
  --data data/dpo_train.jsonl \
  --output_dir output/security-agent-v1
```

Deploy with [../../../scripts/hardware-tool-gate.py](../../../scripts/hardware-tool-gate.py) — see [../../../instructions/agentic-security-stack.md](../../../instructions/agentic-security-stack.md).