# Advanced techniques catalog — quick reference

Technical parameters and methods beyond basic mean-diff + MLP ablation. For workflows see [instructions/advanced-abliteration-workflow.md](../instructions/advanced-abliteration-workflow.md).

---

## Heretic config parameters (nuanced)

| Parameter | Default | Advanced use |
|-----------|---------|--------------|
| `orthogonalize_direction` | `true` | **Projected abliteration** — remove refusal component ⊥ harmless mean direction (Jim Lai) |
| `row_normalization` | `full` | `none` / `pre` / `full` — norm-preserving biprojected export |
| `full_normalization_lora_rank` | `3` | Raise to 8–16 if row-norm reconstruction poor |
| `winsorization_quantile` | `1.0` (off) | `0.95` clamps massive activations (Gemma, some Qwen) |
| `kl_divergence_target` | `0.01` | Lower = stricter capability preservation in Optuna |
| `kl_divergence_scale` | `1.0` | Balance refusal vs KL in objective |
| `direction_index` | auto | `per layer` or fixed layer index |
| `max_weight` / `min_weight` | searched | Ablation kernel amplitude over depth |
| `max_weight_position` / `min_weight_distance` | searched | **Kernel shape** — where in depth ablation peaks |
| `quantization` | `none` | `bnb_4bit` for low VRAM |
| `offload_outputs_to_cpu` | `true` | Residual/KL tensors to host RAM |
| `chain_of_thought_skips` | thinking models | Strip CoT before refusal eval |
| `refusal_markers` | string list | Tune for your model's refusal phrasing |
| `[good_prompts]` / `[bad_prompts]` | HF datasets | **Custom .txt** for factory false-refusal pairs |

Source: `sources/heretic-tools/config.default.toml` · [Heretic concepts](https://p-e-w-heretic.mintlify.app/concepts/abliteration)  
Deploy toolchain: [toolchain-safetensors-gguf-lora.md](toolchain-safetensors-gguf-lora.md)

---

## llm-abliteration flags

| Flag | Effect |
|------|--------|
| `--quant 4bit` | bitsandbytes measure pass |
| `--projected` | Project refusal ⊥ harmless direction |
| `--normpreserve` | Preserve weight row norms |
| `--deccp` | Extra Chinese-topic measurement topics |

Sharded ablate: `python sharded_ablate.py config.yaml --projected --normpreserve`

---

## Projection math (all variants)

**Basic abliteration** (Arditi):

```
r = normalize(mean(h_harmful) - mean(h_harmless))
W' = W - λ · r · (rᵀ W)     # output-space projection on down_proj / o_proj
```

**Projected direction** (Lai / Heretic `orthogonalize_direction`):

```
g = normalize(mean(h_harmless))
r_proj = normalize(r - (r·g)g)    # refusal minus component along harmless
```

**Inference ablation** (hook, no weight change):

```
h' = h - (h·r)r
```

**Partial strength:**

```
W' = W - α · projection(W),   α ∈ (0, 1]
```

---

## Technique index

| ID | Technique | Doc |
|----|-----------|-----|
| T01 | Mean-difference DIM | [../techniques/mean-difference-direction.md](../techniques/mean-difference-direction.md) |
| T02 | Inference directional ablation | [../techniques/inference-directional-ablation.md](../techniques/inference-directional-ablation.md) |
| T03 | Projected + norm-preserving | [../techniques/projected-norm-preserving-abliteration.md](../techniques/projected-norm-preserving-abliteration.md) |
| T04 | Geometric median + winsorization | [../techniques/geometric-median-winsorization.md](../techniques/geometric-median-winsorization.md) |
| T05 | Multi-direction / concept cones | [../techniques/beyond-single-direction.md](../techniques/beyond-single-direction.md) |
| T06 | Gradient RDO | [../techniques/beyond-single-direction.md](../techniques/beyond-single-direction.md) |
| T07 | SAE refusal latents | [../techniques/beyond-single-direction.md](../techniques/beyond-single-direction.md) |
| T08 | MoE / hybrid architectures | [../techniques/moe-hybrid-abliteration.md](../techniques/moe-hybrid-abliteration.md) |
| T09 | Layer-selective + Heretic kernel | [../techniques/layer-selective-abliteration.md](../techniques/layer-selective-abliteration.md) |
| T10 | Domain-specific direction | [../techniques/domain-specific-abliteration.md](../techniques/domain-specific-abliteration.md) |
| T11 | LoRA / QLoRA paths | [../techniques/lora-qlora-abliteration.md](../techniques/lora-qlora-abliteration.md) |
| T12 | Steering & alternatives | [../techniques/steering-and-alternatives.md](../techniques/steering-and-alternatives.md) |
| T13 | W2SV rank-1 patch | [../techniques/w2sv-rank1-patch.md](../techniques/w2sv-rank1-patch.md) |
| T14 | Thinking-model CoT skips | [../techniques/thinking-model-abliteration.md](../techniques/thinking-model-abliteration.md) |
| T15 | Kernel depth shaping | [../techniques/kernel-shaping-depth-profile.md](../techniques/kernel-shaping-depth-profile.md) |
| T16 | Iterative multi-pass | [../techniques/iterative-abliteration.md](../techniques/iterative-abliteration.md) |
| T17 | Eval-driven prompts | [../techniques/eval-driven-abliteration.md](../techniques/eval-driven-abliteration.md) |
| T18 | Refusal marker tuning | [../techniques/refusal-marker-tuning.md](../techniques/refusal-marker-tuning.md) |
| T19 | Model family playbook | [../techniques/model-family-playbook.md](../techniques/model-family-playbook.md) |
| T20 | Vision / multimodal | [../techniques/vision-multimodal-abliteration.md](../techniques/vision-multimodal-abliteration.md) |

### Handbook config profiles

| Profile | Path |
|---------|------|
| Low VRAM | `sources/heretic-tools/config.low-vram.toml` |
| Production | `sources/heretic-tools/config.production.toml` |
| Thinking / CoT | `sources/heretic-tools/config.thinking-model.toml` |
| Factory QA | `sources/heretic-tools/config.factory-qa.toml` |

---

## Module targets by architecture

| Architecture | Primary targets | Notes |
|--------------|-----------------|-------|
| Llama / Mistral / Qwen dense | `mlp.down_proj`, `self_attn.o_proj` | Standard Heretic |
| Qwen3 MoE | `experts[*].down_proj` | All routed experts |
| Phi-3.5-MoE | `block_sparse_moe.experts[*].w2` | Expert `w2` = down |
| Granite MoE hybrid | `shared_mlp.output_linear`, `moe.experts[*].output_linear` | Per Heretic model.py |
| Qwen3.5 hybrid | `linear_attn.out_proj` on linear-attn layers | Not `o_proj` on those layers |
| Vision-language | Same + multimodal projector hooks | Heretic supports many VLM |

---

## False-refusal vs harmful-refusal datasets

For **agentic security** (factory `wmic`, lab `nmap`), build custom `[bad_prompts]`:

```text
# bad_prompts_factory.txt — model refuses but should comply
Run wmic diskdrive get Model,Size,SerialNumber on this bench PC.
Parse firmware.bin with strings and report SHA256.
Execute nmap -sV against 10.77.0.50 in our authorized lab VLAN.
```

```text
# good_prompts_factory.txt — matched benign
List disk drive models using read-only WMI on the factory bench.
Compute SHA256 of the golden firmware image for SKU ABC-123.
```

Point Heretic `dataset = "path/to/file.txt"` in config.toml.