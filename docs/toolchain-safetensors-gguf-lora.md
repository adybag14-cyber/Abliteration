# Toolchain — safetensors, GGUF, LoRA / QLoRA (Jun 2026)

Correct, up-to-date paths for **removing alignment refusal directions** from model weights and deploying locally.  
This is **weight surgery** on Hugging Face–format checkpoints — not prompt jailbreaks.

> Ethics & scope: [risks-and-ethics.md](risks-and-ethics.md) · Factory/agent eval gates: [../instructions/eval-driven-workflow.md](../instructions/eval-driven-workflow.md)

---

## Golden rule

| Format | Can abliterate directly? | Role |
|--------|--------------------------|------|
| **Safetensors (HF layout)** | ✅ Yes — primary surgery surface | Heretic / llm-abliteration output |
| **GGUF** | ❌ Not in-place surgery | Inference + optional **measure** via abliterate.cpp |
| **PEFT LoRA adapter** | ⚠️ ΔW export or SGD QLoRA | Sidecar deploy or merge → GGUF |

**Never** expect to “uncensor” by quantizing or editing GGUF tensors by hand. Always ablate **base safetensors**, then convert.

---

## Decision tree (2026)

```
Have HF instruct safetensors?
│
├─ Want automatic + best KL/refusal trade-off?
│   └─ Heretic (pip install heretic-llm) → safetensors out
│
├─ Want YAML layer control / sharded 70B on one GPU?
│   └─ llm-abliteration v1.2: measure → analyze → sharded_ablate.py
│
├─ Only have GGUF + weak GPU?
│   └─ abliterate.cpp (WIP) → measurements.pt → llm-abliteration ablate → HF → GGUF
│
└─ Deploy locally?
    ├─ Single file → merge weights → convert_hf_to_gguf.py → Q4_K_M → Ollama
    ├─ Base + policy adapter → export LoRA → convert_lora_to_gguf.py → llama.cpp --lora
    └─ Download community → p-e-w/*-heretic or registry GGUF
```

---

## Path 1 — Heretic → safetensors (recommended)

