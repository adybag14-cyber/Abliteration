# Defenses against abliteration (beginner guide)

Training-time and inference-time methods that **resist** weight-surgery uncensoring — the counterpart to everything else in this handbook.

**Research corpus:** [arXiv:2505.19056 PDF](../sources/research/papers/arxiv-2505.19056.pdf) · [arXiv:2605.26526 PDF](../sources/research/papers/arxiv-2605.26526.pdf)

**Agent stack context:** [../instructions/agentic-security-stack.md](../instructions/agentic-security-stack.md) · [steering-and-alternatives.md](../techniques/steering-and-alternatives.md) §4

---

## Why this matters for handbook users

You abliterate models to **reduce false refusals** on authorized factory/CyberGym tasks. Defenses exist because **vendors and alignment researchers** want the opposite — refusal that survives weight edits.

| Symptom during your run | Possible cause |
|-------------------------|----------------|
| Refusal rate drops only ~10% after full Heretic pass | **Extended-refusal** or **ART**-trained checkpoint |
| Model still policy-lectures but complies more | Partial defense — style shifted, not rate |
| Community “abliterated” model barely changed | Base may already be permissive **or** defense-heavy |

Always compare against **your** base checkpoint with the same eval prompts.

---

## 1. Extended-refusal fine-tuning (Shairah et al., 2025)

**Paper:** [arXiv:2505.19056](https://arxiv.org/abs/2505.19056) — *An Embarrassingly Simple Defense Against LLM Abliteration Attacks*

| | |
|--|--|
| **Idea** | Train the model to give a **long justification** before refusing — refusal signal spreads across **many tokens**, not one activation direction. |
| **Models tested** | Llama-2-7B-Chat, Qwen2.5-Instruct (1.5B, 3B) |
| **Result** | After abliteration: refusal drops **≤10%** (extended-refusal) vs **70–80%** (baseline) |
| **Repo PDF** | [../sources/research/papers/arxiv-2505.19056.pdf](../sources/research/papers/arxiv-2505.19056.pdf) |

**Plain analogy:** Instead of one “STOP” light in the circuit, the model installs **ten smaller brakes** along the output — removing one direction does not kill all of them.

**Handbook implication:** If you need strong uncensoring for lab agents, pick bases **without** extended-refusal training (most community Heretic targets are standard instruct models). If abliteration underperforms, try **multi-pass** or **domain-specific** directions — [../techniques/iterative-abliteration.md](../techniques/iterative-abliteration.md).

---

## 2. Circuit Breakers (GraySwan, 2024)

**Paper:** [arXiv:2406.04313](https://arxiv.org/abs/2406.04313) · **Code:** [GraySwanAI/circuit-breakers](https://github.com/GraySwanAI/circuit-breakers)

| | |
|--|--|
| **Idea** | During safety **training**, orthogonalize harmful activations so jailbreaks cannot isolate one refusal direction. |
| **vs abliteration** | **Opposite goal** — strengthens refusal robustness |
| **Research note** | CB models can still be attacked in lab settings; not a guarantee |

**Beginner takeaway:** Do not confuse Circuit Breakers with abliteration. Factory deploy docs assume you **want** compliance on scoped prompts, not CB-hardened bases.

---

## 3. Open-weight safeguards + ART (Kuo et al., 2026)

**Paper:** [arXiv:2605.26526](https://arxiv.org/abs/2605.26526) — *Open-Weight LLM Fine-Tuning Defenses are Susceptible to Simple Attacks*

| | |
|--|--|
| **Finding** | Defenses like **TAR** and **SEAM** (fine-tuning safeguards) still fall to **gradient-free** attacks: **abliteration** and **prefilling** (force model to start answer with compliant prefix). |
| **Attack success** | Below 10% → **16–96%** on BeaverTails / HarmBench / AdvBench after simple attacks |
| **Mitigation proposed** | **ART** (abliteration-resistant tuning) — bake abliteration into training objective; reduces success ~**10–20%** |
| **Repo PDF** | [../sources/research/papers/arxiv-2605.26526.pdf](../sources/research/papers/arxiv-2605.26526.pdf) |

**Beginner takeaway:**

- **Prefilling** is inference-only (no weight edit) — different from this handbook’s weight surgery path.
- If evaluating “secure” open-weight models, report **both** abliteration and prefilling — benchmarks that only test fine-tuning attacks understate risk.

---

## 4. Safety pretraining depth (Agnihotri et al., 2025)

**Paper:** [arXiv:2510.02768](https://arxiv.org/abs/2510.02768) — *A Granular Study of Safety Pretraining under Model Abliteration*

| | |
|--|--|
| **Idea** | Track **which safety pretraining checkpoint** (SmolLM2-1.7B granular stages) still refuses after abliteration. |
| **Code** | [github.com/shashankskagnihotri/safety_pretraining](https://github.com/shashankskagnihotri/safety_pretraining) |
| **Repo PDF** | [../sources/research/papers/arxiv-2510.02768.pdf](../sources/research/papers/arxiv-2510.02768.pdf) |

**Beginner takeaway:** Heavier safety pretraining ≠ impossible to abliterate, but **checkpoint choice** changes how hard you must tune. Prefer well-documented instruct bases (Qwen, Llama, Gemma IT) with community Heretic recipes.

---

## Defense vs attack matrix (simplified)

| Method | Type | Resists single-direction abliteration? | Handbook path |
|--------|------|----------------------------------------|-------------|
| Standard RLHF refusal | Training | Partially | Heretic default |
| Extended-refusal FT | Training | **Strong** | Multi-pass / different base |
| Circuit Breakers | Training | Moderate | Research contrast only |
| TAR / SEAM | Training | Weak vs abliteration + prefilling | See Kuo 2026 |
| ART | Training | Reduces abliteration success ~10–20% | May need stronger surgery |
| Runtime gate (`hardware-tool-gate.py`) | Inference | N/A — **your** safety layer | [agentic-security-stack.md](../instructions/agentic-security-stack.md) |

---

## What beginners should do

1. **Pick a standard instruct base** with community abliteration recipes (Qwen2.5-1.5B smoke test → your target).
2. **Enable projected + norm-preserving** before blaming “defenses.”
3. If refusal barely moves — check for extended-refusal/ART in model card; try **factory-specific** `[bad_prompts]` / `[good_prompts]`.
4. **Never rely on abliteration alone** for agent safety — keep `hardware-tool-gate.py` and authorized scope ([risks-and-ethics.md](risks-and-ethics.md)).

---

## Related

- [refusal-research-beginners-guide.md](refusal-research-beginners-guide.md) — full paper map
- [comparative-abliteration-benchmarks.md](comparative-abliteration-benchmarks.md) — tool selection
- [../techniques/steering-and-alternatives.md](../techniques/steering-and-alternatives.md) — Circuit Breakers vs abliteration