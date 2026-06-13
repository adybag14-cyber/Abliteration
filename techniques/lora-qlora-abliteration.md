# LoRA & QLoRA abliteration techniques

Low-rank and quantized-low-rank methods for **refusal removal on small GPUs** and **adapter-only deployment**. Distinct from generic QLoRA fine-tuning on uncensored chat data — these techniques target the **refusal direction** structurally.

---

## Technique map

| # | Technique | Alters base weights? | VRAM | Output size |
|---|-----------|---------------------|------|-------------|
| 1 | Heretic `bnb_4bit` | Yes (merged) | Low | Full checkpoint |
| 2 | Heretic `row_normalization = full` + LoRA rank | Yes (+ tiny LoRA tensors) | Low–med | Full + optional LoRA sidecar |
| 3 | llm-abliteration `--quant 4bit` measure | Yes (sharded) | Low | Full checkpoint |
| 4 | ΔW low-rank export (PEFT) | No (adapter) | Low infer | **MB-scale adapter** |
| 5 | QLoRA refusal-steer training | No (adapter) | Low | Adapter (different mechanism) |
| 6 | Inference hook only | No | Lowest | `direction.pt` only |

---

## 1. QLoRA-style loading for abliteration (measure & optimize)

**Not training** — load the base model in 4-bit so forward passes for direction estimation and Optuna fit in VRAM.

### Heretic

```toml
quantization = "bnb_4bit"
offload_outputs_to_cpu = true
```

### llm-abliteration

```bash
python measure.py -m <model> -o directions.pt --quant 4bit
```

**Mechanism:** bitsandbytes NF4 (or similar) stores weights compressed; activations still need headroom. Pair with CPU offload for residuals.

**Trade-off:** Optimizer explores ablation parameters on a quantized weight view; final export is still a full-precision (or configured dtype) checkpoint. Always run KL/refusal eval — if drift is high, re-run measure in FP16 on a layer subset.

→ [../instructions/low-vram-abliteration.md](../instructions/low-vram-abliteration.md)

---

## 2. Heretic norm-preserving LoRA (built-in)

From Heretic `config.default.toml`:

```toml
row_normalization = "full"   # "none" | "pre" | "full"
full_normalization_lora_rank = 3
```

When orthogonalizing `o_proj` / `down_proj`, row magnitudes change non-linearly. Heretic approximates **magnitude restoration** with a **rank-r LoRA correction** bundled in the export.

| `row_normalization` | Behavior |
|---------------------|----------|
| `none` | Raw orthogonalization |
| `pre` | LoRA computed vs row-normalized weights |
| `full` | Like `pre`, then renormalize rows (best KL in practice) |

**Tuning `full_normalization_lora_rank`:**

| Rank | Use |
|------|-----|
| 3 | Default; smallest files |
| 8–16 | If capability metrics drop after abliteration |
| 32+ | Rare; diminishing returns, larger shards |

This is **structural LoRA from abliteration math**, not SGD fine-tuning.

---

## 3. LoRA adapter as the deliverable (ΔW factorization)

**Goal:** Keep the original base model unchanged; ship `adapter_model.safetensors` (~10–200 MB).

### Pipeline

```
1. Abliterate (Heretic or manual) → W'
2. ΔW = W' - W  per target module (o_proj, down_proj)
3. SVD or randomized SVD: ΔW ≈ B @ A  (rank r)
4. Register as PEFT LoRA; inference = W + BA
```

### When to use

- Multiple policy profiles on one base (factory vs lab adapter)
- OTA adapter updates without re-downloading 8B weights
- 8 GB VRAM inference: **4-bit base + rank-16–64 adapter**

### Rank selection

| Rank | Typical use |
|------|-------------|
| 4–8 | Mild refusal trim, minimal size |
| 16–32 | Standard abliteration strength |
| 64–128 | Aggressive decensor; watch MMLU/coding eval |

Implementation: [../methods/lora-adapter-export.md](../methods/lora-adapter-export.md)

---

## 4. QLoRA fine-tune *after* abliteration (Jarvis / tool repair)

**Different mechanism:** SGD on tool-call JSONL teaches **compliance behavior**; abliteration already removed the refusal direction.

```bash
# agentic-security-stack defaults
# QLoRA 4-bit base, rank 32, 1 epoch SFT, 0.5–1 epoch DPO
```

| Aspect | Abliteration | QLoRA Jarvis |
|--------|--------------|--------------|
| Data | Harmful/harmless pairs | Tool-call SFT/DPO rows |
| Objective | Remove direction from weights | Maximize correct `tool_call` |
| VRAM | One-shot analysis | Training loop |
| Needed? | Yes (base uncensor) | Optional (fixes residual false refusals) |

