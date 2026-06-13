# Steering, RepE & alternatives to weight abliteration

Not every refusal change requires permanent weight surgery. Compare **inference-time**, **training-time defensive**, and **hybrid** approaches.

---

## 1. Inference-time directional ablation (hooks)

Subtract `(h·r)r` during forward — **reversible**.

→ [inference-directional-ablation.md](inference-directional-ablation.md)

**Pros:** zero checkpoint risk; fast A/B. **Cons:** hooks unsupported in vLLM/Ollama production.

---

## 2. Activation addition / subtraction (steering)

```
h' = h + α r    # induce refusal
h' = h - α r    # reduce refusal (cruder than projection)
```

[Representation Engineering (RepE)](https://arxiv.org/abs/2310.01405) — extract concept vectors for honesty, harmlessness, etc.

**Tools:**

| Project | URL |
|---------|-----|
| repeng | [vscode-repeng](https://github.com/vgel/repeng) / community forks |
| EasySteer | various HF spaces |
| TransformerLens hooks | [TransformerLens](https://github.com/TransformerLensOrg/TransformerLens) |

**vs abliteration:** steering is **session-local**; combine steering prototype → confirm direction → Heretic bake-in.

---

## 3. Orthogonal Activation Steering (OAS)

Community method to find steering vectors **orthogonal to capability directions** to reduce collateral damage (discussed on r/LocalLLaMA). Conceptually aligned with **projected abliteration** but at inference:

```
r_steered = normalize(r - (r·g)g)
h' = h - α (h·r_steered) r_steered
```

---

## 4. Defenses that resist abliteration

Training-time methods that **fight** weight-surgery uncensoring — extended-refusal fine-tuning, ART, Circuit Breakers.

→ [../docs/defenses-against-abliteration.md](../docs/defenses-against-abliteration.md) (beginner guide + [arXiv:2505.19056 PDF](../sources/research/papers/arxiv-2505.19056.pdf))

---

## 5. Circuit breakers (defensive — opposite direction)

[GraySwan circuit breakers](https://github.com/GraySwanAI/circuit-breakers) — **training-time** method that **orthogonalizes harmful activations** during fine-tuning so jailbreaks cannot easily remove safety.

| Aspect | Abliteration | Circuit breakers |
|--------|--------------|------------------|
| Goal | Remove refusal | **Strengthen** refusal robustness |
| When | Post-training uncensor | Training aligned model |
| Agent use | Pentest agents need compliance | Not for decensoring |

**Research note:** CB models can still be abliterated — see LessWrong "breaking circuit breakers". Document for completeness, not factory deployment.

---

## 6. Fine-tune on uncensored data (not abliteration)

Standard QLoRA SFT on uncensored instruction mixes. **Different mechanism** — shifts logits via gradient descent, not closed-form projection.

| Use | Tool |
|-----|------|
| General chattiness | Unsloth, Axolotl, TRL |
| Tool-call repair | Jarvis pack QLoRA |

Risk: capability collapse, dataset bias. Prefer abliteration + narrow Jarvis adapter for security agents.

---

## 7. Prompt / system-level bypass

Not weight surgery — baseline for eval:

- "You are an authorized security analyst…"
- Tool-schema forcing (OpenHands, function calling)

Abliteration removes need for jailbreak prompts; **does not replace** runtime gates (`hardware-tool-gate.py`).

---

## 7. W2SV / rank-1 patches

Low-rank `W + u vᵀ` from activation stats — alternative parameterization.

→ [w2sv-rank1-patch.md](w2sv-rank1-patch.md)

---

## Decision matrix

| Need | Method |
|------|--------|
| Reversible experiment | Hook ablation or RepE |
| Permanent local model | Heretic projected + norm-preserving |
| Smallest download | LoRA adapter export |
| Interpret features | SAE latents + steering |
| Harden alignment (defense) | Circuit breakers training |
| Fix `wmic` false refusal post-abliteration | Jarvis QLoRA |
| Reduce sycophantic filler (not uncensoring) | Heretic `config.noslop.toml` |
| Better GSM8K preservation (single-pass) | **ErisForge** or **DECCP** — see [comparative-abliteration-benchmarks.md](../docs/comparative-abliteration-benchmarks.md) |
| Toolkit comparison before agent deploy | [comparative-abliteration-benchmarks.md](../docs/comparative-abliteration-benchmarks.md) + [references.md](../references.md) install one-liners |

---

## 8. Slop / style abliteration (community)

Directional edits can reduce **purple prose and sycophantic filler** without full refusal removal — a different objective than safety guard abliteration.

| Resource | Role |
|----------|------|
| `sources/heretic-tools/config.noslop.toml` | Upstream slop-suppression prompt pairs + refusal markers |
| [comparative-abliteration-benchmarks.md](../docs/comparative-abliteration-benchmarks.md) | Community reports + distinction from uncensoring |

```bash
cp sources/heretic-tools/config.noslop.toml config.toml
heretic ./models/YourModel-Instruct
```

Always eval capability (GSM8K/MMLU sample) — style edits can still shift reasoning.

---

## Related

- [../docs/research-landscape.md](../docs/research-landscape.md)
- [lora-qlora-abliteration.md](lora-qlora-abliteration.md)