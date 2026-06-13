# Low VRAM & low RAM abliteration

Run abliteration on **8–12 GB GPUs**, **16 GB system RAM laptops**, or **Apple Silicon** without a full FP16 model load.

> **First time?** Complete [setup-environment.md](setup-environment.md) then [beginner-local-model-guide.md](beginner-local-model-guide.md) Track A — this page adds detail.

---

## Beginner steps (8 GB GPU, copy-paste order)

| # | Action | Command / file |
|---|--------|----------------|
| 1 | Activate venv | `.\.venv\Scripts\Activate.ps1` or `source .venv/bin/activate` |
| 2 | Install deps | `pip install -U heretic-llm bitsandbytes accelerate` |
| 3 | Download small model | `huggingface-cli download Qwen/Qwen2.5-1.5B-Instruct --local-dir ./models/qwen-1.5b` |
| 4 | Backup original | Copy folder to `qwen-1.5b-ORIGINAL` |
| 5 | Copy config | `cp sources/heretic-tools/config.low-vram.toml config.toml` (from abliteration repo) |
| 6 | (optional) Edit | Profile already sets `bnb_4bit` — tweak `n_trials` if you have time |
| 7 | Run Heretic | `heretic ./models/qwen-1.5b` (from folder with `config.toml`) |
| 8 | Save output | `./models/qwen-1.5b-abliterated` when prompted |
| 9 | Test chat | Accept Heretic chat prompt — compare WMI-style question |
| 10 | Ollama | [run-locally-ollama-lmstudio.md](run-locally-ollama-lmstudio.md) |

**Success at step 9:** Same prompt that base refused now gets a technical answer (quality may vary).

---

## Pick a path by hardware

| Your hardware | Recommended path |
|---------------|------------------|
| 8 GB VRAM (e.g. RTX 3060 8G, laptop) | Heretic `bnb_4bit` + 4B model → [heretic-workflow.md](heretic-workflow.md) |
| 12 GB VRAM | Heretic 4B–8B with `bnb_4bit` + `offload_outputs_to_cpu` |
| 6–8 GB VRAM | `llm-abliteration` `--quant 4bit` measure + sharded CPU ablate |
| 16 GB RAM, no GPU | CPU measure (slow) + sharded ablate → GGUF Q4 for inference |
| Apple Silicon 16–24 GB unified | MLX or Ollama on **pre-abliterated** GGUF; abliterate on cloud GPU |
| Deploy only (no surgery) | Download community Heretic checkpoint → quantize to Q4_K_M |

---

## VRAM budget table (approximate)

| Model size | FP16 load | 8-bit | 4-bit (bnb) | Abliteration working set |
|------------|-----------|-------|-------------|--------------------------|
| 1.5–3B | 3–6 GB | 2–4 GB | 1.5–3 GB | +2–4 GB activations without offload |
| 4B | ~8 GB | ~5 GB | ~4 GB | Heretic default sweet spot for 16 GB cards |
| 7–8B | ~16 GB | ~10 GB | ~6–8 GB | Needs `bnb_4bit` on 12 GB; tight on 8 GB |
| 12–14B | ~24–28 GB | ~14–16 GB | ~8–10 GB | 4-bit + CPU offload on 12–16 GB VRAM |
| 20B+ | OOM on consumer | varies | 12–20 GB+ | Cloud GPU or sharded pipeline |

Add **~2–8 GB** headroom for Optuna trials, KL eval, and batch autotuning unless you cap trials and enable CPU offload.

---

## Path A — Heretic + bitsandbytes 4-bit (fastest)

Best for **one-command** abliteration when VRAM is the bottleneck.

### 1. Config

Use the handbook low-VRAM pin (recommended):

```bash
cp sources/heretic-tools/config.low-vram.toml config.toml
```

The low-VRAM profile ([sources/heretic-tools/config.low-vram.toml](../sources/heretic-tools/config.low-vram.toml)) bakes in the **projected + norm-preserving** production settings (`orthogonalize_direction = true` + `row_normalization = "full"`) so most 8–12 GB users get lower KL out of the box.

**Why projected + norm-preserving helps on low VRAM:** Raw direction removal often damages harmless capabilities (higher KL, more trials wasted, worse MMLU after). Projected keeps the refusal vector's component parallel to the harmless centroid; norm-preserving `full` + tiny rank-3 LoRA restores activation scales without extra memory. Result: you hit quality targets with the conservative `n_trials=80` and `max_batch_size=16` baked into this profile. Full math, modes table, and Heretic/llm-abliteration flags:

