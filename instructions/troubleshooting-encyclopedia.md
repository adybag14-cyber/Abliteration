# Troubleshooting encyclopedia

Symptom → diagnosis → fix for abliteration, Heretic, Ollama, and agent deploy.

---

## Install & environment

| Symptom | Fix |
|---------|-----|
| `heretic: command not found` | Activate venv: `.\.venv\Scripts\Activate.ps1` |
| `torch.cuda.is_available()` False | Reinstall CUDA PyTorch — [setup-environment.md](setup-environment.md) |
| bitsandbytes fails on Windows | Use **WSL2 Ubuntu** + NVIDIA drivers |
| `huggingface-cli` 403 / gated | `huggingface-cli login`; accept license on HF website |
| Playwright HF fetch reset | `npm run fetch:hf-models:firefox` |

---

## CUDA OOM

| VRAM | Action |
|------|--------|
| Any | `quantization = "bnb_4bit"` |
| 8 GB | `config.low-vram.toml`; model ≤ 1.5B–4B 4-bit |
| Still OOM | `max_batch_size = 8`; `max_memory = { "0" = "7GB", "cpu" = "32GB" }` |
| MoE | Cloud GPU or sharded `llm-abliteration` |

```toml
offload_outputs_to_cpu = true
max_batch_size = 16
```

### 8 GB OOM symptoms (low-vram profile)

| Symptom | Fix |
|---------|-----|
| `CUDA out of memory` on model load (8 GB) | `cp sources/heretic-tools/config.low-vram.toml config.toml`; start with Qwen 1.5B–3B; ensure no other GPU apps; see [low-vram-abliteration.md](low-vram-abliteration.md) |
| OOM during Optuna trials (mid-run, 8 GB) | Lower `max_batch_size = 8`; add `max_memory = { "0" = "6.5GB", "cpu" = "32GB" }`; enable `offload_outputs_to_cpu = true`; reduce `n_trials` to 50–80 |
| OOM only on thinking/CoT models (8 GB) | Use `config.thinking-model.toml` + low-vram tweaks; set `max_response_length = 128`; prefer 1.5B–4B thinking variants |
| 4-bit load succeeds but eval/forward OOMs | `batch_size = 1`; close browsers; try Path B (llm-abliteration sharded_ablate) for surgery then GGUF locally |
| Persistent 8 GB swap thrashing | Do not rely on OS swap for >4B; use cloud for abliteration or `llm-abliteration` measure+sharded path; see beginner guide Track A limits |

Cross-ref: [low-vram-abliteration.md](low-vram-abliteration.md) · [thinking-models-guide.md](thinking-models-guide.md) · [beginner-local-model-guide.md](beginner-local-model-guide.md)

---

## Heretic run issues

| Symptom | Diagnosis | Fix |
|---------|-----------|-----|
| Optuna flat / no improvement | Wrong refusal markers | [../techniques/refusal-marker-tuning.md](../techniques/refusal-marker-tuning.md) |
| 100% refusal after run | Thinking model CoT scored | [thinking-models-guide.md](thinking-models-guide.md) |
| Optuna refusal never drops (thinking/CoT model) | `chain_of_thought_skips` misconfigured or missing model-specific tags | Copy `config.thinking-model.toml`; set `print_responses = true` temporarily; extract exact `<open>`/`<close>` delimiters from output and append as `["<open>", "<close>"]` pair (first match wins) |
| Refusal markers detected inside thinking block only | CoT skip tags do not match chat template | Verify tags in `chain_of_thought_skips` (e.g. Qwen analysis/final channel, `<think>`/ `</think>`); re-run 1 trial with print; see [thinking-models-guide.md](thinking-models-guide.md) Step 3 |
| Degenerate / gibberish output | Over-ablation | `row_normalization = full`; ↓ kernel strength; restore ORIGINAL |
| KL very high | Too aggressive | Re-run fewer trials; `kl_divergence_target = 0.005` |
| Trials hang / slow | Large model + long responses | ↓ `max_response_length`; 4-bit |
| Checkpoint resume fails | Corrupt study dir | Delete `checkpoints/` subfolder; restart |

---

## No behavior change after abliteration

| Cause | Fix |
|-------|-----|
| Loading **original** in Ollama | `ollama create` from abliterated GGUF path |
| Wrong Modelfile template | Match model family chat template |
| Quant too aggressive (Q2) | Use Q4_K_M or Q5_K_M |
| Evaluated wrong model path | `heretic ./models/X-abliterated` explicitly |

---

## Factory / agent still refuses

| Cause | Fix |
|-------|-----|
| Generic harmful_behaviors only | `config.factory-qa.toml` + factory .txt |
| Over-ablation on benign | [../data/eval/xstest-overrefusal-sample.jsonl](../data/eval/xstest-overrefusal-sample.jsonl) |
| Needs tool schema not weights | OpenHands function-calling + Jarvis QLoRA |
| Runtime policy | Not abliteration — fix system prompt |

→ [eval-driven-workflow.md](eval-driven-workflow.md) · [agentic-security-stack.md](agentic-security-stack.md)

---

## Quality / capability loss

| Symptom | Fix |
|---------|-----|
| MMLU / coding drop | `orthogonalize_direction = true`; winsorization `0.95` |
| Repetition loops | Lower ablation; check `max_response_length` |
| Wrong facts (hallucination) | Abliteration does not fix knowledge — not a regression from surgery |
| Gemma-specific blow-up | **Must** use `winsorization_quantile = 0.95` |

---

## MoE-specific

| Symptom | Fix |
|---------|-----|
| Some topics broken | Per-expert ablation — [../methods/moe-expert-abliteration.md](../methods/moe-expert-abliteration.md) |
| OOM on 30B-A3B | `bnb_4bit` + CPU offload; cloud |

---

## GGUF / Ollama

| Symptom | Fix |
|---------|-----|
| `ollama create` fails | Check `config.json` architecture in HF folder |
| Slower than HF | Normal for Q4 — try Q5 or GPU layers |
| Vision model no image | Include mmproj in convert |
| Chat template wrong | Copy `tokenizer_config.json` chat_template to Modelfile |

→ [run-locally-ollama-lmstudio.md](run-locally-ollama-lmstudio.md)

---

## Multi-pass / iterative

| Symptom | Fix |
|---------|-----|
| Worse after pass 2 | Pass 2 α too high — use 0.5 strength |
| KL compounded | Stop at pass 1; use Jarvis adapter instead |

→ [../techniques/iterative-abliteration.md](../techniques/iterative-abliteration.md)

---

## When to restore ORIGINAL

- Gibberish on >10% eval prompts
- KL > 1.0 with no refusal improvement
- Harmful compliance **too** high for your policy

Always keep `*-ORIGINAL` folder untouched.

---

## Escalation path

```text
beginner guide → low-vram → heretic-workflow
     ↓ still stuck
troubleshooting-encyclopedia (this page)
     ↓ quality tuning
advanced-abliteration-workflow
     ↓ research
research-landscape + beyond-single-direction
```