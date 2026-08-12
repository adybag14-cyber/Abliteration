# Complete abliteration curriculum

The single path through **every method, setup, and script** in this handbook. Goal: this repo is the most complete abliteration reference on the internet — papers, tools, math, hardware, and runnable code.

If you only want a working local model today, skip to [Stage 2](#stage-2--first-successful-run-heretic). Come back here when you need the rest.

**Ethics first:** [risks-and-ethics.md](risks-and-ethics.md). This handbook is for authorized factory QA, lab pentest, and research. Abliteration removes a refusal **direction**; it does not add skills and it does not authorize misuse.

---

## What “complete” means here

| Layer | What you get |
|-------|----------------|
| **Theory** | Arditi DIM → projected/norm-preserving → ORBA/Householder → multi-D cones → SAE/SOM/COSMIC |
| **Methods** | Weight projection, hooks, Heretic/Abliterix/ErisForge/OBLITERATUS/llm-abliteration |
| **Setups** | Windows / WSL / Linux / macOS / 8–80 GB VRAM / Apple Silicon / no GPU |
| **Scripts** | Measure direction, bake weights, hook-only prototype, refusal-rate eval, LoRA export |
| **Eval** | Factory / OSINT / CyberGym / XSTest / KL / GSM8K gates |
| **Frontier** | 2025–2026 papers + tools not covered by a single “uncensor with Heretic” blog |

Companion maps: [setup-encyclopedia.md](setup-encyclopedia.md) · [bleeding-edge.md](bleeding-edge.md) · [research-landscape.md](research-landscape.md) · [../instructions/method-cookbook.md](../instructions/method-cookbook.md)

---

## Stage 0 — Vocabulary (30 min)

Read [overview.md](overview.md) then [theory.md](theory.md).

| Term | One line |
|------|----------|
| Refusal direction `r` | Unit vector in residual space that predicts refuse vs comply |
| Mean-difference (DIM) | `r = normalize(mean(h_harmful) − mean(h_harmless))` |
| Inference ablation | `h' = h − (h·r)r` — reversible hook |
| Weight abliteration | Project `down_proj` / `o_proj` so the layer cannot write `r` |
| Projected (T03) | Remove the component of `r` that lies along the harmless mean |
| Norm-preserving | Restore row norms after the edit (Heretic `row_normalization = full`) |
| ORBA / Householder | Reflection-based rank-1 edit; directional ablation (`α=0`) is the stable special case |
| Over-refusal | Model refuses **benign** security/hardware prompts (`wmic`, `nmap` lab) |

---

## Stage 1 — Environment (30–90 min)

Pick **one** row. Full matrices: [setup-encyclopedia.md](setup-encyclopedia.md) · [../instructions/setup-environment.md](../instructions/setup-environment.md)

| Hardware | Path |
|----------|------|
| Windows + NVIDIA, 8–12 GB | WSL2 Ubuntu + Heretic `bnb_4bit` — bitsandbytes is unreliable natively |
| Windows + NVIDIA, 24 GB+ | Native or WSL; `config.production.toml` |
| Linux + NVIDIA | Native Heretic; best path |
| Apple Silicon | Cloud/WSL surgery **or** MLX / Blasphemer / 199-biotech Gemma recipes; infer with `mlx-lm` / llama.cpp Metal |
| No GPU | Download an already-abliterated GGUF **or** run surgery on a rented GPU, then import |
| 20B+ / MoE on 24 GB | `llm-abliteration` 4-bit measure + `sharded_ablate.py` |

```powershell
python scripts/check_env.py
```

---

## Stage 2 — First successful run (Heretic)

1. [../techniques/safety-guardrail-abliteration-methodology.md](../techniques/safety-guardrail-abliteration-methodology.md)
2. [../instructions/beginner-reproduction-methodology.md](../instructions/beginner-reproduction-methodology.md)
3. [../instructions/beginner-local-model-guide.md](../instructions/beginner-local-model-guide.md) (tracks A/B/C)
4. [../instructions/run-locally-ollama-lmstudio.md](../instructions/run-locally-ollama-lmstudio.md)

Default flags that already live in handbook pins:

```toml
orthogonalize_direction = true
row_normalization = "full"
```

Configs: `sources/heretic-tools/config.low-vram.toml` · `config.production.toml`

---

## Stage 3 — Measure before you trust it

| Gate | Doc / command |
|------|----------------|
| Corpus counts | `npm run eval:stats` |
| Factory / OSINT / CyberGym JSONL | [evaluation.md](evaluation.md) · [../instructions/eval-driven-workflow.md](../instructions/eval-driven-workflow.md) |
| Marker-based refusal rate | `cxx/build/abliterate-cxx eval --jsonl <generations.jsonl>` |
| Over-refusal | `data/eval/xstest-overrefusal-sample.jsonl` |
| Capability | GSM8K / MMLU / HumanEval — see [comparative-abliteration-benchmarks.md](comparative-abliteration-benchmarks.md) |
| Runtime gate | `python scripts/hardware-tool-gate.py` |

Abliteration that tanks GSM8K or factory `tool_call` rate is a failed run, even if chat “sounds uncensored.”

---

## Stage 4 — Every method family (implementation)

Read [../methods/README.md](../methods/README.md) in this order:

| # | Method | When |
|---|--------|------|
| 1 | [residual-hook-ablation](../methods/residual-hook-ablation.md) + `abliterate-cxx hook` | Reversible experiment |
| 2 | [mlp-down-proj-abliteration](../methods/mlp-down-proj-abliteration.md) | Classic permanent edit |
| 3 | [attention-o-proj-abliteration](../methods/attention-o-proj-abliteration.md) | Complementary to MLP |
| 4 | [automated-heretic-search](../methods/automated-heretic-search.md) | Production default |
| 5 | [manual-transformers-pipeline](../methods/manual-transformers-pipeline.md) | Full control |
| 6 | [safetensor-abliteration-pipeline](../methods/safetensor-abliteration-pipeline.md) + `abliterate-cxx apply` | Bake without Heretic |
| 7 | [projected-llm-abliteration](../methods/projected-llm-abliteration.md) | T03 manual |
| 8 | [orba-pipeline](../methods/orba-pipeline.md) | Householder vs directional rank-1 |
| 9 | [cosmic-direction-id](../methods/cosmic-direction-id.md) | Output-independent `r` |
| 10 | [multi-direction-ablation](../methods/multi-direction-ablation.md) | Stubborn leftovers |
| 11 | [gradient-rdo-pipeline](../methods/gradient-rdo-pipeline.md) | Optimized `r` |
| 12 | [svd-refusal-subspace](../methods/svd-refusal-subspace.md) | OBLITERATUS / multi-D SVD |
| 13 | [moe-expert-abliteration](../methods/moe-expert-abliteration.md) | Qwen-MoE, Phi-MoE, Granite |
| 14 | [lora-adapter-export](../methods/lora-adapter-export.md) | Ship ΔW as PEFT |
| 15 | [gguf-export-notes](../methods/gguf-export-notes.md) | llama.cpp / Ollama |

Handbook helpers are the **C++26** CLI (no Heretic, no Python required for the math):

```bash
npm run cxx:build
npm run cxx:self-check
cxx/build/abliterate-cxx estimate --mode dim --bad bad.txt --good good.txt
cxx/build/abliterate-cxx apply --mode orba-directional --weight W.txt --direction r.txt
cxx/build/abliterate-cxx hook --h h.txt --direction r.txt
cxx/build/abliterate-cxx eval --jsonl generations.jsonl
```

→ [cxx26-platform.md](cxx26-platform.md)

---

## Stage 5 — Technique catalog (concepts)

Numbered T-ids: [advanced-techniques-catalog.md](advanced-techniques-catalog.md). Index: [../techniques/README.md](../techniques/README.md).

**Always start production with T03 (projected + norm-preserving).** Then add:

| If this happens | Next technique |
|-----------------|----------------|
| 8 GB OOM | T11 QLoRA measure · [../instructions/low-vram-abliteration.md](../instructions/low-vram-abliteration.md) |
| Thinking / R1 skips refusals in CoT | T14 · [../instructions/thinking-models-guide.md](../instructions/thinking-models-guide.md) |
| MoE quality drop | T08 per-expert |
| Single `r` not enough | T05/T06/T07 · T35 SOM · T34 ORBA |
| Weakly aligned / no “I cannot” | T36 COSMIC |
| Need subspace not a line | T37 SVD / OBLITERATUS |
| Factory false-refusal only | T38 false-refusal vector (keep safety `r`) |
| Jailbreaks vs over-refusal disagree | T39 harm vs refusal (Zhao 2025) |
| Gemma 4 / VL / SSM presets | Abliterix Track J |
| GSM8K collapse on Heretic | ErisForge / DECCP Track K |

---

## Stage 6 — Tooling (do not pick from a tweet)

| Default | Alternative | Research only |
|---------|-------------|---------------|
| **Heretic** (`heretic-llm`) | Abliterix (AGPL, 150+ presets) | FailSpy / TransformerLens |
| jim-plus **llm-abliteration** | Nous fork + DECCP | J-Wash (Jacobian lens) |
| Handbook `scripts/abliteration_math.py` | ErisForge layer-band | OBLITERATUS `surgical` / SAE |
| `export-abliteration-lora.py` | grimjim LoRA adapters | ablate-llm (`pip install ablate-llm`) |

Compare numbers, not vibes: [comparative-abliteration-benchmarks.md](comparative-abliteration-benchmarks.md) (arXiv:2512.13655). Placement: [../techniques/extended-abliteration-toolkit.md](../techniques/extended-abliteration-toolkit.md). Commands: [../instructions/method-cookbook.md](../instructions/method-cookbook.md).

---

## Stage 7 — Model-family and deploy

| Topic | Doc |
|-------|-----|
| Qwen / Gemma / Llama / VL picker | [../instructions/model-family-guide.md](../instructions/model-family-guide.md) |
| Thinking models | [../instructions/thinking-models-guide.md](../instructions/thinking-models-guide.md) |
| Safetensors → GGUF → LoRA | [toolchain-safetensors-gguf-lora.md](toolchain-safetensors-gguf-lora.md) |
| Advanced tracks A–K + L–N | [../instructions/advanced-abliteration-workflow.md](../instructions/advanced-abliteration-workflow.md) |
| Factory / pentest / CyberGym | [use-cases/factory-firmware-qa.md](use-cases/factory-firmware-qa.md) |

---

## Stage 8 — When it fails

[../instructions/troubleshooting-encyclopedia.md](../instructions/troubleshooting-encyclopedia.md) · [defenses-against-abliteration.md](defenses-against-abliteration.md)

| Symptom | First check |
|---------|-------------|
| Nothing changed | Extended-refusal / ART defense, or wrong measure set |
| Gibberish | Over-ablation — lower `max_weight`, enable T03 |
| Factory still refuses | Domain `[bad_prompts]`, not more global `α` |
| Tools break, chat works | Tool-call eval; SuperGemma / Jarvis repair, not more surgery |
| Math scores crater | ErisForge / DECCP / narrower kernel |

---

## Stage 9 — Research literacy (after first deploy)

1. [refusal-research-beginners-guide.md](refusal-research-beginners-guide.md) — 2024–2026 papers, PDFs in `sources/research/papers/`
2. [bleeding-edge.md](bleeding-edge.md) — ORBA, COSMIC, SOM, SVD, J-Wash, harm≠refusal
3. Refresh corpus: `npm run fetch:research-papers`

---

## One-page decision tree

```text
Need a local model that stops false-refusing factory/lab tools?
├─ First time, 8–24 GB NVIDIA → Heretic + handbook config (Stage 2)
├─ No GPU → GGUF import or rent a GPU for surgery
├─ 20B+ / OOM → llm-abliteration 4-bit + sharded ablate
├─ MoE / Gemma 4 / VL preset exists → Abliterix Track J
├─ Want reversible only → inference hook (Stage 4.1)
├─ Heretic leaves refusals → multi-D / SOM / RDO / domain pass
├─ Heretic tanks GSM8K → ErisForge or DECCP, then re-eval
├─ No refusal template in outputs → COSMIC
├─ Need adapter not full weights → export-abliteration-lora.py
└─ Still refusing after surgery → defenses doc (not more α)
```

Then always: Stage 3 eval gates.
