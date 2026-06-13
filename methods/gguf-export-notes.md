# GGUF export notes (post-abliteration)

Convert **abliterated safetensors** to **GGUF** for llama.cpp, Ollama, LM Studio, koboldcpp.

> Surgery happens on safetensors first — see [safetensor-abliteration-pipeline.md](safetensor-abliteration-pipeline.md).  
> Master toolchain: [../docs/toolchain-safetensors-gguf-lora.md](../docs/toolchain-safetensors-gguf-lora.md)

---

## Standard path (merged weights)

### 1. Prerequisites

```bash
git clone https://github.com/ggml-org/llama.cpp.git tools/llama.cpp
pip install -r tools/llama.cpp/requirements.txt
```

llama.cpp joined Hugging Face (ggml-org) in Feb 2026 — use `ggml-org/llama.cpp` as canonical remote.

### 2. Convert HF → F16 GGUF

```bash
python tools/llama.cpp/convert_hf_to_gguf.py ./models/qwen3-abliterated \
  --outfile ./out/qwen3-f16.gguf \
  --outtype f16 \
  --split-max-size 5G
```

Direct quant types (skip separate quantize step):

```bash
python tools/llama.cpp/convert_hf_to_gguf.py ./models/qwen3-abliterated \
  --outfile ./out/qwen3-q4_k_m.gguf \
  --outtype q4_k_m
```

### 3. Optional second-pass quantize

```bash
cd tools/llama.cpp
cmake -B build -DGGML_CUDA=ON
cmake --build build --config Release -j --target llama-quantize
./build/bin/llama-quantize ../../out/qwen3-f16.gguf ../../out/qwen3-q4_k_m.gguf Q4_K_M
```

### 4. Ollama

```dockerfile
# Modelfile
FROM ./qwen3-q4_k_m.gguf
TEMPLATE """{{ if .System }}<|im_start|>system
{{ .System }}<|im_end|>
{{ end }}{{ if .Prompt }}<|im_start|>user
{{ .Prompt }}<|im_end|>
{{ end }}<|im_start|>assistant
"""
PARAMETER temperature 0.7
PARAMETER stop "<|im_end|>"
```

```bash
ollama create qwen3-abliterated -f Modelfile
ollama run qwen3-abliterated
```

Copy exact template from `tokenizer_config.json` `chat_template` — **#1 cause of post-export gibberish**.

→ [../instructions/run-locally-ollama-lmstudio.md](../instructions/run-locally-ollama-lmstudio.md)

---

## LoRA sidecar path (base GGUF + abliteration adapter)

When you keep the **aligned base** and ship only the refusal-removal delta:

### 1. Export PEFT adapter

```bash
python scripts/export-abliteration-lora.py \
  --base ./models/Qwen3-4B-ORIGINAL \
  --abliterated ./models/Qwen3-4B-abliterated \
  --out ./adapters/abliteration-r16 \
  --rank 16
```

Or use community adapters: [grimjim/Llama-3-Instruct-abliteration-LoRA-8B](https://huggingface.co/grimjim/Llama-3-Instruct-abliteration-LoRA-8B)

### 2. Convert LoRA → GGUF

```bash
python tools/llama.cpp/convert_lora_to_gguf.py \
  --outfile ./out/abliteration-lora-f16.gguf \
  --base-model-id meta-llama/Llama-3.1-8B-Instruct \
  --lora-path ./adapters/abliteration-r16
```

**Web UI:** [huggingface.co/spaces/ggml-org/gguf-my-lora](https://huggingface.co/spaces/ggml-org/gguf-my-lora)

### 3. Run with llama.cpp

```bash
# Default scale 1.0
./llama-cli -c 4096 -cnv \
  -m ./base-q4_k_m.gguf \
  --lora ./out/abliteration-lora-f16.gguf

# Tunable strength
./llama-cli -c 4096 -cnv \
  -m ./base-q4_k_m.gguf \
  --lora-scaled ./out/abliteration-lora-f16.gguf 0.85
```

**llama-server** — multiple adapters, hot reload:

```bash
./llama-server -m base-q4_k_m.gguf \
  --lora adapter1.gguf --lora adapter2.gguf \
  --lora-init-without-apply
# POST /lora-adapters to apply
```

Examples: [ggml-org GGUF LoRA collection](https://huggingface.co/collections/ggml-org/gguf-lora-adapters)

---

## Merge LoRA before GGUF (Ollama-friendly)

Ollama does not load separate GGUF LoRA sidecars today — **merge first**:

```python
from transformers import AutoModelForCausalLM
from peft import PeftModel

base = AutoModelForCausalLM.from_pretrained("./base", torch_dtype="auto", device_map="cpu")
model = PeftModel.from_pretrained(base, "./adapters/abliteration-r16")
merged = model.merge_and_unload()
merged.save_pretrained("./merged-abliterated")
```

Then `convert_hf_to_gguf.py` on `./merged-abliterated`.

---

## Unsloth export (post Jarvis QLoRA)

If you used Unsloth for tool-repair QLoRA on an abliterated base:

```python
model.save_pretrained_gguf("out", tokenizer, quantization_method="q4_k_m")
# or push_to_hub_gguf(...)
```

→ [Unsloth GGUF docs](https://unsloth.ai/docs/basics/inference-and-deployment/saving-to-gguf)

---

## Vision / MoE caveats

| Architecture | Note |
|--------------|------|
| Vision (Gemma 3 VL, Qwen-VL) | Include `mmproj` in convert; test text-only and image paths |
| MoE | Full merged safetensors required — verify all experts abliterated |
| gpt-oss / MXFP4 | Heretic on HF first; convert with latest llama.cpp |

---

## Quantization guidance

| Quant | Use |
|-------|-----|
| **Q4_K_M** | Default local — best size/quality |
| **Q5_K_M** | Factory agent quality on 16 GB RAM |
| **Q8_0** | Minimal quant loss for eval |
| **F16** | Benchmarking abliteration quality |
| **Q2_K** | Avoid for abliterated models — amplifies artifacts |

Always A/B **same prompt** on F16 vs Q4 after export.

---

## GGUF → measure → safetensors (experimental)

| Field | Value |
|-------|-------|
| **Tool** | [kabachuha/abliterate.cpp](https://github.com/kabachuha/abliterate.cpp) |
| **Status** | **WIP** — author reports ~20% comply rate in tests |
| **Input** | GGUF + harmful/harmless `.txt` prompt lists |
| **Output** | `measurements.pt` → llm-abliteration `sharded_ablate.py` on HF safetensors |
| **Production?** | No — use Heretic on safetensors first; abliterate.cpp when you only have GGUF |

Flow: patch llama.cpp `cvector-generator` → run on GGUF → `convert-into-measurements.py` → ablate HF shards → re-export GGUF.

→ Full toolchain table: [../docs/toolchain-safetensors-gguf-lora.md](../docs/toolchain-safetensors-gguf-lora.md#gguf--measure--safetensors-experimental)

---

## Related

- [lora-adapter-export.md](lora-adapter-export.md)
- [../techniques/lora-qlora-abliteration.md](../techniques/lora-qlora-abliteration.md)
- [../docs/toolchain-safetensors-gguf-lora.md](../docs/toolchain-safetensors-gguf-lora.md)