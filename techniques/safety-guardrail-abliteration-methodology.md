# Safety guardrail abliteration methodology

Weight-level **removal of the refusal / safety-response direction** from transformer checkpoints — distinct from prompt jailbreaks, inference steering, or uncensored fine-tuning.

**Hands-on reproduction:** [../instructions/beginner-reproduction-methodology.md](../instructions/beginner-reproduction-methodology.md)  
**Theory:** [../docs/theory.md](../docs/theory.md) · [../docs/overview.md](../docs/overview.md)

---

## What “safety guardrails” means here

In instruction-tuned LLMs, a large fraction of **refusal behavior** (policy text, “I cannot help”, over-cautious deflection) correlates with a **linear direction** in residual activations per layer ([arXiv:2406.11717](https://arxiv.org/abs/2406.11717)).

**2026 nuance (QCRI):** Eleven refusal *types* (safety, over-refusal, incomplete requests, …) each have **distinct** directions — but linear abliteration/steering still acts like one **shared volume knob** on refusal *rate*. Style of refusal can differ; see [multi-category-refusal-beginners-guide.md](multi-category-refusal-beginners-guide.md).

| Concept | Meaning |
|---------|---------|
| **Safety guardrail (weights)** | Encoded refusal direction baked into `down_proj` / `o_proj` (and MoE expert equivalents) |
| **Abliteration** | Permanent weight edit that removes the component of weights along `r_ℓ` |
| **Not abliteration** | System prompt tricks, activation steering hooks, RLHF retrain, Circuit Breakers *training* |

Abliteration **reduces** the model’s tendency to enter refusal mode on prompts that activate `r`. It does **not** add a new runtime policy layer — pair with [../docs/risks-and-ethics.md](../docs/risks-and-ethics.md) and `hardware-tool-gate.py` for agents.

---

## What this is *not*

| Objective | Tool / method | Confusion risk |
|-----------|---------------|----------------|
| **Slop / sycophancy reduction** | Heretic `config.noslop.toml`, steering | Does not require full uncensoring |
| **Circuit Breakers** | GraySwan training | *Adds* safety — opposite of abliteration |
| **Domain-only false-refusal fix** | Factory-specific DIM | Narrower than broad safety guard removal |
| **Tool-call format repair** | Jarvis QLoRA | Orthogonal to refusal direction |

See [steering-and-alternatives.md](steering-and-alternatives.md) and [../docs/comparative-abliteration-benchmarks.md](../docs/comparative-abliteration-benchmarks.md) (slop vs safety guard).

---

## Core methodology (reproducible)

```text
1. Scope     — Authorized lab use; archive pristine base weights
2. Datasets  — Harmful/refusal-eliciting vs harmless/compliance prompt pairs (equal N)
3. Measure   — Forward passes → residual activations at decision token per layer ℓ
4. Direction — r_ℓ = normalize(mean(harmful) − mean(harmless))  [mean-difference DIM]
5. Project   — Optional: orthogonalize r against harmless centroid (lower KL)
6. Targets   — Primary: mlp.down_proj, self_attn.o_proj (per architecture)
7. Ablate    — W' = W − α · project(W, r)  (layer band or depth kernel)
8. Norm      — Optional: row-normalization + small LoRA correction
9. Eval      — Refusal rate ↓, benign capability intact, KL on harmless set
10. Deploy   — Safetensors → quant → Ollama/vLLM only after gates pass
```

### Step details

**1 — Scope & backup**

- Keep `*-ORIGINAL` folder untouched.
- Record model id, config hash, date, GPU in `run-notes.md`.

**2 — Prompt sets**

| Set | Purpose | Handbook default |
|-----|---------|------------------|
| Bad / harmful | Elicit refusal activations | Heretic `mlabonne/harmful_behaviors` or custom `.txt` |
| Good / harmless | Compliance centroid | `mlabonne/harmless_alpaca` or factory good prompts |
| Over-refusal probe | False-refusal regression | `data/eval/xstest-overrefusal-sample.jsonl` |

Do not invent ad-hoc harmful prompts for first reproduction — use bundled corpora.

**3–4 — Direction estimation**

→ [mean-difference-direction.md](mean-difference-direction.md)  
Heretic automates measure + winsorization + geometric median options → [geometric-median-winsorization.md](geometric-median-winsorization.md)

**5–7 — Weight surgery**

| Automation | When |
|------------|------|
| **Heretic** (default) | Optuna searches depth kernel + strength + projected/norm-preserving |
| **llm-abliteration** | Manual YAML band; sharded for low VRAM / 20B+ |
| **ErisForge** | Known layer band; single-pass |
| **Abliterix** | MoE/VL presets; multi-objective refusal+KL |

→ [extended-abliteration-toolkit.md](extended-abliteration-toolkit.md)

**8 — Capability preservation**

Enable projected + norm-preserving in production:

```toml
orthogonalize_direction = true
row_normalization = "full"
```

→ [projected-norm-preserving-abliteration.md](projected-norm-preserving-abliteration.md)

**9 — Eval gates (mandatory)**

```text
[ ] Harmful refusal rate ≤ target (Heretic --evaluate-model or custom)
[ ] factory-good-prompts.jsonl — benign answers still work
[ ] xstest-overrefusal-sample.jsonl — ≤ 5% refusal on authorized probes
[ ] GSM8K or MMLU slice — capability sanity
[ ] KL divergence on harmless set
```

→ [../instructions/eval-driven-workflow.md](../instructions/eval-driven-workflow.md)

---

## Multi-pass safety guard removal

When a single DIM pass leaves refusals ([beyond-single-direction.md](beyond-single-direction.md)):

| Pass | Direction source | Strength |
|------|------------------|----------|
| 1 | Domain-specific (factory WMI pairs) | Full α on middle layers |
| 2 | Generic safety (`harmful_behaviors`) | **Half α** on non-overlapping band |

→ [iterative-abliteration.md](iterative-abliteration.md) · [../methods/multi-direction-ablation.md](../methods/multi-direction-ablation.md)

---

## Tool selection for guardrail removal

| Constraint | Prefer |
|------------|--------|
| First reproduction, 8 GB | Heretic + `config.low-vram.toml` |
| GSM8K regression on Heretic | ErisForge or DECCP single-pass |
| MoE / VL / Gemma 4 preset | Abliterix (verify eval gates) |
| Prototype direction only | FailSpy/abliterator hooks → bake with Heretic |
| 20B+ OOM | llm-abliteration sharded + 4-bit measure |

Benchmark evidence: [../docs/comparative-abliteration-benchmarks.md](../docs/comparative-abliteration-benchmarks.md)

---

## Success criteria (beginner)

A successful **safety guardrail abliteration** run:

1. Original checkpoint intact in `*-ORIGINAL`
2. Edited folder loads and generates fluently
3. Benign operational prompts still answered
4. Over-refusal sample rate **drops** vs base
5. No unexplained quality collapse on a small MMLU/GSM8K spot check

If #5 fails — restore backup, enable projected+norm-preserving, or reduce `max_weight` / narrow layer band.

---

## Related

- [../instructions/beginner-reproduction-methodology.md](../instructions/beginner-reproduction-methodology.md) — step-by-step first run
- [../instructions/heretic-workflow.md](../instructions/heretic-workflow.md) — Heretic CLI reference
- [layer-selective-abliteration.md](layer-selective-abliteration.md) — where in depth to ablate
- [domain-specific-abliteration.md](domain-specific-abliteration.md) — factory vs broad safety
- [../docs/risks-and-ethics.md](../docs/risks-and-ethics.md) — authorized scope