# Run your abliterated model locally (Ollama, LM Studio, llama.cpp)

**Prerequisite:** You have a `*-abliterated` folder in Hugging Face / safetensors format from [beginner-local-model-guide.md](beginner-local-model-guide.md) or Heretic.

Heretic outputs **safetensors** (Transformers layout). Ollama needs **GGUF**. This guide bridges that gap.

---

## Overview (3 stages)

```
safetensors (Heretic)  →  GGUF (convert)  →  Ollama / LM Studio / llama.cpp
```

| Stage | Tool | Time |
|-------|------|------|
| 1. Convert | llama.cpp `convert_hf_to_gguf.py` | 5–15 min |
| 2. Quantize (optional) | `llama-quantize` | 5–20 min |
| 3. Serve | Ollama or LM Studio | 2 min |

---

## Step 1 — Get llama.cpp (5 min)

### Windows (PowerShell)

```powershell
cd C:\Users\$env:USERNAME\local-ai-abliterate
git clone https://github.com/ggml-org/llama.cpp.git tools\llama.cpp
cd tools\llama.cpp
pip install -r requirements.txt
```

### Linux / WSL

```bash
cd ~/local-ai-abliterate
git clone https://github.com/ggml-org/llama.cpp.git tools/llama.cpp
cd tools/llama.cpp
pip install -r requirements.txt
```

**Success:** `tools/llama.cpp/convert_hf_to_gguf.py` exists.

---

## Step 2 — Convert safetensors → GGUF F16 (10 min)

Replace paths with your abliterated model folder:

```powershell
# Windows — from tools\llama.cpp
python convert_hf_to_gguf.py ..\..\models\Qwen2.5-1.5B-Instruct-abliterated `
  --outfile ..\..\models\qwen-abliterated-f16.gguf `
  --outtype f16
```

```bash
# Linux
python convert_hf_to_gguf.py ../../models/Qwen2.5-1.5B-Instruct-abliterated \
  --outfile ../../models/qwen-abliterated-f16.gguf \
  --outtype f16
```

**Success:** `qwen-abliterated-f16.gguf` created (size similar to model weights).

**Error `No module named transformers`:** `pip install transformers sentencepiece protobuf`

---

## Step 3 — Quantize for less RAM (recommended)

Smaller file, faster on 8 GB machines. **Q4_K_M** is the usual sweet spot.

### Build quantize binary (first time only)

**Windows:** Download a prebuilt release from [llama.cpp releases](https://github.com/ggml-org/llama.cpp/releases) or build with CMake (advanced).

**Linux / WSL:**

```bash
cd tools/llama.cpp
cmake -B build
cmake --build build --config Release -j
./build/bin/llama-quantize ../../models/qwen-abliterated-f16.gguf ../../models/qwen-abliterated-q4_k_m.gguf Q4_K_M
```

**Success:** `qwen-abliterated-q4_k_m.gguf` is ~40–60% smaller than F16.

> **Tip:** If quantize is too hard on Windows, use **F16 GGUF** in LM Studio (needs more RAM) or convert on Linux WSL once.

---

## Step 4 — Ollama (step by step)

### 4.1 Install Ollama

Download: [ollama.com](https://ollama.com/download) — install and confirm:

```powershell
ollama --version
```

### 4.2 Create a Modelfile

In `C:\Users\YOU\local-ai-abliterate\models\Modelfile` (no extension):

```dockerfile
FROM ./qwen-abliterated-q4_k_m.gguf

PARAMETER temperature 0.7
PARAMETER num_ctx 8192

TEMPLATE """{{ if .System }}<|im_start|>system
{{ .System }}<|im_end|>
{{ end }}{{ if .Prompt }}<|im_start|>user
{{ .Prompt }}<|im_end|>
{{ end }}<|im_start|>assistant
"""
```

> **Important:** Chat template must match your model family. Qwen2.5 uses ChatML-style above. For Llama 3, use Llama 3 template — check the model card on Hugging Face.

### 4.3 Register model

```powershell
cd C:\Users\YOU\local-ai-abliterate\models
ollama create my-abliterated-qwen -f Modelfile
```

**Success:** `created successfully` or similar.

### 4.4 Chat

```powershell
ollama run my-abliterated-qwen
```

Type a test prompt. Compare with your **old** Ollama model:

```powershell
ollama run qwen2.5:1.5b
```

### 4.5 Use in Open WebUI / Continue / etc.

Point API to `http://localhost:11434` — model name `my-abliterated-qwen`.

---

## Step 5 — LM Studio (GUI path)

Good if you prefer **no terminal** for daily chat.

1. Install [LM Studio](https://lmstudio.ai/)
2. **Drag and drop** `qwen-abliterated-q4_k_m.gguf` into LM Studio
3. Load model — pick GPU offload layers (max for your VRAM)
4. Open **Chat** tab — same test prompts as Ollama
5. Export/compare: note model path in LM Studio models folder

**Success:** Abliterated model responds where base model refused.

---

## Step 6 — text-generation-webui (optional)

```bash
git clone https://github.com/oobabooga/text-generation-webui.git
cd text-generation-webui
./start_windows.bat   # or start_linux.sh
```

Place GGUF in `text-generation-webui/models/` — select in UI **Model** dropdown.

---

## Step 7 — Verify you improved the right thing

Run this **same prompt** on base vs abliterated:

```text
Explain how to run wmic diskdrive get Model,Size on Windows for hardware inventory.
```

| Base model | Abliterated |
|------------|-------------|
| Refusal / disclaimer | Technical steps |

Also test a **genuinely harmful** prompt — document behavior for your own risk notes ([risks-and-ethics.md](../docs/risks-and-ethics.md)).

---

## Step 8 — Rollback

Keep `*-ORIGINAL` safetensors and your old Ollama model. To revert:

```powershell
ollama run qwen2.5:1.5b
# or delete custom model:
ollama rm my-abliterated-qwen
```

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Garbled output in Ollama | Wrong `TEMPLATE` in Modelfile — copy from HF model card |
| OOM when loading GGUF | Use Q4_K_M not F16; reduce `num_ctx` |
| Convert script fails | `pip install transformers`; check safetensors folder complete |
| Ollama model empty replies | Re-convert; verify abliterated HF folder generates text in Python |
| Slower than before | Normal for Q4 on CPU; enable GPU layers in LM Studio |

---

## Related

- [beginner-local-model-guide.md](beginner-local-model-guide.md) — Heretic surgery steps
- [../methods/gguf-export-notes.md](../methods/gguf-export-notes.md) — technical notes
- [low-vram-abliteration.md](low-vram-abliteration.md) — if convert OOMs