# Advanced abliteration workflow

Research-grade and production-hardening paths beyond default `heretic <model>`.

> **Not ready yet?** Complete these first in order:  
> 1. [setup-environment.md](setup-environment.md)  
> 2. [beginner-local-model-guide.md](beginner-local-model-guide.md)  
> 3. [run-locally-ollama-lmstudio.md](run-locally-ollama-lmstudio.md)  
> Return here when your abliterated model runs in Ollama and you want **better quality** or **agent deployment**.

The beginner guide's Step 7 appendix now also points here for advanced tuning + the three primary use-case docs ([factory-firmware-qa](../docs/use-cases/factory-firmware-qa.md), [pentest-cyber-analysis](../docs/use-cases/pentest-cyber-analysis.md), [cybergym-benchmark](../docs/use-cases/cybergym-benchmark.md)) and the Ralph handbook dev commands (`npm run ralph:next` / `npm run ralph` / turn-end).

**Read first:** [../docs/research-landscape.md](../docs/research-landscape.md) · [../docs/advanced-techniques-catalog.md](../docs/advanced-techniques-catalog.md) · [../docs/refusal-research-beginners-guide.md](../docs/refusal-research-beginners-guide.md)

**Track index:** A production · B diagnostics · C manual llm-abliteration · D multi-direction · E MoE · F adapter · G hooks prototype · H thinking · I factory eval · J Abliterix · K ErisForge

