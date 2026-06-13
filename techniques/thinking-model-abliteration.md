# Thinking-model abliteration

Models that emit **chain-of-thought** blocks before the user-visible answer — Qwen3 thinking variants, DeepSeek-R1 distillates, gpt-oss, Claude-style `<thought>` tags — need special handling during measurement and refusal counting.

---

## Why thinking models are different

| Issue | What happens |
|-------|----------------|
| Refusal in CoT | Model "thinks" it cannot help, then still refuses in final channel |
| Eval on wrong tokens | Heretic counts refusal on thinking text, not the actual reply |
| Longer sequences | Higher VRAM during `max_response_length` sweeps |
| Template markers | Each family uses different open/close tags |

Heretic solves the eval problem with **`chain_of_thought_skips`** — strip the thinking block before refusal-marker detection.

---

## Config: `chain_of_thought_skips`

Each entry is `[open_tag, close_tag]` (inclusive). Heretic removes everything from `open_tag` through `close_tag` before scoring.

```toml
chain_of_thought_skips = [
    ["<think>", "</think>"],
    ["<|channel|>analysis<|message|>",
     "<|channel|>analysis<|message|><|end|><|start|>assistant<|channel|>final<|message|>"],
    ["<thought>", "<thought></thought>"],
    ["[THINK]", "[THINK][/THINK]"],
]
```

**Handbook pin:** [../sources/heretic-tools/config.thinking-model.toml](../sources/heretic-tools/config.thinking-model.toml)

### Find tags for your model

1. Run one harmful + one harmless prompt with `print_responses = true` in `config.toml`.
2. Note delimiter strings around the reasoning block.
3. Add a new pair — **order matters**; first match wins.

---

## Step-by-step (thinking Qwen3 / R1-style)

| Step | Action |
|------|--------|
| 1 | Copy `config.thinking-model.toml` → `config.toml` |
| 2 | Set `max_response_length = 256` or higher if CoT is long |
| 3 | Enable `orthogonalize_direction = true`, `row_normalization = full` |
| 4 | `heretic <model>` — watch first trial for truncated CoT |
| 5 | If refusal count stuck high, verify skip tags match chat template |
| 6 | Post-abliteration: test **final channel only** in Ollama Modelfile |

```bash
cp sources/heretic-tools/config.thinking-model.toml config.toml
heretic Qwen/Qwen3-4B-Thinking-2507   # example — verify HF ID
```

---

## VRAM notes

| Model size | Recommendation |
|------------|----------------|
| 4B thinking + 8 GB | `quantization = "bnb_4bit"`, `max_batch_size = 8`, `max_response_length = 128` |
| 8B thinking + 12 GB | `bnb_4bit`, `max_response_length = 200` |
| 14B+ thinking | Cloud GPU or sharded manual pipeline |

Long CoT increases activation memory during the measure pass — lower `max_batch_size` before lowering `n_trials`.

---

## Common failure modes

| Symptom | Fix |
|---------|-----|
| 100% refusal after abliteration | CoT skip missing — refusal detected in `<think>` block |
| Gibberish final answer | Over-ablation; raise `kl_divergence_target`; enable winsorization `0.95` |
| Optuna never improves | `max_response_length` too low — model never reaches final answer |
| Different behavior Ollama vs HF | Ollama template must preserve thinking markers or strip consistently |

---

## Research mode

```bash
pip install -U "heretic-llm[research]"
heretic <model> --print-residual-geometry
```

Compare silhouette scores **with** and **without** CoT skip enabled — thinking layers sometimes show refusal signal in early-mid depth before the final token.

---

## Related

- [kernel-shaping-depth-profile.md](kernel-shaping-depth-profile.md)
- [refusal-marker-tuning.md](refusal-marker-tuning.md)
- [../instructions/thinking-models-guide.md](../instructions/thinking-models-guide.md)
- [../sources/heretic-tools/config.thinking-model.toml](../sources/heretic-tools/config.thinking-model.toml)