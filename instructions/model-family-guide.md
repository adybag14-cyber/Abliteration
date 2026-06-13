# Model family guide — which model & config?

Pick a **base checkpoint**, **config profile**, and **post-run path** by hardware and goal.

> Deep reference: [../techniques/model-family-playbook.md](../techniques/model-family-playbook.md) · HF registry: [../docs/tools/heretic-models-registry.md](../docs/tools/heretic-models-registry.md)

---

## By GPU VRAM

| VRAM | Model | Config | Time (approx) |
|------|-------|--------|---------------|
| **8 GB** | `Qwen/Qwen2.5-1.5B-Instruct` | `config.low-vram.toml` | 30–90 min |
| **10–12 GB** | `Qwen/Qwen3-4B-Instruct-2507` | `config.low-vram.toml` (4-bit) | 45–120 min |
| **16 GB** | `Qwen/Qwen3-4B-Instruct-2507` | `config.production.toml` | 30–60 min |
| **24 GB** | `google/gemma-3-12b-it` or `meta-llama/Llama-3.1-8B-Instruct` | `config.production.toml` | 1–3 hr |
| **No GPU** | `p-e-w/Qwen3-4B-Instruct-2507-heretic` | download only | — |

---

## By goal

| Goal | Model family | Notes |
|------|--------------|-------|
| First abliteration ever | Qwen2.5-1.5B | [beginner-local-model-guide.md](beginner-local-model-guide.md) |
| Best quality / agents | Qwen3-4B or Gemma-3-12B | production profile |
| Factory bench agent | Qwen3-4B + `config.factory-qa.toml` pass 2 | [eval-driven-workflow.md](eval-driven-workflow.md) |
| Thinking / reasoning | Qwen3-Thinking, R1 distill | [thinking-models-guide.md](thinking-models-guide.md) |
| MoE at scale | Qwen3-30B-A3B | cloud + 4-bit |
| Vision QA | Qwen2.5-VL-7B | [../techniques/vision-multimodal-abliteration.md](../techniques/vision-multimodal-abliteration.md) |
| Skip surgery | Download `p-e-w/*-heretic` | Track C in beginner guide |

---

## Family quick commands

### Qwen3 4B (most popular)

```bash
cp sources/heretic-tools/config.production.toml config.toml
huggingface-cli download Qwen/Qwen3-4B-Instruct-2507 --local-dir ./models/qwen3-4b
heretic ./models/qwen3-4b
```

### Gemma 3 12B (winsorization required)

```bash
cp sources/heretic-tools/config.production.toml config.toml
# winsorization_quantile = 0.95 already set
heretic google/gemma-3-12b-it
```

### Llama 3.1 8B (gated)

```bash
huggingface-cli login
cp sources/heretic-tools/config.production.toml config.toml
heretic meta-llama/Llama-3.1-8B-Instruct
```

### Factory second pass

```bash
cp sources/heretic-tools/config.factory-qa.toml config.toml
heretic ./models/qwen3-pass1
```

---

## After abliteration

| Step | Doc |
|------|-----|
| Ollama import | [run-locally-ollama-lmstudio.md](run-locally-ollama-lmstudio.md) |
| Agent stack | [agentic-security-stack.md](agentic-security-stack.md) |
| Advanced tuning | [advanced-abliteration-workflow.md](advanced-abliteration-workflow.md) |