[Projected & norm-preserving abliteration](../techniques/projected-norm-preserving-abliteration.md) (recommended production stack + low-VRAM profile details).

Or copy upstream defaults from the repo pin and edit:

```bash
cp sources/heretic-tools/config.default.toml config.toml
```

```toml
quantization = "bnb_4bit"
device_map = "auto"
offload_outputs_to_cpu = true

# Tight VRAM: cap trials and batch
n_trials = 100
n_startup_trials = 30
max_batch_size = 32

# Optional: pin per-device memory (Accelerate)
# max_memory = { "0" = "7GB", "cpu" = "32GB" }
```

### 2. Run

```bash
pip install -U heretic-llm bitsandbytes accelerate
heretic Qwen/Qwen2.5-1.5B-Instruct
# or with config file in cwd:
heretic ./models/Qwen3-4B-Instruct-2507
```

### 3. Model picks for 8 GB VRAM

| Model | Notes |
|-------|-------|
| `Qwen/Qwen2.5-1.5B-Instruct` | Smoke test / agent tool-repair base |
| `Qwen/Qwen3-4B-Instruct-2507` | Community default; fits 16 GB unquantized, 8 GB with 4-bit |
| `google/gemma-3-270m-it` | Ultra-low VRAM Heretic research demos |

### 4. Heretic LoRA inside norm-preserving export

Heretic can embed a **small LoRA correction** when using full row normalization (not QLoRA training):

```toml
row_normalization = "full"
full_normalization_lora_rank = 3   # raise to 8–16 if export quality drops
```

This is part of **projected + norm-preserving abliteration** (orthogonalize the refusal direction against the harmless centroid, then restore row norms via small LoRA). The low-vram config enables these flags by default.

See:

- [Projected & norm-preserving abliteration](../techniques/projected-norm-preserving-abliteration.md) — math, modes (`none`/`pre`/`full`), recommended toml, when to raise `full_normalization_lora_rank`
- [LoRA / QLoRA abliteration](../techniques/lora-qlora-abliteration.md) — adapter theory and export after norm-preserving runs
- Direct low-VRAM profile: [sources/heretic-tools/config.low-vram.toml](../sources/heretic-tools/config.low-vram.toml) (sets `orthogonalize_direction`, `row_normalization = "full"`, 4-bit + offload)

---

## Path B — llm-abliteration 4-bit measure + sharded ablate

Best when Heretic OOMs but you have **CPU RAM** for layer-wise surgery.

```bash
git clone https://github.com/jim-plus/llm-abliteration.git tools/llm-abliteration
cd tools/llm-abliteration && pip install -r requirements.txt bitsandbytes
```

### 1. Measure in 4-bit

```bash
python measure.py -m <model_path> -o directions.pt --quant 4bit \
  --data-harmful ./data/harmful.txt \
  --data-harmless ./data/harmless.txt
```

### 2. Analyze (CPU OK)

```bash
python analyze.py directions.pt -c
```

Pick middle-to-late layers in the YAML config (see repo examples).

### 3. Sharded ablate (low peak RAM)

```bash
python sharded_ablate.py abliteration_config.yaml --normpreserve --projected
```

`sharded_ablate.py` processes weight shards so the **full model never sits in VRAM at once**. Peak demand is one layer matrix + direction vectors.

Full workflow: [llm-abliteration-workflow.md](llm-abliteration-workflow.md).

---

## Path C — Inference hooks only (zero weight edit)

**Lowest VRAM** for experimentation — no permanent checkpoint.

```python
from transformer_lens import HookedTransformer
model = HookedTransformer.from_pretrained(
    "Qwen/Qwen2.5-1.5B-Instruct",
    fold_ln=True,
    device="cuda",
)
# hook blocks.L.hook_resid_post — see methods/residual-hook-ablation.md
```

Use 1–3B models; store direction `.pt` on disk (~MB). Good for validating refusal removal before committing GPU hours to Heretic.

→ [quickstart.md](quickstart.md)

---

## Path D — Abliterate on cloud, infer locally quantized

When local VRAM cannot run surgery:

1. Run Heretic on a **rented 24 GB GPU** (RunPod, Vast, Lambda).
2. Download safetensors output.
3. Convert + quantize locally (CPU RAM only):

```bash
git clone https://github.com/ggml-org/llama.cpp.git tools/llama.cpp
python tools/llama.cpp/convert_hf_to_gguf.py ./out/heretic-model --outfile ./out/model-f16.gguf
./tools/llama.cpp/llama-quantize ./out/model-f16.gguf ./out/model-q4_k_m.gguf Q4_K_M
```

