# Multi-category refusal — beginner guide (QCRI 2026)

Plain-language summary of [arXiv:2602.02132](https://arxiv.org/abs/2602.02132) — *There Is More to Refusal in LLMs than a Single Direction* (Joad et al., Qatar Computing Research Institute, Feb 2026).

**Fetched source:** [../sources/fetched/arxiv-2602-02132.pdf](../sources/fetched/arxiv-2602-02132.pdf) · text extract: `sources/fetched/arxiv-2602-02132.txt` (regenerate: `npm run fetch:arxiv-qcri`)

**You are here if:** you finished [../instructions/beginner-reproduction-methodology.md](../instructions/beginner-reproduction-methodology.md) and want to understand **leading-edge refusal research** without reading the full paper.

---

## 30-second summary

| Old story (2024) | New story (QCRI 2026) |
|------------------|----------------------|
| One refusal direction in activation space | **Eleven** refusal types each have their **own** direction |
| Abliterate that direction → less refusal | Still true for **rate** — but directions differ in **refusal style** |
| Simple mechanism | Under the hood: shared **refusal core** + many **style-specific** features (SAEs) |

**Bottom line for beginners:** Heretic’s single-direction abliteration still works as a practical **volume knob** on refusal. The paper explains *why* one knob is enough for *how often* the model refuses — and *why* factory/CyberGym work may still need **domain-specific** prompt sets.

---

## What the paper tested

**Models:** `google/gemma-2-9b-it`, `meta-llama/Llama-3.1-8B-Instruct`

**Method (same as handbook basics):**

1. Collect prompts that should be **refused** vs **answered** (32+ per side per split)
2. Run the model; read activations at the **decision token** (chat template index **−2** — token right before the assistant starts)
3. Compute direction: `r = normalize(mean(refusal prompts) − mean(compliance prompts))`
4. **Steer:** add `α·r` to activations → more refusal; **ablate:** remove the `r` component → less refusal

**Extra (research):** GemmaScope / Llama SAEs at layers 9, 20, 31 — find sparse **refusal latents** that fire more on refusal than compliance.

---

## The eleven refusal categories

Refusal is not only “harmful = no.” QCRI builds **11 splits** from four public datasets:

| # | Split name | Source dataset | What it captures (plain language) |
|---|------------|----------------|-----------------------------------|
| 1 | **SafetyCore–WGM** | WildGuardMix | Classic safety harmful vs benign — **closest to Arditi 2024 single direction** |
| 2 | **OverRefusal–XST** | XSTest | Model refuses **benign** prompts that look scary — your factory `wmic` problem |
| 3 | **Humanizing–CCN** | CoCoNot | User treats model as human / emotional dependency |
| 4 | **Incomplete–CCN** | CoCoNot | Prompt missing required info |
| 5 | **Indeterminate–CCN** | CoCoNot | Ambiguous whether request is allowed |
| 6 | **Safety–CCN** | CoCoNot | Harmful content (CoCoNot framing) |
| 7 | **Unsupported–CCN** | CoCoNot | Request beyond model capabilities |
| 8 | **HateSpeech–SB** | SorryBench | Hate speech generation |
| 9 | **CrimeAssistance–SB** | SorryBench | Crime / tort assistance |
| 10 | **Inappropriate–SB** | SorryBench | Contextually inappropriate topics |
| 11 | **Advice–SB** | SorryBench | Unqualified professional advice |

**Handbook eval overlap:**

| QCRI split | Handbook file |
|------------|---------------|
| OverRefusal–XST | `data/eval/xstest-overrefusal-sample.jsonl` |
| SafetyCore–WGM | Heretic default `harmful_behaviors` / `harmless_alpaca` |
| Factory false-refusal | `data/eval/factory-good-prompts.jsonl`, `hardware-factory-prompts.jsonl` |

---

## Finding 1 — Many directions, not one

Directions from different categories are **geometrically distinct**:

- Typical **cosine similarity 0.4–0.6** between category pairs
- Some pairs are **nearly orthogonal** (e.g. Incomplete vs OverRefusal ≈ −0.06)

So “refusal” in the brain of the model is **not** literally one shared arrow for all situations.

**Beginner takeaway:** If you only ablate the classic **safety** direction, you may still see refusals that “feel different” (clarification requests, policy lectures, soft deflection) — those can sit on **other** directions.

---

## Finding 2 — One control knob anyway

Surprise: if you **steer** (or ablate) along **any** of the 11 directions with enough strength, you get **almost the same trade-off**:

- More steering → more refusal on harmful prompts
- But also → more **over-refusal** on benign prompts

The curves look alike whether you used Safety, OverRefusal, or Incomplete directions.

| What changes with direction | What does **not** change much |
|----------------------------|-------------------------------|
| **How** the model refuses (policy text vs “need more context” vs soft dodge) | **Whether** refusal rate goes up/down with strength |

**Beginner takeaway:** This is why **Heretic + one DIM** often works for agent deploy: you are turning a shared **refusal volume** knob, not tuning eleven independent switches.

---

## Finding 3 — SAE picture (why the knob exists)

Inside the model (SAE analysis):

```text
Refusal representation ≈ small SHARED core of latents
                      + long TAIL of style/domain-specific latents
```

- ~**8–10%** of SAE latents ever rank top for any refusal type
- Only ~**2.5–4%** appear across **all 11** types (the “core”)
- Linear steering **collapses** core + tail into the same behavioral effect

**Beginner takeaway:** Abliteration is a **blunt** but useful tool. It does not preserve fine-grained “only remove safety, keep over-refusal caution” — expect both to move together unless you use **narrower prompt sets** and **domain-specific** directions.

---

## What beginners should do differently (2026)

### Still start here (nothing broken)

1. [beginner-reproduction-methodology.md](../instructions/beginner-reproduction-methodology.md) — Heretic + bundled evals
2. [safety-guardrail-abliteration-methodology.md](safety-guardrail-abliteration-methodology.md) — weight-level guardrail removal

Single-direction projected abliteration remains the handbook default for ~90% of first runs.

### Add this awareness

| Symptom after abliteration | QCRI-informed interpretation |
|----------------------------|------------------------------|
| Still refuses `wmic` / factory tasks | Likely **over-refusal** direction — add factory bad/good prompts to Heretic `[bad_prompts]` / `[good_prompts]` |
| Answers harmful stuff but lectures on policy | You removed **rate**; **style** may still look like Safety–CCN |
| Benign security tasks start failing | Over-refusal knob turned too far — lower `max_weight`, enable projected+norm-preserving, eval XSTest |
| Harmful refusals remain | Try **second pass** with different prompt category — [iterative-abliteration.md](iterative-abliteration.md) |

### When to go beyond single-direction

| Situation | Next doc |
|-----------|----------|
| Factory + safety both stubborn | [beyond-single-direction.md](beyond-single-direction.md) · [domain-specific-abliteration.md](domain-specific-abliteration.md) |
| Research / interpretability | SAE section in [beyond-single-direction.md](beyond-single-direction.md) §4 |
| Multi-pass recipe | [iterative-abliteration.md](iterative-abliteration.md) |

---

## Simple analogy

Think of refusal like **volume on a stereo**:

- **QCRI 2026:** there are eleven **EQ presets** (safety, over-refusal, incomplete, …) — each is a different **direction** in wiring.
- **Turning any preset’s gain** still mostly moves the **same master volume** (how often refusal happens).
- **Which preset** you picked changes the **timbre** (policy refusal vs “please clarify” vs gentle dodge).
- **Abliteration** is like permanently lowering master volume in the weights — fast and effective, not a surgical per-preset mix.

---

## Research questions answered (from paper)

| RQ | Answer in one line |
|----|-------------------|
| RQ1: Are directions different per refusal type? | **Yes** — distinct geometry across 11 splits |
| RQ2: How do latents explain this? | Shared **core** + style **tail** in SAE space |
| RQ3: Do different directions steer differently? | Similar **rates**; different **styles** |
| RQ4: What do linear interventions control? | Mostly **whether/how often**; not fine style independence |
| RQ5: Shared latents across categories? | Yes — small core (~hundreds of latents per layer) |

---

## Limits (read before deploy)

- Paper uses **Gemma 2 9B** and **Llama 3.1 8B** — verify on **your** model family
- Linear methods **flatten** internal structure — not a substitute for runtime gates ([../docs/risks-and-ethics.md](../docs/risks-and-ethics.md))
- “Leading edge” ≠ “replace eval gates” — always run factory + XSTest checks

---

## Related

- [beyond-single-direction.md](beyond-single-direction.md) — practitioner deep dive
- [../docs/theory.md](../docs/theory.md) — math + projected abliteration
- [../docs/research-landscape.md](../docs/research-landscape.md) — paper timeline
- [../references.md](../references.md) — citation links