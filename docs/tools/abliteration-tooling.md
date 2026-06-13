# Abliteration & low-VRAM tooling catalog

Tools for **weight surgery**, **4-bit measure**, **LoRA export**, **quantized inference**, and **agent deployment**. GitHub-first — see [../../references.md](../../references.md).

---

## Core abliteration (safetensors surgery)

| Tool | URL | Role | VRAM notes |
|------|-----|------|------------|
| **Heretic** | [p-e-w/heretic](https://github.com/p-e-w/heretic) | **Primary** — automatic Optuna + projected + norm-preserving | `bnb_4bit`, CPU offload; PyPI `heretic-llm` |
| **Heretic pins (this repo)** | [heretic-tools-reference.md](heretic-tools-reference.md) | Immutable configs, HF registry | Offline copy-paste |
| **llm-abliteration** | [jim-plus/llm-abliteration](https://github.com/jim-plus/llm-abliteration) | **v1.2** (Jan 2026) measure → analyze → sharded ablate | 4-bit measure; **full-weight ablate** |
| **refusal_direction** | [andyrdt/refusal_direction](https://github.com/andyrdt/refusal_direction) | Paper reproduction | Research GPU |
| **remove-refusals-with-transformers** | [Sumandora/remove-refusals-with-transformers](https://github.com/Sumandora/remove-refusals-with-transformers) | Pure HF, no TransformerLens | Medium |
| **abliterate.cpp** | [kabachuha/abliterate.cpp](https://github.com/kabachuha/abliterate.cpp) | GGUF-native direction measure → llm-abliteration | WIP experimental |
| **abliterix** | [wuwangzhang1216/abliterix](https://github.com/wuwangzhang1216/abliterix) | Community CLI wrapper | Verify before production |
| **ErisForge** | [Tsadoq/ErisForge](https://github.com/Tsadoq/ErisForge) | Toolkit | Varies |
| **TransformerLens** | [TransformerLensOrg/TransformerLens](https://github.com/TransformerLensOrg/TransformerLens) | Hooks, direction probes | 1–3B on 8 GB |
| **wassname/abliterator** | [wassname/abliterator](https://github.com/wassname/abliterator) | Community | Legacy |
| **FailSpy/abliterator** | [FailSpy/abliterator](https://github.com/FailSpy/abliterator) | Early tooling | Legacy |

**Master toolchain doc:** [../toolchain-safetensors-gguf-lora.md](../toolchain-safetensors-gguf-lora.md) · Safetensors: [../../methods/safetensor-abliteration-pipeline.md](../../methods/safetensor-abliteration-pipeline.md)

Workflows: [../../instructions/heretic-workflow.md](../../instructions/heretic-workflow.md) · [../../instructions/low-vram-abliteration.md](../../instructions/low-vram-abliteration.md)

---

## Quantization & memory

| Tool | URL | Role |
|------|-----|------|
| **bitsandbytes** | [bitsandbytes-foundation/bitsandbytes](https://github.com/bitsandbytes-foundation/bitsandbytes) | 4/8-bit load for measure & infer |
| **Accelerate** | [huggingface/accelerate](https://github.com/huggingface/accelerate) | `device_map`, `max_memory` offload |
| **auto-gptq** | [AutoGPTQ/AutoGPTQ](https://github.com/AutoGPTQ/AutoGPTQ) | GPTQ quant (post-abliteration) |
| **autoawq** | [casper-hansen/AutoAWQ](https://github.com/casper-hansen/AutoAWQ) | AWQ quant |
| **llama.cpp** | [ggml-org/llama.cpp](https://github.com/ggml-org/llama.cpp) | GGUF convert + `llama-quantize` |
| **Ollama** | [ollama/ollama](https://github.com/ollama/ollama) | Local GGUF serving |
| **LM Studio** | [lmstudio.ai](https://lmstudio.ai/) | GUI GGUF (desktop) |

Typical post-abliteration chains:

```bash
# Merged full weights → Ollama
convert_hf_to_gguf.py → llama-quantize Q4_K_M → ollama create

# LoRA sidecar → llama.cpp (keep base GGUF)
export-abliteration-lora.py → convert_lora_to_gguf.py → llama-cli --lora

# Browser LoRA convert
# huggingface.co/spaces/ggml-org/gguf-my-lora
```

→ [../../methods/gguf-export-notes.md](../../methods/gguf-export-notes.md)

---

## LoRA / QLoRA stack

| Tool | URL | Role |
|------|-----|------|
| **PEFT** | [huggingface/peft](https://github.com/huggingface/peft) | LoRA adapters; merge for GGUF |
| **export-abliteration-lora.py** | [../../scripts/export-abliteration-lora.py](../../scripts/export-abliteration-lora.py) | ΔW → adapter safetensors |
| **convert_lora_to_gguf.py** | [ggml-org/llama.cpp](https://github.com/ggml-org/llama.cpp) | PEFT LoRA → GGUF sidecar |
| **GGUF-my-LoRA** | [spaces/ggml-org/gguf-my-lora](https://huggingface.co/spaces/ggml-org/gguf-my-lora) | Web convert PEFT → GGUF |
| **grimjim abliteration LoRA** | [Llama-3-Instruct-abliteration-LoRA-8B](https://huggingface.co/grimjim/Llama-3-Instruct-abliteration-LoRA-8B) | Refusal removal as trained adapter |
| **Unsloth** | [unslothai/unsloth](https://github.com/unslothai/unsloth) | Fast 4-bit QLoRA + `save_pretrained_gguf` |
| **TRL** | [huggingface/trl](https://github.com/huggingface/trl) | DPO/SFT trainers (Jarvis repair) |
| **Axolotl** | [axolotl-ai-cloud/axolotl](https://github.com/axolotl-ai-cloud/axolotl) | YAML-driven QLoRA fine-tunes |
| **torchtune** | [pytorch/torchtune](https://github.com/pytorch/torchtune) | Meta fine-tuning recipes |

| Use case | Tool |
|----------|------|
| Heretic norm-preserving LoRA | Built into Heretic `row_normalization = full` |
| ΔW → adapter export | [../../methods/lora-adapter-export.md](../../methods/lora-adapter-export.md) |
| Post-abliteration tool repair | Jarvis pack + Unsloth/TRL QLoRA |

Theory: [../../techniques/lora-qlora-abliteration.md](../../techniques/lora-qlora-abliteration.md)

---

## Inference servers (agents)

| Tool | URL | Role |
|------|-----|------|
| **vLLM** | [vllm-project/vllm](https://github.com/vllm-project/vllm) | High-throughput API; LoRA slots |
| **llama.cpp server** | [ggml-org/llama.cpp](https://github.com/ggml-org/llama.cpp) | CPU/GPU GGUF |
| **text-generation-webui** | [oobabooga/text-generation-webui](https://github.com/oobabooga/text-generation-webui) | UI + extensions |
| **ExLlamaV2** | [turboderp/exllamav2](https://github.com/turboderp/exllamav2) | Fast 4-bit CUDA infer |
| **koboldcpp** | [LostRuins/koboldcpp](https://github.com/LostRuins/koboldcpp) | Portable GGUF |

CyberGym / OpenHands: point agent at OpenAI-compatible endpoint (`vLLM` or `llama.cpp --api`).

---

## Apple Silicon & CPU-only

| Tool | URL | Role |
|------|-----|------|
| **mlx-lm** | [ml-explore/mlx-examples](https://github.com/ml-explore/mlx-examples/tree/main/llms) | MLX quant + LoRA on Mac |
| **llama.cpp** (Metal) | [ggml-org/llama.cpp](https://github.com/ggml-org/llama.cpp) | Best Mac GGUF path |

Surgery on Mac: prefer cloud Heretic + local GGUF.

---

## Optimization & search

| Tool | URL | Role |
|------|-----|------|
| **Optuna** | [optuna/optuna](https://github.com/optuna/optuna) | Heretic TPE search backend |
| **PaCMAP** | [YingfanWang/PaCMAP](https://github.com/YingfanWang/PaCMAP) | Heretic residual plots (`[research]` extra) |

---

## Interpretability & advanced direction finding

| Tool | URL | Role |
|------|-----|------|
| **GemmaScope** | [google/gemma-scope](https://huggingface.co/google/gemma-scope-9b-it-res) | JumpReLU SAEs for refusal latents |
| **andyrdt SAEs** | [saes-llama-3.1-8b-instruct](https://huggingface.co/andyrdt/saes-llama-3.1-8b-instruct) | Llama 3.1 residual SAEs |
| **TransformerLens** | [TransformerLensOrg/TransformerLens](https://github.com/TransformerLensOrg/TransformerLens) | Hooks, activation cache |
| **repeng / RepE** | [arxiv 2310.01405](https://arxiv.org/abs/2310.01405) | Representation engineering vectors |
| **TUM geometry-of-refusal** | [cs.cit.tum.de/daml/geometry-of-refusal](https://www.cs.cit.tum.de/daml/geometry-of-refusal/) | Gradient RDO code |
| **GraySwan circuit-breakers** | [GraySwanAI/circuit-breakers](https://github.com/GraySwanAI/circuit-breakers) | Defensive training (contrast) |
| **ErisForge** | [Tsadoq/ErisForge](https://github.com/Tsadoq/ErisForge) | Abliteration toolkit |
| **Nous llm-abliteration** | [NousResearch/llm-abliteration](https://github.com/NousResearch/llm-abliteration) | Fork of manual pipeline |

---

## Datasets (refusal taxonomy)

| Dataset | Use |
|---------|-----|
| mlabonne/harmful_behaviors | Heretic default bad |
| mlabonne/harmless_alpaca | Heretic default good |
| SorryBench splits | Category-specific directions |
| CoCoNot | Contextual non-compliance |
| XSTest | Over-refusal measurement |
| WildGuardMix | Safety core prompts |
| Custom factory `.txt` | WMI/nmap false-refusal pairs |

---

## Datasets (direction estimation)

| Dataset | URL | Use |
|---------|-----|-----|
| mlabonne/harmless_alpaca | HF | Heretic default good prompts |
| mlabonne/harmful_behaviors | HF | Heretic default bad prompts |
| deccp | [AUGMXNT/deccp](https://github.com/AUGMXNT/deccp) | llm-abliteration `--deccp` |

Custom: one prompt per line `.txt` or JSONL — see Heretic `config.default.toml` `[good_prompts]` / `[bad_prompts]`.

---

## Agent & eval (this repo)

| Asset | Path |
|-------|------|
| Jarvis tool repair v7 | [../../sources/jarvis-pack/IMPORT.md](../../sources/jarvis-pack/IMPORT.md) |
| hardware-tool-gate | [../../scripts/hardware-tool-gate.py](../../scripts/hardware-tool-gate.py) |
| Cyber eval prompts | [../../data/eval/cyber-research-prompts.jsonl](../../data/eval/cyber-research-prompts.jsonl) |
| Factory eval | [../../data/eval/hardware-factory-prompts.jsonl](../../data/eval/hardware-factory-prompts.jsonl) |
| OpenHands | [github.com/OpenHands/OpenHands](https://github.com/OpenHands/OpenHands) |
| CyberGym | [cybergym.io](https://cybergym.io) |

---

## Install one-liners

```bash
# Full Heretic + quant stack
pip install -U heretic-llm bitsandbytes accelerate safetensors

# Manual pipeline + 4-bit measure
pip install torch transformers bitsandbytes peft

# LoRA export after abliteration
pip install peft safetensors

# Research plots
pip install -U "heretic-llm[research]"

# GGUF toolchain
git clone https://github.com/ggml-org/llama.cpp.git tools/llama.cpp
```

---

## Tool selection by goal

```
Remove refusal from safetensors (automatic)?
  └─ Heretic (heretic-llm) → save HF checkpoint

Remove refusal (manual layer YAML)?
  └─ llm-abliteration v1.2: measure 4bit → sharded_ablate full weights

Only have GGUF for measure?
  └─ abliterate.cpp (WIP) → measurements.pt → llm-abliteration

Deploy Ollama single file?
  └─ merge LoRA OR full abliterated safetensors → convert_hf_to_gguf Q4_K_M

Deploy llama.cpp with swappable policy?
  └─ export-abliteration-lora.py → convert_lora_to_gguf → --lora-scaled

Post-abliteration tool-call repair?
  └─ Jarvis QLoRA (Unsloth/TRL) — SGD, not abliteration

Skip surgery entirely?
  └─ Download p-e-w/*-heretic or community GGUF
```

**Do not:** edit GGUF tensors directly; quantize aligned models expecting uncensoring.