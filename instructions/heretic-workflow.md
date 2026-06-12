# Heretic workflow

Automated abliteration via [p-e-w/heretic](https://github.com/p-e-w/heretic).

> **New to local models?** Start with [beginner-local-model-guide.md](beginner-local-model-guide.md) (full walkthrough) → [run-locally-ollama-lmstudio.md](run-locally-ollama-lmstudio.md) (Ollama import).

---

## Step-by-step (standard run)

### Step 1 — Prerequisites

- [ ] Python 3.10+ ([setup-environment.md](setup-environment.md))
- [ ] NVIDIA GPU + `nvidia-smi` works (or use cloud / Track C in beginner guide)
- [ ] 30–50 GB free disk
- [ ] Base model downloaded; **backup copy** saved as `*-ORIGINAL`

### Step 2 — Virtual environment

```powershell
# Windows
cd C:\Users\YOU\local-ai-abliterate
.\.venv\Scripts\Activate.ps1
```

```bash
# Linux / WSL
source ~/local-ai-abliterate/.venv/bin/activate
```

### Step 3 — Install Heretic

```bash
pip install -U heretic-llm bitsandbytes accelerate huggingface_hub
heretic --help
```

**Success:** Help text prints, no import error.

### Step 4 — Config file (recommended)

Run Heretic from a folder containing `config.toml`. Use **pinned configs from this handbook** (offline-safe) or refresh from upstream:

```bash
# From abliteration repo — low VRAM (8–12 GB)
cp sources/heretic-tools/config.low-vram.toml config.toml

# Or upstream defaults (immutable pin in repo)
cp sources/heretic-tools/config.default.toml config.toml

# Or live GitHub (needs network)
curl -L -o config.toml https://raw.githubusercontent.com/p-e-w/heretic/master/config.default.toml
```

See [../docs/tools/heretic-tools-reference.md](../docs/tools/heretic-tools-reference.md) · [../sources/heretic-tools/IMPORT.md](../sources/heretic-tools/IMPORT.md)

**Beginner / quality defaults:**

```toml
orthogonalize_direction = true
row_normalization = "full"
offload_outputs_to_cpu = true
```

**8 GB VRAM — also set:**

```toml
quantization = "bnb_4bit"
n_trials = 80
max_batch_size = 16
```

See [low-vram-abliteration.md](low-vram-abliteration.md) for full low-VRAM steps.

### Step 5 — Run abliteration

```bash
heretic ./models/Qwen2.5-1.5B-Instruct
# or HuggingFace ID (downloads if needed):
heretic Qwen/Qwen3-4B-Instruct-2507
```

**Do not close the terminal** during Optuna trials (20–90 min depending on GPU/model).

### Step 6 — Save output

When prompted, save to a **new folder**, e.g.:

```text
./models/Qwen2.5-1.5B-Instruct-abliterated
```

Never overwrite `*-ORIGINAL`.

### Step 7 — Interactive test

Accept Heretic's **chat test** offer. Use the same prompt you tried on the base model.

### Step 8 — Built-in eval (optional)

Accept `--evaluate-model` if offered — record refusal count and KL.

### Step 9 — Load locally

→ [run-locally-ollama-lmstudio.md](run-locally-ollama-lmstudio.md)

---

## Install alternatives

### PyPI (recommended)

```bash
pip install -U heretic-llm
```

### Reproducible (GitHub + uv)

```bash
git clone https://github.com/p-e-w/heretic.git tools/heretic
cd tools/heretic
uv run heretic --help
```

---

## Low VRAM (8–12 GB GPUs)

```toml
quantization = "bnb_4bit"
offload_outputs_to_cpu = true
row_normalization = "full"
full_normalization_lora_rank = 3
```

Full numbered path: [low-vram-abliteration.md](low-vram-abliteration.md) · LoRA theory: [../techniques/lora-qlora-abliteration.md](../techniques/lora-qlora-abliteration.md)

---

## Research extras

```bash
pip install -U "heretic-llm[research]"
heretic <model> --print-residual-geometry
heretic <model> --plot-residuals
```

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| CUDA OOM | `quantization = bnb_4bit`; smaller model; `max_memory = { "0" = "7GB", "cpu" = "32GB" }` |
| `heretic` not found | Activate venv |
| bitsandbytes error (Windows) | WSL2 — [setup-environment.md](setup-environment.md) |
| Degenerate outputs | `row_normalization = full`; lower effective ablation via fewer trials / eval KL |
| No refusal change | Wrong model loaded at inference; verify abliterated path in Ollama |
| Gated model 403 | `huggingface-cli login` |
| Chat template weird | Match template in Ollama Modelfile to model family |

See [../sources/fetched/heretic-readme.txt](../sources/fetched/heretic-readme.txt).

---

## Security & factory QA use

After abliteration, eval on:

1. [../data/eval/hardware-factory-prompts.jsonl](../data/eval/hardware-factory-prompts.jsonl)
2. [../data/eval/cyber-research-prompts.jsonl](../data/eval/cyber-research-prompts.jsonl)
3. Optional Jarvis QLoRA → [agentic-security-stack.md](agentic-security-stack.md)
4. Runtime gate → [../scripts/hardware-tool-gate.py](../scripts/hardware-tool-gate.py)