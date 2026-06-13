# Agentic security stack (abliteration + Jarvis repair)

End-to-end pipeline for **pentest lab**, **CyberGym**, and **factory firmware QA** agents.

> **New to abliteration?** Do this first: [beginner-local-model-guide.md](beginner-local-model-guide.md) → [run-locally-ollama-lmstudio.md](run-locally-ollama-lmstudio.md). Return here when you have a working abliterated base model.

---

## Phase 1 — Abliterate base model

```bash
pip install -U heretic-llm bitsandbytes accelerate
heretic Qwen/Qwen3-4B-Instruct-2507
# or larger model for CyberGym: heretic meta-llama/Llama-3.1-8B-Instruct
```

**Low VRAM (8–12 GB):** set `quantization = "bnb_4bit"` in `config.toml` before running.

→ [low-vram-abliteration.md](low-vram-abliteration.md)

Output: decensored checkpoint with low KL drift (see Heretic eval).

**Optional:** export LoRA adapter instead of full weights for bench OTA updates:

```bash
python scripts/export-abliteration-lora.py \
  --base ./base-model --abliterated ./heretic-out --out ./abliteration-lora --rank 16
```

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

| Corpus | File / Command |
|--------|----------------|
| Factory / firmware | `data/eval/hardware-factory-prompts.jsonl` |
| Cyber research | `data/eval/cyber-research-prompts.jsonl` |
| OSINT / Kali / hashcat | `data/eval/osint-pentest-prompts.jsonl` |
| CyberGym proxy subset (local) | `python scripts/cybergym-eval-stub.py --prepare-subset --count 50 --out data/eval/cybergym-subset-sample.jsonl` (see also [cybergym-benchmark.md](../docs/use-cases/cybergym-benchmark.md)) |
| Jarvis safe tool eval (post-repair) | `npm run eval:jarvis-safe` → `data/eval/jarvis-safe-eval.jsonl` (filters `sources/jarvis-pack/.../eval_prompts.jsonl` for `category=safe`) |

**Usage:**

```bash
# CyberGym dry-run prep + flow docs
python scripts/cybergym-eval-stub.py --help
python scripts/cybergym-eval-stub.py --print-flow
python scripts/cybergym-eval-stub.py --prepare-subset --count 50 --out data/eval/cybergym-subset-sample.jsonl

# Jarvis safe subset for benign command eval (after tool-repair adapter)
npm run eval:jarvis-safe
# equivalent: python scripts/filter-jarvis-eval.py
```

See full eval matrices, targets, and cross-corpus details in [../docs/evaluation.md](../docs/evaluation.md).

Tool playbooks: [../docs/tools/agent-playbooks.md](../docs/tools/agent-playbooks.md) · Catalog: [../docs/tools/README.md](../docs/tools/README.md)

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