**Tool:** [p-e-w/heretic](https://github.com/p-e-w/heretic) · PyPI `heretic-llm` · Docs [mintlify](https://p-e-w-heretic.mintlify.app/)

| Step | Command / config |
|------|------------------|
| Install | `pip install -U heretic-llm bitsandbytes accelerate safetensors` |
| Config | `cp sources/heretic-tools/config.production.toml config.toml` |
| 8 GB | `config.low-vram.toml` → `quantization = "bnb_4bit"` |
| Run | `heretic Qwen/Qwen3-4B-Instruct-2507` |
| Output | New folder — `model*.safetensors`, tokenizer, config |

**What Heretic edits:** `mlp.down_proj`, `self_attn.o_proj` (and MoE expert downs) via projected + norm-preserving abliteration with Optuna kernel search.

**Built-in LoRA:** `row_normalization = "full"` embeds rank-r correction tensors in the export — not the same as PEFT SGD LoRA.

**2026 notes:**

- 4000+ community models tagged `heretic` on Hugging Face
- Supports dense, many VLMs, MoE (Qwen3-MoE), Qwen3.5 hybrid, gpt-oss (PyTorch 2.6+ for MXFP4)
- Community **Heretic 1.2** reports ~70% lower VRAM — keep `pip install -U heretic-llm` current
- Pins: [tools/heretic-tools-reference.md](tools/heretic-tools-reference.md)

---

## Path 2 — llm-abliteration → safetensors (manual control)

**Tool:** [jim-plus/llm-abliteration](https://github.com/jim-plus/llm-abliteration) · **v1.2** (Jan 2026)

```bash
git clone https://github.com/jim-plus/llm-abliteration.git
pip install -r requirements.txt

# 1. Measure (4-bit OK for this step only)
python measure.py -m ./base-model -o directions.pt --quant 4bit --projected \
  --data-harmful harmful.txt --data-harmless harmless.txt

# 2. Analyze layers
python analyze.py directions.pt -c

# 3. Ablate — MUST use full-weight base (not 4-bit checkpoint)
python sharded_ablate.py gemma3-12b-it.yml --projected --normpreserve
```

| Flag | Effect |
|------|--------|
| `--quant 4bit` | Measure only — **ablation requires full safetensors** |
| `--projected` | Projected refusal direction (Jim Lai) |
| `--normpreserve` | Norm-preserving biprojected export |
| `--invert` | Add direction instead of ablate (research) |
| `--deccp` | Extra topics for Chinese models |

**Why sharded:** loads one safetensors shard + one layer at a time — ablate 27B+ on consumer VRAM.

→ [../methods/projected-llm-abliteration.md](../methods/projected-llm-abliteration.md)

---

## Path 3 — Safetensors → GGUF → Ollama

**Tools:** [ggml-org/llama.cpp](https://github.com/ggml-org/llama.cpp) (now Hugging Face org, Feb 2026)

```bash
git clone https://github.com/ggml-org/llama.cpp.git tools/llama.cpp
cd tools/llama.cpp

# F16 GGUF (or direct Q8_0)
python convert_hf_to_gguf.py ../../models/qwen3-abliterated \
  --outfile ../../out/qwen3-f16.gguf --outtype f16

# Quantize
./llama-quantize ../../out/qwen3-f16.gguf ../../out/qwen3-q4_k_m.gguf Q4_K_M

# Ollama
cd ../../out
ollama create qwen3-abliterated -f Modelfile
```

**Modelfile:** match `chat_template` from `tokenizer_config.json` — wrong template = gibberish after quant.

**Unsloth shortcut** (if you trained/repaired with Unsloth):

```python
model.save_pretrained_gguf("out", tokenizer, quantization_method="q4_k_m")
```

→ [../methods/gguf-export-notes.md](../methods/gguf-export-notes.md) · [../instructions/run-locally-ollama-lmstudio.md](../instructions/run-locally-ollama-lmstudio.md)

---

## Path 4 — LoRA / QLoRA abliteration deploy

Three distinct mechanisms — do not conflate:

| Mechanism | What it is | Tool |
|-----------|------------|------|
| **A. Heretic norm-preserving rank** | Structural LoRA baked in `row_normalization=full` | Heretic config |
| **B. ΔW factorization** | `W' - W` → PEFT adapter | `scripts/export-abliteration-lora.py` |
| **C. Grimjim-style abliteration LoRA** | Train/export refusal-removal as adapter on base | HF `grimjim/*-abliteration-LoRA-*` |
| **D. Jarvis QLoRA** | SGD tool-call repair **after** abliteration | Unsloth / TRL |

### B — Export ΔW adapter

```bash
python scripts/export-abliteration-lora.py \
  --base ./models/Qwen3-4B-ORIGINAL \
  --abliterated ./models/Qwen3-4B-abliterated \
  --out ./adapters/abliteration-r16 \
  --rank 16
```

### Merge for single GGUF (Ollama)

```python
from peft import PeftModel
merged = PeftModel.from_pretrained(base, "./adapters/abliteration-r16").merge_and_unload()
merged.save_pretrained("./merged-abliterated")
# then convert_hf_to_gguf.py
```

### GGUF LoRA sidecar (no merge)

```bash
# PEFT → GGUF LoRA
python convert_lora_to_gguf.py \
  --outfile abliteration-lora-f16.gguf \
  --base-model-id Qwen/Qwen3-4B-Instruct-2507 \
  --lora-path ./adapters/abliteration-r16

# Inference
./llama-cli -m base-q4_k_m.gguf --lora abliteration-lora-f16.gguf
./llama-cli -m base-q4_k_m.gguf --lora-scaled abliteration-lora-f16.gguf 0.8
```

**Web UI:** [huggingface.co/spaces/ggml-org/gguf-my-lora](https://huggingface.co/spaces/ggml-org/gguf-my-lora)  
**Examples:** [ggml-org GGUF LoRA adapters collection](https://huggingface.co/collections/ggml-org/gguf-lora-adapters) — includes abliteration LoRAs for Llama 3 / 3.1 8B.

`llama-server` supports multiple `--lora` adapters and hot reload via `/lora-adapters`.

→ [../techniques/lora-qlora-abliteration.md](../techniques/lora-qlora-abliteration.md) · [../methods/lora-adapter-export.md](../methods/lora-adapter-export.md)

---

## Path 5 — GGUF-native measure (low VRAM, experimental)

**Tool:** [kabachuha/abliterate.cpp](https://github.com/kabachuha/abliterate.cpp) — **WIP** (~20% comply rate in author tests). Not a production agent path; prefer Heretic on safetensors. Details: [../methods/gguf-export-notes.md](../methods/gguf-export-notes.md#gguf--measure--safetensors-experimental).

1. Replace llama.cpp `tools/cvector-generator` with abliterate.cpp fork
2. Run `llama-cvector-generator` on **GGUF** with harmful/harmless `.txt` prompts
3. `convert-into-measurements.py` → `measurements.pt`
4. Feed into **llm-abliteration** `sharded_ablate.py` on HF safetensors
5. Re-export GGUF

Use when you cannot fit HF FP16 for measure — not production-ready for agents yet.

---

## Path 6 — QLoRA 4-bit **measure** (not training)

| Tool | `bnb_4bit` role |
|------|-----------------|
| Heretic | Optuna trials on 4-bit loaded weights; exports full safetensors |
| llm-abliteration | `--quant 4bit` on `measure.py` only |

This is **not** QLoRA fine-tuning — no gradient updates on refusal. For SGD QLoRA after abliteration see Jarvis pack.

---

## Tool status matrix (Jun 2026)

| Tool | Status | Output | Best for |
|------|--------|--------|----------|
| **Heretic** | Production | Safetensors | Automatic, best KL |
| **llm-abliteration** | Production v1.2 | Safetensors | Manual layers, sharded 70B |
| **refusal_direction** | Research | `direction.pt` | Paper repro |
| **remove-refusals-with-transformers** | Community | Safetensors | No TransformerLens |
| **abliterate.cpp** | WIP | measurements.pt | GGUF measure |
| **abliterix** | Community CLI | Varies | Alt wrapper — verify before use |
| **llama.cpp convert** | Production | GGUF | All local deploy |
| **GGUF-my-LoRA** | Production | GGUF LoRA | Adapter sidecars |
| **Unsloth GGUF export** | Production | GGUF | Post QLoRA repair |
| **PEFT merge** | Production | Safetensors | Ollama single-file |

---

## What does *not* remove safety

| Approach | Why insufficient |
|----------|------------------|
| Lower temperature / system prompt | Session-only; not weight surgery |
| Uncensored SFT only | Different mechanism; may not fix tool refusals |
| Quantizing aligned GGUF harder | Quant ≠ abliteration |
| Editing GGUF in hex | Breaks tensors; use HF pipeline |
| Circuit breakers training | **Adds** safety — opposite goal |

---

## Recommended stacks

| VRAM | Surgery | Deploy |
|------|---------|--------|
| 8 GB | Heretic `bnb_4bit` 1.5B–4B | Q4_K_M GGUF Ollama |
| 12–16 GB | Heretic 4B FP16 or 8B 4-bit | GGUF Q4/Q5 |
| 24 GB | Heretic production profile 8B–12B | GGUF or vLLM safetensors |
| Cloud surgery → edge infer | Heretic → LoRA export r=16 | 4-bit base + adapter or merged Q4 |
| No GPU | Download `p-e-w/*-heretic` | GGUF from community |

---

## Related

- [tools/abliteration-tooling.md](tools/abliteration-tooling.md) — full catalog
- [research-landscape.md](research-landscape.md) — papers & taxonomy
- [../methods/safetensor-abliteration-pipeline.md](../methods/safetensor-abliteration-pipeline.md)
- [../methods/gguf-export-notes.md](../methods/gguf-export-notes.md)