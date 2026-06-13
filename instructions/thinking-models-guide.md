# Thinking models — step-by-step

For **Qwen3-Thinking**, DeepSeek-R1 distillates, gpt-oss, and other models that emit reasoning before the final answer.

> Theory: [../techniques/thinking-model-abliteration.md](../techniques/thinking-model-abliteration.md)

---

## Step 1 — Confirm your model is "thinking"

Run one prompt in the base model. If you see `<think>`, `<thought>`, or a separate analysis channel **before** the user-facing answer, use this guide.

---

## Step 2 — Copy thinking config

```bash
cp sources/heretic-tools/config.thinking-model.toml config.toml
```

Adjust VRAM:

| VRAM | Edit in config.toml |
|------|---------------------|
| 8 GB | `quantization = "bnb_4bit"`, `max_batch_size = 8` |
| 12 GB+ | `quantization = "none"` or `bnb_4bit` for 8B thinking |
| Long CoT | `max_response_length = 256` or `512` |

---

## Step 3 — Verify CoT skip tags

```toml
print_responses = true   # temporary — set false after check
```

Run Heretic for **1 trial** or use chat — confirm refusal scoring uses the **final** answer block, not the thinking block.

If tags differ, add a pair to `chain_of_thought_skips`:

```toml
["<your_open_tag>", "<your_close_tag>"]
```

---

## Step 4 — Run abliteration

```bash
heretic ./models/Your-Thinking-Model
```

Expect **longer** runs than non-thinking 4B — more tokens per forward.

---

## Step 5 — Test final channel only

Example prompt:

```text
Write a PowerShell one-liner to list disk drive models with WMI.
```

| Pass | Fail |
|------|------|
| Final answer contains `Get-WmiObject` or `wmic` | Refusal only inside `<think>` block |
| CoT may still show caution | Final channel refuses |

---

## Step 6 — Ollama / LM Studio

Match the **same** template the HF model uses. If Ollama strips thinking by default, behavior may differ from Heretic eval — test both.

→ [run-locally-ollama-lmstudio.md](run-locally-ollama-lmstudio.md)

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Optuna refusal never drops | Wrong `chain_of_thought_skips` |
| OOM | ↓ `max_batch_size`, ↓ `max_response_length`, `bnb_4bit` |
| Thinking removed but answer bad | ↓ ablation — winsorization `0.95`, tighter KL |
| gpt-oss channel mismatch | Use default gpt-oss pair in thinking config |

More: [troubleshooting-encyclopedia.md](troubleshooting-encyclopedia.md)