# Agentic security stack (abliteration + Jarvis repair)

End-to-end pipeline for **pentest lab**, **CyberGym**, and **factory firmware QA** agents.

## Phase 1 — Abliterate base model

```bash
pip install -U heretic-llm
heretic Qwen/Qwen3-4B-Instruct-2507
# or larger model for CyberGym: heretic meta-llama/Llama-3.1-8B-Instruct
```

Output: decensored checkpoint with low KL drift (see Heretic eval).

## Phase 2 — Optional tool-repair adapter (Jarvis v7)

Fixes residual false refusals on benign commands (`uname`, `wmic`, `lspci`, `nvidia-smi`).

```bash
cd sources/jarvis-pack/jarvis-tool-repair-pack
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
python ../../../scripts/validate-dataset.py   # validates jarvis-pack/data/*.jsonl
```

Train (conservative — do not overtrain):

```bash
python scripts/train_sft.py \
  --base_model /path/to/abliterated-model \
  --data data/sft_train.jsonl \
  --output_dir output/security-agent-sft

python scripts/train_dpo.py \
  --base_model /path/to/abliterated-model \
  --adapter_path output/security-agent-sft \
  --data data/dpo_train.jsonl \
  --output_dir output/security-agent-v1
```

**Settings (RTX 4090 defaults from pack):** QLoRA 4-bit, rank 32, SFT 1 epoch, DPO 0.5–1 epoch.

## Phase 3 — Runtime tool gate

Never ship without external gate:

```bash
python scripts/hardware-tool-gate.py "wmic diskdrive get Model,Size"
# ALLOW | CONFIRM | BLOCK
```

Extend `SAFE_EXACT_COMMANDS` in the script for your factory SKU manifests.

## Phase 4 — Evaluate

| Corpus | File |
|--------|------|
| Factory / firmware | `data/eval/hardware-factory-prompts.jsonl` |
| Cyber research | `data/eval/cyber-research-prompts.jsonl` |
| Jarvis full eval | `sources/jarvis-pack/.../eval_prompts.jsonl` (filter categories) |

CyberGym full benchmark: [../docs/use-cases/cybergym-benchmark.md](../docs/use-cases/cybergym-benchmark.md)

## Phase 5 — Deploy

| Surface | Suggestion |
|---------|------------|
| Factory bench | Local Ollama / vLLM, air-gapped |
| Cyber lab | Docker agent + scoped network ACL |
| CyberGym | OpenHands + abliterated endpoint |

## Living updates

```bash
node scripts/fetch-docs.mjs              # Heretic / upstream
# Context7: query heretic-llm, openhands, playwright
```