> **Note:** Track C here = manual **llm-abliteration** / DECCP (advanced). Beginner [Track C (no GPU)](beginner-local-model-guide.md#track-c--no-gpu-download--quantize-only) is download/quantize only — different path.

---

## Track A — Production agent (recommended)

**Goal:** CyberGym / factory agent with minimal KL damage.

| Step | Action |
|------|--------|
| 1 | Backup base safetensors |
| 2 | Copy `sources/heretic-tools/config.production.toml` → `config.toml` |
| 3 | Confirm `orthogonalize_direction = true`, `row_normalization = full` (already in production profile) |
| 4 | Add **factory false-refusal** prompts to `[bad_prompts]` / `[good_prompts]` |
| 5 | VRAM ≤12 GB → `quantization = bnb_4bit`, `offload_outputs_to_cpu = true` |
| 6 | `heretic <model>` |
| 7 | Eval: `data/eval/hardware-factory-prompts.jsonl`, `cyber-research-prompts.jsonl` |
| 8 | Optional Jarvis QLoRA → [agentic-security-stack.md](agentic-security-stack.md) |
| 9 | Deploy GGUF Q4 or vLLM + `hardware-tool-gate.py` |

```toml
orthogonalize_direction = true
row_normalization = "full"
full_normalization_lora_rank = 8
winsorization_quantile = 0.95
kl_divergence_target = 0.01

# Optional: point bad/good sets at HF datasets (Heretic default) or export lines from
# data/eval/hardware-factory-prompts.jsonl into plain-text files for custom measurement.
[bad_prompts]
dataset = "mlabonne/harmful_behaviors"
split = "train[:400]"
column = "text"

[good_prompts]
dataset = "mlabonne/harmless_alpaca"
split = "train[:400]"
column = "text"
```

---

## Track B — Heretic research / diagnostics

**Goal:** Understand refusal geometry before committing export.

```bash
pip install -U "heretic-llm[research]"
heretic <model> --print-residual-geometry
heretic <model> --plot-residuals
```

| Output | Use |
|--------|-----|
| Silhouette per layer | Pick manual layer band |
| `S(g,r)` cosine | Validate projected direction need |
| PaCMAP plots | Presentation / debugging |

Then run full abliteration with tuned `n_trials` if geometry is noisy.

---

## Track C — Manual projected + norm-preserving

**Goal:** Reproduce Jim Lai pipeline without Optuna.

→ [../methods/projected-llm-abliteration.md](../methods/projected-llm-abliteration.md)

```bash
python measure.py -m <model> -o directions.pt --quant 4bit --projected
python sharded_ablate.py config.yaml --projected --normpreserve
```

---

## Track D — Multi-direction / stubborn refusals

**Goal:** Model still refuses after Track A.

| Step | Action |
|------|--------|
| 1 | Identify refusal **category** (safety vs over-refusal vs factory) |
| 2 | Build category-specific prompt files |
| 3 | Compute `r_1`, `r_2` (projected) |
| 4 | Two-pass ablation with lower α on second direction |
| 5 | Or subspace k=2 → [../methods/multi-direction-ablation.md](../methods/multi-direction-ablation.md) |

Optional: gradient RDO → [../methods/gradient-rdo-pipeline.md](../methods/gradient-rdo-pipeline.md)

---

## Track E — MoE / hybrid models

```bash
heretic Qwen/Qwen3-30B-A3B-Instruct   # example MoE — verify Heretic support
```

If unsupported:

→ [../methods/moe-expert-abliteration.md](../methods/moe-expert-abliteration.md)

Always 4-bit + CPU offload for MoE on consumer GPUs.

---

## Track F — Adapter-only deployment

**Goal:** 8 GB VRAM inference, OTA policy updates.

1. Heretic full abliteration (cloud GPU)
2. `python scripts/export-abliteration-lora.py --base ./base --abliterated ./out --rank 16`
3. PEFT 4-bit load or merge → GGUF

→ [../methods/lora-adapter-export.md](../methods/lora-adapter-export.md) · [../docs/toolchain-safetensors-gguf-lora.md](../docs/toolchain-safetensors-gguf-lora.md) (safetensors → LoRA → GGUF decision tree)

---

## Track H — Thinking models (CoT)

**Goal:** Qwen3-Thinking, R1 distill, gpt-oss — refusal in final channel only.

| Step | Action |
|------|--------|
| 1 | `cp sources/heretic-tools/config.thinking-model.toml config.toml` |
| 2 | Verify `chain_of_thought_skips` match your template (`print_responses = true` once) |
| 3 | `max_response_length = 256+` if CoT is long |
| 4 | `heretic <model>` → eval final answer block |

→ [thinking-models-guide.md](thinking-models-guide.md) · [../techniques/thinking-model-abliteration.md](../techniques/thinking-model-abliteration.md)

---

## Track I — Eval-driven factory deploy

**Goal:** Pass `hardware-factory-prompts.jsonl` and XSTest over-refusal gates.

| Step | Action |
|------|--------|
| 1 | Pass 1: `config.production.toml` |
| 2 | Export factory `.txt` from JSONL (see eval-driven workflow) |
| 3 | Pass 2: `config.factory-qa.toml` on pass-1 checkpoint |
| 4 | Score `xstest-overrefusal-sample.jsonl` ≤ 5% refusal |

→ [eval-driven-workflow.md](eval-driven-workflow.md) · [../techniques/eval-driven-abliteration.md](../techniques/eval-driven-abliteration.md)

---

## Track G — Inference prototype (no weight edit)

**Goal:** Validate factory prompt pairs before GPU surgery.

→ [quickstart.md](quickstart.md) + [../methods/residual-hook-ablation.md](../methods/residual-hook-ablation.md)

---

## Track J — Abliterix (MoE / hybrid / VL / multi-technique)

**Goal:** Architecture-specific automation when Heretic presets are thin — expert-granular MoE, LoRA abliteration, steering, ORBA, or SAE paths in one CLI.

| Step | Action |
|------|--------|
| 1 | Read upstream `benchmarks/SPEC.md` (**HonestAbliterationBench**) — not a substitute for handbook JSONL gates |
| 2 | Pick matching preset from Abliterix `configs/` (150+ upstream) |
| 3 | Run multi-objective Optuna (refusals + KL) per upstream README |
| 4 | Eval: factory + XSTest + GSM8K/MMLU + CyberGym proxy |
| 5 | Label checkpoint; note AGPL-3.0 if redistributing |

```bash
git clone https://github.com/wuwangzhang1216/abliterix.git
cd abliterix && pip install -e .
abliterix run --config configs/<family>.yaml   # verify model id
```

→ [../techniques/extended-abliteration-toolkit.md](../techniques/extended-abliteration-toolkit.md) · [../techniques/model-family-playbook.md](../techniques/model-family-playbook.md)

---

## Track K — ErisForge quick layer-band pass

**Goal:** Single-pass ablation after you have a layer band from Track B geometry — minimal config, GSM8K-friendly on benchmarked subsets.

| Step | Action |
|------|--------|
| 1 | `heretic <model> --print-residual-geometry` → pick `L_peak ± 4` |
| 2 | ErisForge `AblationDecoderLayer` on that band |
| 3 | `ExpressionRefusalScorer` sanity check |
| 4 | Full handbook eval gates |

```bash
git clone https://github.com/Tsadoq/ErisForge.git && cd ErisForge && pip install -e .
```

→ [../techniques/layer-selective-abliteration.md](../techniques/layer-selective-abliteration.md#erisforge--quick-prototyping) · [../docs/comparative-abliteration-benchmarks.md](../docs/comparative-abliteration-benchmarks.md)

---

## Technology stack reference

| Layer | Tools |
|-------|-------|
| Surgery (auto) | Heretic, **Abliterix** (MoE/VL/SSM presets) |
| Surgery (manual) | llm-abliteration + DECCP, **ErisForge** (layer band) |
| Prototyping | **FailSpy/abliterator**, TransformerLens hooks |
| Quant | bitsandbytes, llama.cpp |
| Adapters | PEFT, Unsloth, export script |
| Interpretability | TransformerLens, GemmaScope SAE, Abliterix SAE/ORBA |
| Agents | OpenHands, vLLM, Ollama |
| Gates | hardware-tool-gate.py, HonestAbliterationBench (upstream sanity) |

Full catalog: [../docs/tools/abliteration-tooling.md](../docs/tools/abliteration-tooling.md)

---

## Failure modes

| Symptom | Diagnosis | Fix |
|---------|-----------|-----|
| High KL, gibberish | Over-ablation | ↓ `max_weight`, enable projected+full norm |
| Harmful still refused | Wrong direction / layer / **training defense** | Custom bad prompts; multi-direction; see [defenses-against-abliteration.md](../docs/defenses-against-abliteration.md) |
| Benign over-refusal ↑ | Too aggressive kernel | Narrow layer band; ↓ α |
| Factory still refuses | Generic harmful dataset | Factory-specific `[bad_prompts]` |
| MoE quality drop | Missed experts | Per-expert ablation |
| OOM | VRAM | bnb_4bit, sharded ablate, cloud |

---

## Eval gate (must pass before deploy)

```text
[ ] Refusal rate harmful set ≤ target
[ ] Factory tool_call rate ≥ 95%
[ ] OSINT eval sample pass
[ ] KL / MMLU within threshold
[ ] hardware-tool-gate on destructive commands
[ ] Original checkpoint archived
```

→ [../docs/evaluation.md](../docs/evaluation.md)