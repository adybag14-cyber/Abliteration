# Iterative & multi-pass abliteration

When a **single** Heretic run leaves residual refusals — or collapses capabilities — apply controlled **second passes** instead of cranking `max_weight` in one shot.

---

## When to iterate

| Signal | Next pass strategy |
|--------|-------------------|
| Factory prompts still refuse | Domain-specific direction pass → [domain-specific-abliteration.md](domain-specific-abliteration.md) |
| Harmful set still refuses | Standard harmful DIM pass with **lower α** on non-overlapping layers |
| KL already high | **Stop** — do not iterate; reduce first-pass strength |
| Multi-category refusals (QCRI) | Two directions, two passes → [beyond-single-direction.md](beyond-single-direction.md) |

---

## Pass 1 → Pass 2 workflow

```text
Pass 1: Heretic default (projected + norm-preserving)
   ↓ eval: hardware-factory-prompts.jsonl + harmful_behaviors
Pass 2a (factory): custom bad/good .txt, α ≈ 0.5, layers 16–24 only
   OR
Pass 2b (safety): re-run Heretic on Pass-1 checkpoint, n_trials=80, tighter KL target
```

**Rule:** each pass uses a **fresh Optuna study** or manual α; never stack full-strength passes blindly.

---

## Partial strength between passes

```
W_pass2 = W_pass1 - α₂ · proj_{r₂}(W_pass1),   α₂ ∈ [0.3, 0.7]
```

Heretic encodes strength in the kernel (`max_weight`). For manual second pass:

```bash
# llm-abliteration — ablate Pass-1 output, not original base
python measure.py -m ./models/out-pass1 -o directions_pass2.pt --quant 4bit --projected
python sharded_ablate.py config_pass2.yaml --projected --normpreserve
```

`config_pass2.yaml`: `strength: 0.5`, narrower `layers.start/end`.

---

## Representational independence heuristic

From TUM concept-cones work — orthogonal directions ≠ independent effects.

**Safe order for agents:**

1. **Factory / tool false-refusal** direction first (custom WMI/nmap pairs)
2. **Generic safety** direction second at **half strength**
3. Eval after each pass — stop when factory tool_call ≥ 95% and KL acceptable

---

## Checkpoint hygiene

```text
models/
├── Qwen3-4B-ORIGINAL/          # never touch
├── Qwen3-4B-pass1-heretic/     # after run 1
├── Qwen3-4B-pass2-factory/     # after run 2
└── Qwen3-4B-FINAL/             # symlink or copy for deploy
```

Document `config.toml` + `n_trials` + eval scores in a `RUNLOG.md` beside checkpoints.

---

## Adapter stacking (LoRA)

Prefer **one** full Heretic pass, then **Jarvis QLoRA** for tool-call repair — not multiple full weight abliterations.

| Stack | OK? |
|-------|-----|
| Heretic → Jarvis adapter | ✅ Recommended for agents |
| Heretic → Heretic → Heretic | ⚠️ Only with eval gates between passes |
| Heretic → merge LoRA → Heretic | ❌ Avoid unless researching |

→ [lora-qlora-abliteration.md](lora-qlora-abliteration.md)

---

## Related

- [beyond-single-direction.md](beyond-single-direction.md)
- [eval-driven-abliteration.md](eval-driven-abliteration.md)
- [../instructions/eval-driven-workflow.md](../instructions/eval-driven-workflow.md)
- [../instructions/advanced-abliteration-workflow.md](../instructions/advanced-abliteration-workflow.md) Track D