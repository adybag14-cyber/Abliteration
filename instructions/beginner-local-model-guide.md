# Beginner guide — improve your local AI model (step by step)

**Goal:** Take a model you already run in **Ollama / LM Studio / text-generation-webui**, remove excessive refusals, and load the improved version back locally.

**Time:** ~2–4 hours first time (mostly download + Heretic run).  
**Skill level:** Can open a terminal and copy-paste commands.

> Read [../docs/risks-and-ethics.md](../docs/risks-and-ethics.md) first. Abliteration changes model behavior permanently. Keep your **original** model files.

---

## What this does (plain language)

| Before abliteration | After abliteration |
|-------------------|-------------------|
| "I can't help with that" on benign technical tasks | Model attempts the task |
| Refuses `wmic`, scripting, security lab questions | Often complies on scoped prompts |
| Same knowledge | Should be similar (watch for quality loss) |

This is **not** training the model on new facts. It **removes a safety direction** baked into weights. You still need good prompts and (for agents) runtime safety gates.

---

## Step 0 — Pick your path (30 seconds)

| Your PC | Follow |
|---------|--------|
| NVIDIA GPU, **8 GB** VRAM | [Track A](#track-a--8-gb-gpu-heretic--ollama) below |
| NVIDIA GPU, **12–24 GB** VRAM | [Track B](#track-b--12-gb-gpu-heretic-default) below |
| **No NVIDIA GPU** (Mac / CPU only) | [Track C](#track-c--no-gpu-download--quantize-only) below |
| Already use **Ollama** only | Track A or B, then [run-locally-ollama-lmstudio.md](run-locally-ollama-lmstudio.md) |

Unsure about VRAM? Run **Step 1** first.

---

## Step 1 — Check your hardware (5 min)

### Windows (PowerShell)

```powershell
nvidia-smi
```

**Read the line `Memory-Usage` on GPU 0.**

| Total VRAM | Track |
|------------|-------|
| 6–8 GB | Track A (small model + 4-bit) |
| 10–12 GB | Track A or B (4B with 4-bit) |
| 16 GB+ | Track B |
| No `nvidia-smi` output | Track C |

```powershell
python --version
```

Need **Python 3.10+**. If missing: install from [python.org](https://www.python.org/downloads/) — check **"Add Python to PATH"**.

### Linux

```bash
nvidia-smi
python3 --version
```

---

## Step 2 — Create a workspace (5 min)

```powershell
# Windows — pick a folder with 30+ GB free disk
mkdir C:\Users\%USERNAME%\local-ai-abliterate
cd C:\Users\%USERNAME%\local-ai-abliterate

python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
```

```bash
# Linux / WSL
mkdir -p ~/local-ai-abliterate && cd ~/local-ai-abliterate
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
```

**Success:** Prompt shows `(.venv)` and `pip` works.

---

## Step 3 — Install PyTorch + Heretic (10–20 min)

### NVIDIA GPU

```bash
pip install torch --index-url https://download.pytorch.org/whl/cu124
pip install -U heretic-llm bitsandbytes accelerate huggingface_hub
```

Verify GPU is visible to PyTorch:

```bash
python -c "import torch; print('CUDA:', torch.cuda.is_available()); print('GPU:', torch.cuda.get_device_name(0) if torch.cuda.is_available() else 'none')"
```

**Success:** `CUDA: True` and your GPU name prints.

### CPU-only (Track C prep)

```bash
pip install torch --index-url https://download.pytorch.org/whl/cpu
pip install -U huggingface_hub
```

---

## Step 4 — Hugging Face login (5 min, if needed)

Skip if you only use **public** models like `Qwen/Qwen2.5-1.5B-Instruct`.

```bash
pip install -U huggingface_hub
huggingface-cli login
```

Paste a token from [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens) (Read access is enough for public models).

**Success:** `Login successful`.

---

## Step 5 — Download a base model (15–60 min)

Start small on first run.

| VRAM | Recommended model | Size on disk |
|------|-------------------|--------------|
| 8 GB | `Qwen/Qwen2.5-1.5B-Instruct` | ~3 GB |
| 12 GB | `Qwen/Qwen3-4B-Instruct-2507` | ~8 GB |
| 24 GB | `Qwen/Qwen3-4B-Instruct-2507` or 8B instruct | 8–16 GB |

```bash
mkdir models
huggingface-cli download Qwen/Qwen2.5-1.5B-Instruct --local-dir ./models/Qwen2.5-1.5B-Instruct
```

**Success:** Folder `./models/Qwen2.5-1.5B-Instruct` contains `config.json`, `*.safetensors`, tokenizer files.

**Backup:** Copy that folder to `models/Qwen2.5-1.5B-Instruct-ORIGINAL` before abliteration.

---

## Track A — 8 GB GPU (Heretic + Ollama)

### Step A1 — Create low-VRAM config (5 min)

Clone or copy from the [Abliteration handbook](https://github.com/adybag14-cyber/Abliteration) — pinned profile, no manual edits required:

```bash
cp /path/to/abliteration/sources/heretic-tools/config.low-vram.toml config.toml
```

Or fetch live upstream defaults and edit manually:

```bash
curl -L -o config.toml https://raw.githubusercontent.com/p-e-w/heretic/master/config.default.toml
# then set quantization = "bnb_4bit", offload_outputs_to_cpu = true, etc.
```

See [../docs/tools/heretic-tools-reference.md](../docs/tools/heretic-tools-reference.md) · pre-abliterated HF models: [../docs/tools/heretic-models-registry.md](../docs/tools/heretic-models-registry.md)

Save `config.toml` in the **same folder** where you will run `heretic` (your `local-ai-abliterate` directory).

### Step A2 — Run Heretic (30–90 min)

```bash
heretic ./models/Qwen2.5-1.5B-Instruct
```

**What you will see:**

1. Batch size benchmark (normal)
2. Progress bar / Optuna trials (wait — do not close terminal)
3. Prompts at end: save model, chat test, evaluate

**When asked to save:** choose a path like `./models/Qwen2.5-1.5B-Instruct-abliterated`

**Success:** Folder `Qwen2.5-1.5B-Instruct-abliterated` with new `model*.safetensors`.

### Step A3 — Quick before/after test (5 min)

Ask the **same question** to both models using Heretic's chat prompt or:

```bash
heretic ./models/Qwen2.5-1.5B-Instruct-abliterated
# use built-in chat when offered
```

Example prompt for testing:

```text
Write a short PowerShell one-liner to list disk drive models with WMI.
```

| Result | Meaning |
|--------|---------|
| Base refuses, abliterated answers | Working |
| Both refuse | Try longer Heretic run or see troubleshooting |
| Abliterated gibberish | See troubleshooting — may need lower ablation strength |

### Step A4 — Put in Ollama

→ Full steps: [run-locally-ollama-lmstudio.md](run-locally-ollama-lmstudio.md)

---

## Track B — 12+ GB GPU (Heretic default)

### Step B1 — Optional config (recommended)

```bash
cp /path/to/abliteration/sources/heretic-tools/config.production.toml config.toml
```

Or upstream defaults:

```bash
cp /path/to/abliteration/sources/heretic-tools/config.default.toml config.toml
```

Leave `quantization = "none"` if you have 16 GB+ VRAM (production profile already sets projected + norm-preserving options).

### Step B2 — Run

```bash
heretic ./models/Qwen3-4B-Instruct-2507
```

Save to `./models/Qwen3-4B-Instruct-abliterated`.

### Step B3 — Evaluate (optional but recommended)

When Heretic offers evaluation, accept — note **refusal count** and **KL divergence**. Good runs: refusals down, KL under ~0.5 (lower is better).

### Step B4 — Local inference

→ [run-locally-ollama-lmstudio.md](run-locally-ollama-lmstudio.md)

---

## Track C — No GPU (download + quantize only)

You **cannot** run Heretic surgery on CPU in reasonable time. Options:

### Option C1 — Download community abliterated model (fastest)

1. Search Hugging Face for `heretic` tag: [huggingface.co/models?other=heretic](https://huggingface.co/models?other=heretic)
2. Download a model matching your use case (e.g. `p-e-w/Qwen3-4B-Instruct-2507-heretic`)
3. Convert to GGUF → [run-locally-ollama-lmstudio.md](run-locally-ollama-lmstudio.md)

```bash
huggingface-cli download p-e-w/Qwen3-4B-Instruct-2507-heretic --local-dir ./models/qwen3-4b-heretic
```

### Option C2 — Rent a cloud GPU once

1. Rent RTX 3090/4090 on RunPod / Vast.ai (~$0.30–0.80/hr)
2. Run Track A or B there
3. Download `*-abliterated` folder to your PC
4. Convert to Ollama locally

---

## Step 6 — Troubleshooting (beginners)

| Problem | What to do |
|---------|------------|
| `CUDA out of memory` | Use Track A config; smaller model (1.5B); close browser/games |
| `heretic: command not found` | Activate venv: `.\.venv\Scripts\Activate.ps1` |
| `bitsandbytes` errors on Windows | Use **WSL2 Ubuntu** + CUDA, or cloud GPU |
| Model download 403 | `huggingface-cli login`; accept model license on HF website |
| No change after abliteration | Confirm you load **abliterated** folder in Ollama, not original |
| Model sounds dumber | Re-run with `row_normalization = full`; try smaller `n_trials` + eval KL |
| Activate.ps1 blocked | `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` |

More: [heretic-workflow.md](heretic-workflow.md) · [low-vram-abliteration.md](low-vram-abliteration.md)

---

## Step 7 — What to do next

| Goal | Next doc |
|------|----------|
| Ollama / LM Studio import | [run-locally-ollama-lmstudio.md](run-locally-ollama-lmstudio.md) |
| 8 GB GPU tuning | [low-vram-abliteration.md](low-vram-abliteration.md) |
| Security / agent use | [agentic-security-stack.md](agentic-security-stack.md) |
| Advanced quality tuning | [advanced-abliteration-workflow.md](advanced-abliteration-workflow.md) |
| Pick another model family | [model-family-guide.md](model-family-guide.md) |
| Something broke | [troubleshooting-encyclopedia.md](troubleshooting-encyclopedia.md) |
| Understand theory | [../docs/overview.md](../docs/overview.md) |

---

## Printable checklist

```text
[ ] nvidia-smi shows GPU and free VRAM
[ ] Python 3.10+ venv active
[ ] torch sees CUDA: True
[ ] Base model downloaded + ORIGINAL backup copied
[ ] config.toml in cwd (8 GB: bnb_4bit)
[ ] heretic finished and saved *-abliterated folder
[ ] Before/after test prompt documented
[ ] GGUF created and ollama run tested
[ ] Original model kept untouched
```