Stack both for factory/CyberGym agents on **12–24 GB** cards.

→ [../instructions/agentic-security-stack.md](../instructions/agentic-security-stack.md)

---

## 5. QLoRA “uncensor fine-tune” (alternative, not abliteration)

Training LoRA on **uncensored instruction datasets** can reduce refusals without weight projection. 

| Pros | Cons |
|------|------|
| Works on models where abliteration fails | Needs curated dataset; risk of capability collapse |
| Standard Unsloth/Axolotl tooling | Not reversible like keeping base + adapter |
| Low VRAM | May not fix **tool-call** false refusals |

Use when refusal is **distributed** (multi-direction). Prefer abliteration + Jarvis for agentic security.

**Tools:** [Unsloth](https://github.com/unslothai/unsloth), [Axolotl](https://github.com/axolotl-ai-cloud/axolotl), HF TRL + PEFT.

---

## 6. Merged LoRA vs sidecar at inference

| Deployment | Command / stack |
|------------|-----------------|
| Ollama single GGUF | Merge adapter → `convert_hf_to_gguf.py` (Ollama has no GGUF LoRA sidecar) |
| vLLM | `--enable-lora` with base + adapter paths |
| llama.cpp | `convert_lora_to_gguf.py` + `--lora` / `--lora-scaled` on `llama-cli` or `llama-server` |
| PEFT dynamic | `PeftModel.from_pretrained(base, adapter)` |
| GGUF-my-LoRA | [spaces/ggml-org/gguf-my-lora](https://huggingface.co/spaces/ggml-org/gguf-my-lora) — browser convert |

**Export script (this repo):**

```bash
python scripts/export-abliteration-lora.py \
  --base ./models/ORIGINAL \
  --abliterated ./models/abliterated \
  --out ./adapters/abliteration-r16 \
  --rank 16
```

**GGUF LoRA inference (keep aligned base on disk):**

```bash
python llama.cpp/convert_lora_to_gguf.py \
  --outfile abliteration-lora-f16.gguf \
  --base-model-id Qwen/Qwen3-4B-Instruct-2507 \
  --lora-path ./adapters/abliteration-r16

./llama-cli -m base-q4_k_m.gguf --lora-scaled abliteration-lora-f16.gguf 0.9
```

Community abliteration LoRAs: [grimjim/Llama-3-Instruct-abliteration-LoRA-8B](https://huggingface.co/grimjim/Llama-3-Instruct-abliteration-LoRA-8B) · [ggml-org GGUF LoRA collection](https://huggingface.co/collections/ggml-org/gguf-lora-adapters)

**Low RAM inference:** Q4_K_M GGUF of **merged** abliterated weights often beats 4-bit HF + adapter on CPU-only hosts.

→ [../docs/toolchain-safetensors-gguf-lora.md](../docs/toolchain-safetensors-gguf-lora.md) · [../methods/gguf-export-notes.md](../methods/gguf-export-notes.md)

---

## Comparison with full abliteration

| Criterion | Full weight abliteration | LoRA adapter only |
|-----------|-------------------------|-------------------|
| Refusal removal strength | Strong | Tunable via rank & α |
| KL / capability preservation | Heretic optimizes directly | Depends on rank |
| Disk | Full model (~8–16 GB) | Base + MB adapter |
| Revert | Keep original safetensors | Disable adapter |
| Low VRAM surgery | Needs 4-bit + offload | Factorize after cloud abliteration |

---

## Recommended stacks by VRAM

| VRAM | Stack |
|------|-------|
| 6–8 GB | `Qwen2.5-1.5B` + Heretic `bnb_4bit` → GGUF Q4 |
| 8–12 GB | `Qwen3-4B` + Heretic `bnb_4bit` + `row_normalization = full` |
| 12–16 GB | Heretic 4B–8B 4-bit OR llm-abliteration sharded + LoRA export |
| 24 GB+ | Heretic FP16/BF16; optional Jarvis QLoRA rank 32 |
| Inference only | Community Heretic GGUF + Ollama |

---

## References

- Heretic `config.default.toml` — `quantization`, `row_normalization`, `full_normalization_lora_rank`
- [grimjim/projected-abliteration](https://huggingface.co/blog/grimjim/projected-abliteration) — projected / norm-preserving theory
- [../methods/lora-adapter-export.md](../methods/lora-adapter-export.md) — export script pattern
- [../docs/tools/abliteration-tooling.md](../docs/tools/abliteration-tooling.md) — PEFT, bitsandbytes, Unsloth