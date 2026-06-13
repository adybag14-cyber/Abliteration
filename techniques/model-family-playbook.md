# Model family playbook

Architecture-specific abliteration notes — targets, quirks, VRAM, and handbook configs.

---

## Qwen2.5 / Qwen3 (dense)

| Item | Value |
|------|-------|
| Targets | `mlp.down_proj`, `self_attn.o_proj` |
| 8 GB path | `Qwen2.5-1.5B` + `config.low-vram.toml` |
| Sweet spot | `Qwen3-4B-Instruct-2507` |
| Quirks | Strong chat template; thinking variants need CoT skips |
| Community outputs | `p-e-w/Qwen3-4B-Instruct-2507-heretic` |

```bash
cp sources/heretic-tools/config.low-vram.toml config.toml   # 8 GB
heretic Qwen/Qwen3-4B-Instruct-2507
```

Thinking: → [thinking-model-abliteration.md](thinking-model-abliteration.md)

---

## Qwen3 MoE (e.g. 30B-A3B)

| Item | Value |
|------|-------|
| Targets | **Every** `experts[*].down_proj` |
| VRAM | 4-bit required on ≤24 GB |
| Risk | Missed experts → uneven quality |
| **Abliterix** | Expert-granular presets when Heretic module map is incomplete — verify per checkpoint |

```bash
quantization = "bnb_4bit"
offload_outputs_to_cpu = true
heretic Qwen/Qwen3-30B-A3B-Instruct
```

→ [moe-hybrid-abliteration.md](moe-hybrid-abliteration.md) · [../methods/moe-expert-abliteration.md](../methods/moe-expert-abliteration.md) · [extended-abliteration-toolkit.md](extended-abliteration-toolkit.md)

---

## Gemma 3

| Item | Value |
|------|-------|
| Targets | Standard MLP + attn |
| Quirks | **Massive activations** — set `winsorization_quantile = 0.95` |
| Benchmark | `google/gemma-3-12b-it` → `p-e-w/gemma-3-12b-it-heretic` |
| Low VRAM | `gemma-3-270m-it` for experiments |

```toml
winsorization_quantile = 0.95
full_normalization_lora_rank = 8
```

---

## Gemma 4 (dense, MoE, VL)

| Item | Value |
|------|-------|
| Dense | E2B / E4B / 12B — standard MLP + `o_proj` |
| MoE | `gemma-4-26B-A4B-it` — per-expert targets (verify module names) |
| VL | Text trunk same as dense; image refusal often template-level |
| Heretic | Community checkpoints on HF registry — see [heretic-models-registry.md](../docs/tools/heretic-models-registry.md) |
| **Abliterix** | Upstream presets for Gemma-4 families; reported low-KL E4B runs — pair with **HonestAbliterationBench** + handbook factory JSONL |
| Agent tools | Native `tools=` template — eval before GGUF; see [abliteration-tooling.md](../docs/tools/abliteration-tooling.md) |

```bash
# Handbook default
cp sources/heretic-tools/config.production.toml config.toml
heretic google/gemma-4-12b-it

# MoE / VL / preset automation — verify AGPL + eval gates
# → extended-abliteration-toolkit.md (Abliterix section)
```

MoE detail → [moe-hybrid-abliteration.md](moe-hybrid-abliteration.md) · VL → [vision-multimodal-abliteration.md](vision-multimodal-abliteration.md) · toolkit → [extended-abliteration-toolkit.md](extended-abliteration-toolkit.md)

---

## Llama 3.1 / 3.2 / 3.3

| Item | Value |
|------|-------|
| Targets | `down_proj`, `o_proj` |
| Access | Many checkpoints **gated** — `huggingface-cli login` |
| Agent stack | `meta-llama/Llama-3.1-8B-Instruct` |
| SAE research | `andyrdt/saes-llama-3.1-8b-instruct` |

```bash
huggingface-cli login
cp sources/heretic-tools/config.production.toml config.toml
heretic meta-llama/Llama-3.1-8B-Instruct
```

---

## Phi-3.5-MoE

| Item | Value |
|------|-------|
| Expert down | `block_sparse_moe.experts[*].w2` |
| VRAM | 4-bit + CPU offload |

Verify module names in Heretic `model.py` for your revision before manual ablation.

---

## Mistral / Mixtral

| Item | Value |
|------|-------|
| Mixtral | MoE — per-expert `w2` / `down_proj` |
| Mistral 7B | Standard dense path |
| Template | `<s>[INST]` — match in Ollama Modelfile |

---

## Vision-language (Gemma 3 VL, Qwen2.5-VL, Gemma 4 VL)

| Item | Value |
|------|-------|
| Text refusal | Same weight targets on language trunk |
| Images | Heretic measures on **text-only** prompts by default |
| VL false-refusal | "I cannot see images" — separate from weight surgery |
| **Abliterix** | VL/SSM presets in upstream config library — verify text-only eval first |

→ [vision-multimodal-abliteration.md](vision-multimodal-abliteration.md) · [extended-abliteration-toolkit.md](extended-abliteration-toolkit.md)

---

## gpt-oss / open-weight reasoning

| Item | Value |
|------|-------|
| CoT channel | gpt-oss `analysis` / `final` channel pair in `chain_of_thought_skips` |
| Example | `p-e-w/gpt-oss-20b-heretic` |
| VRAM | 20B needs multi-GPU or cloud |

---

## Quick picker

| VRAM | Model | Config profile |
|------|-------|----------------|
| 8 GB | Qwen2.5-1.5B | `config.low-vram.toml` |
| 12 GB | Qwen3-4B | `config.production.toml` or low-vram 4-bit |
| 24 GB | Gemma-3-12B / Llama-8B | `config.production.toml` |
| Cloud | 30B MoE, 20B reasoning | `bnb_4bit` + thinking/factory profile |

Full walkthrough: [../instructions/model-family-guide.md](../instructions/model-family-guide.md)  
Registry: [../docs/tools/heretic-models-registry.md](../docs/tools/heretic-models-registry.md)