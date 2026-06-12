# Environment setup — Windows, Linux, WSL (step by step)

One-time machine prep before [beginner-local-model-guide.md](beginner-local-model-guide.md).

---

## Step 1 — Disk space

| Item | Space needed |
|------|--------------|
| Base 1.5B model | ~3 GB |
| Base 4B model | ~8 GB |
| Abliterated copy | Same as base |
| GGUF + quant | +30–50% |
| Python venv + torch | ~5 GB |
| **Minimum free** | **30 GB** (4B path: **50 GB**) |

---

## Step 2 — Windows native path

### 2.1 Python

1. Download [Python 3.11 or 3.12](https://www.python.org/downloads/windows/)
2. Installer: check **Add python.exe to PATH**
3. Verify:

```powershell
python --version
pip --version
```

### 2.2 NVIDIA drivers + CUDA

1. Update GPU driver from NVIDIA or laptop vendor
2. Verify:

```powershell
nvidia-smi
```

3. Install PyTorch with CUDA (in your project venv):

```powershell
pip install torch --index-url https://download.pytorch.org/whl/cu124
```

### 2.3 Git (for llama.cpp clone)

```powershell
winget install Git.Git
```

### 2.4 Known Windows issue — bitsandbytes

Heretic 4-bit (`bnb_4bit`) often works best on **WSL2 Ubuntu** rather than native Windows.

| Symptom | Solution |
|---------|----------|
| bitsandbytes install/import fails | Use [WSL2 path](#step-3--wsl2-recommended-for-8-gb-windows) below |
| Heretic runs but OOM | Smaller model + config.toml from low-vram guide |

---

## Step 3 — WSL2 (recommended for 8 GB Windows)

### 3.1 Install WSL

```powershell
wsl --install -d Ubuntu-22.04
```

Reboot if prompted.

### 3.2 Inside Ubuntu

```bash
sudo apt update && sudo apt install -y python3.11-venv python3-pip git
mkdir -p ~/local-ai-abliterate && cd ~/local-ai-abliterate
python3.11 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install torch --index-url https://download.pytorch.org/whl/cu124
pip install -U heretic-llm bitsandbytes accelerate huggingface_hub
```

### 3.3 Access Windows files

Windows `C:\Users\YOU\local-ai-abliterate` → `/mnt/c/Users/YOU/local-ai-abliterate`

Store models there so Ollama on Windows can use converted GGUF.

---

## Step 4 — Linux (native NVIDIA)

```bash
sudo apt update
sudo apt install -y python3-venv python3-pip git build-essential cmake
# NVIDIA driver via distro docs or nvidia-driver-550+

python3 -m venv ~/local-ai-abliterate/.venv
source ~/local-ai-abliterate/.venv/bin/activate
pip install torch --index-url https://download.pytorch.org/whl/cu124
pip install -U heretic-llm bitsandbytes accelerate huggingface_hub
python -c "import torch; print(torch.cuda.is_available())"
```

---

## Step 5 — Apple Silicon (Mac)

Heretic **surgery** on Mac is slow/unsupported for large models. Typical Mac path:

1. Abliterate on cloud GPU or download Heretic model from HF
2. Convert to GGUF on Mac or Linux
3. Run with **Ollama** (Metal) or **mlx-lm**

```bash
brew install ollama
pip install mlx-lm   # optional MLX path
```

→ [beginner-local-model-guide.md](beginner-local-model-guide.md) Track C

---

## Step 6 — Smoke test script

From the abliteration repo (or copy script to your project):

```bash
python scripts/check_env.py
```

Or clone the handbook and run:

```bash
git clone https://github.com/adybag14-cyber/Abliteration.git
cd Abliteration
python scripts/check_env.py
```

**All green for Track B:** CUDA True, bitsandbytes OK, heretic OK.

---

## Step 7 — Hugging Face cache (optional)

Point cache to a large drive:

```powershell
# Windows PowerShell — permanent for user
[System.Environment]::SetEnvironmentVariable("HF_HOME", "D:\hf-cache", "User")
```

```bash
# Linux bash
echo 'export HF_HOME=~/hf-cache' >> ~/.bashrc
```

---

## Next

→ [beginner-local-model-guide.md](beginner-local-model-guide.md)