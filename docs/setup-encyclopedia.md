# Setup encyclopedia — every practical abliteration environment

One page for **OS × GPU × VRAM × tool**. Pair with [complete-curriculum.md](complete-curriculum.md) and [../instructions/setup-environment.md](../instructions/setup-environment.md).

**Rule:** do weight surgery on **safetensors** (PyTorch). Never edit a GGUF in place. Convert **after** the edit.

---

## Hardware tiers

| VRAM / unified memory | What fits | Config / path |
|-----------------------|-----------|----------------|
| **8 GB** NVIDIA | 1.5B–4B instruct, 4-bit measure | `sources/heretic-tools/config.low-vram.toml` · [../instructions/low-vram-abliteration.md](../instructions/low-vram-abliteration.md) |
| **12 GB** | 7B–8B 4-bit measure; 4B FP16 | low-vram or production + `bnb_4bit` |
| **16–24 GB** | 8B–14B FP16 / 4-bit 20B+ sharded | `config.production.toml` |
| **48–80 GB** | 32B dense / small MoE native | production + higher `n_trials` |
| **Apple 16–36 GB unified** | Infer GGUF/MLX; surgery often off-box | [Apple Silicon](#apple-silicon) |
| **CPU only** | Infer Q4 GGUF; no comfortable Heretic | Track C beginner (download) or rent GPU |

```powershell
python scripts/check_env.py
```

Disk: **30 GB** minimum (4B path **50 GB**). Backup the **original** checkpoint before any write.

---

## Operating systems

### Windows native

| Piece | Command / note |
|-------|----------------|
| Python 3.11–3.12 | Installer: **Add python.exe to PATH** |
| Git | `winget install Git.Git` |
| CUDA PyTorch | `pip install torch --index-url https://download.pytorch.org/whl/cu124` |
| Heretic | `pip install -U heretic-llm accelerate` |
| **bitsandbytes** | Often **broken** on native Windows — prefer WSL2 for `bnb_4bit` |

Full walkthrough: [../instructions/setup-environment.md](../instructions/setup-environment.md) Step 2.

### Windows WSL2 (recommended on 8–12 GB laptops)

```powershell
wsl --install -d Ubuntu-22.04
```

Inside Ubuntu: Python venv + `pip install -U heretic-llm bitsandbytes accelerate`. NVIDIA CUDA in WSL requires a recent Windows NVIDIA driver (no extra Linux driver).

### Linux (best path)

```bash
python3.11 -m venv .venv && source .venv/bin/activate
pip install -U torch heretic-llm bitsandbytes accelerate
python scripts/check_env.py
```

### macOS (Apple Silicon)

| Goal | Tool |
|------|------|
| Infer already-abliterated GGUF | llama.cpp Metal, LM Studio, Ollama |
| Infer MLX | `mlx-lm` · 199-biotechnologies Gemma 4 pipeline |
| Run Heretic-like automation on Mac | [Blasphemer](https://github.com/sunkencity999/blasphemer) (Heretic fork, Apple-oriented) |
| MLX interpretability | [vauban](https://github.com/teilomillet/vauban) |
| Surgery of 8B+ | Rent Linux GPU, then pull safetensors / GGUF home |

Do **not** expect `bitsandbytes` 4-bit Heretic to match Linux CUDA.

---

## Tool install matrix

| Tool | Install | First command |
|------|---------|----------------|
| **Heretic** | `pip install -U heretic-llm` | `heretic Qwen/Qwen3-4B-Instruct-2507` |
| **Heretic + plots** | `pip install -U "heretic-llm[research]"` | `heretic <m> --print-residual-geometry` |
| **llm-abliteration** | `git clone https://github.com/jim-plus/llm-abliteration` | `python measure.py -m <m> -o directions.pt --quant 4bit --projected` |
| **Abliterix** | `pip install -U abliterix` | `abliterix --model Qwen/Qwen3-4B-Instruct-2507` |
| **ErisForge** | `git clone https://github.com/Tsadoq/ErisForge && pip install -e .` | Layer-band API — see cookbook |
| **OBLITERATUS** | clone `elder-plinius/OBLITERATUS` then `pip install -e ".[spaces]"` (PyPI `obliteratus` 0.0.1 is a stub; there is no `[full]` extra) | `obliteratus obliterate <m> --method advanced` |
| **COSMIC** | clone `wang-research-lab/COSMIC` | Direction ID without output templates |
| **FailSpy abliterator** | clone `FailSpy/abliterator` | TransformerLens notebooks |
| **ablate-llm** | `pip install ablate-llm` | KL-guided CLI + Hub push |
| **DECCP topics** | clone `AUGMXNT/deccp` | `measure.py --deccp` |
| **Handbook math (C++26)** | this repo | `npm run cxx:self-check` · [cxx26-platform.md](cxx26-platform.md) |

Pin Heretic configs from this repo instead of guessing: [tools/heretic-tools-reference.md](tools/heretic-tools-reference.md).

---

## Quantization during **measure** vs **store**

| Do | Do not |
|----|--------|
| Load 4-bit **for forward passes** (`bnb_4bit`, `--quant 4bit`) | Ablate and **save** NF4/GPTQ weights as the new base |
| Ablate **full-precision** (or dequantized) `down_proj` / `o_proj` | Orthogonalize already-quantized GGUF tensors |
| Quantize to GGUF **after** surgery | Re-download an aligned GGUF and call it abliterated |

Master chain: [toolchain-safetensors-gguf-lora.md](toolchain-safetensors-gguf-lora.md).

---

## Deploy setups (after weights exist)

| Target | Chain |
|--------|-------|
| Ollama / LM Studio | `convert_hf_to_gguf.py` → `llama-quantize Q4_K_M` → `ollama create` |
| llama.cpp LoRA sidecar | `export-abliteration-lora.py` → `convert_lora_to_gguf.py` → `--lora` |
| vLLM agent | BF16 or AWQ checkpoint + OpenAI API; optional PEFT slot |
| CyberGym / OpenHands | Point agent at that API; eval JSONL in `data/eval/` |

---

## Multi-GPU and huge models

| Situation | Setup |
|-----------|--------|
| 2× consumer GPU | Accelerate `device_map=auto` / Heretic CPU offload of activations |
| 20B–70B one box | `sharded_ablate.py` — one layer matrix in VRAM |
| DGX / GB10 / NVFP4 serving | Community recipes (AEON, DeepSeek-V4-Flash) are **serving**, not a substitute for eval gates |
| MoE experts | Per-expert `down_proj` — [../techniques/moe-hybrid-abliteration.md](../techniques/moe-hybrid-abliteration.md) |

---

## Data and prompts on disk

| Asset | Path |
|-------|------|
| Factory bad/good txt | `data/eval/factory-bad-prompts.txt`, `factory-good-prompts.txt` |
| Deploy JSONL | `data/eval/*.jsonl` — `npm run eval:stats` |
| Heretic pins | `sources/heretic-tools/config.*.toml` |
| Offline papers | `sources/research/papers/` |

Point Heretic `[bad_prompts]` / `[good_prompts]` at custom `.txt` (one prompt per line) for factory false-refusal.

---

## Smoke checklist (every new machine)

```text
[ ] python scripts/check_env.py shows CUDA or a documented no-GPU path
[ ] 30+ GB free; original checkpoint copied
[ ] heretic-llm or llm-abliteration imports
[ ] npm run validate  (handbook integrity)
[ ] npm run cxx:build && npm run cxx:self-check
[ ] Read docs/risks-and-ethics.md
```