4. Serve with Ollama / llama.cpp on a **8 GB RAM** machine.

→ [../methods/gguf-export-notes.md](../methods/gguf-export-notes.md)

---

## Path E — LoRA / QLoRA adapter instead of full checkpoint

Ship a **few-megabyte adapter** instead of re-uploading 8B weights:

1. Full abliteration (Heretic or manual) **or** compute ΔW per layer.
2. Low-rank factorize ΔW → PEFT LoRA adapter.
3. Inference: base model 4-bit + adapter (Unsloth / PEFT / vLLM LoRA).

Detailed recipe: [../methods/lora-adapter-export.md](../methods/lora-adapter-export.md) · theory: [../techniques/lora-qlora-abliteration.md](../techniques/lora-qlora-abliteration.md).

**Jarvis tool-repair** uses QLoRA *after* abliteration for command compliance — different goal, same hardware profile:

→ [agentic-security-stack.md](agentic-security-stack.md)

---

## System RAM (not VRAM) tips

| Setting / tool | Effect |
|----------------|--------|
| `offload_outputs_to_cpu = true` (Heretic) | Lowers peak during residual/KL passes |
| `max_memory = { "0" = "7GB", "cpu" = "48GB" }` | Spill layers to CPU |
| `sharded_ablate.py` | Layer-wise weight edit on CPU |
| Smaller `n_trials` | Less repeated forward memory |
| `max_shard_size = "2GB"` | Smaller safetensors shards for disk/RAM |
| Close browser / other GPU apps | Practical 1–2 GB savings |

**Swap thrashing:** if system RAM < 32 GB and model > 8B, prefer **sharded ablate** or cloud GPU — do not rely on swap for measure passes.

---

## Apple Silicon (M1/M2/M3, 16–24 GB unified)

| Task | Local? | Notes |
|------|--------|-------|
| Heretic surgery on 8B+ | Usually no | Use cloud GPU or 4B + 4-bit experiments |
| GGUF Q4 inference | Yes | Ollama / mlx-lm on abliterated GGUF |
| MLX fine-tune adapter | Yes | 4-bit LoRA for Jarvis repair on 3–8B |
| Direction measurement | Maybe | 1.5–3B with mlx; slower than CUDA |

```bash
# Inference-only on Mac after you have a GGUF
ollama create security-agent -f Modelfile   # FROM ./model-q4_k_m.gguf
```

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| CUDA OOM at load | `quantization = "bnb_4bit"`; smaller model; `max_memory` |
| OOM during Optuna | Lower `n_trials`, `max_batch_size`; `offload_outputs_to_cpu` |
| OOM at save/export | Lower `max_shard_size`; save to fast disk |
| 4-bit load works, eval OOM | `batch_size = 1` in config; CPU offload |
| Degenerate output after 4-bit abliteration | Try `row_normalization = "full"`; compare KL eval vs FP16 run on subset |
| CPU ablate very slow | Normal for 8B; run overnight or use cloud for measure only |
| bitsandbytes install fail on Windows | Use WSL2 Ubuntu + CUDA, or cloud Linux GPU |

---

## Eval after low-VRAM run

Same corpora as full-GPU runs — refusal removal should not depend on quant mode if KL is acceptable:

- [../data/eval/cyber-research-prompts.jsonl](../data/eval/cyber-research-prompts.jsonl)
- [../data/eval/hardware-factory-prompts.jsonl](../data/eval/hardware-factory-prompts.jsonl)
- [../docs/evaluation.md](../docs/evaluation.md)

---

## Related

| Doc | Topic |
|-----|-------|
| [heretic-workflow.md](heretic-workflow.md) | Default Heretic install & run |
| [llm-abliteration-workflow.md](llm-abliteration-workflow.md) | Manual 4-bit measure + sharded ablate |
| [../techniques/projected-norm-preserving-abliteration.md](../techniques/projected-norm-preserving-abliteration.md) | Projected + norm-preserving (math + low-VRAM profile; `orthogonalize_direction` + `row_normalization=full` baked into config.low-vram.toml) |
| [../techniques/lora-qlora-abliteration.md](../techniques/lora-qlora-abliteration.md) | LoRA / QLoRA theory |
| [../methods/lora-adapter-export.md](../methods/lora-adapter-export.md) | Export adapter from ΔW |
| [../docs/tools/abliteration-tooling.md](../docs/tools/abliteration-tooling.md) | bitsandbytes, PEFT, Unsloth, llama.cpp, … |