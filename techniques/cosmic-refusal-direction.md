# T36 — COSMIC refusal-direction identification

Siu et al., ACL 2025 Findings: [COSMIC: Generalized Refusal Direction Identification](https://arxiv.org/abs/2506.00085). PDF: [../sources/research/papers/arxiv-2506.00085.pdf](../sources/research/papers/arxiv-2506.00085.pdf). Code: [wang-research-lab/COSMIC](https://github.com/wang-research-lab/COSMIC).

**One sentence:** pick `r` and the target layer with **cosine similarity in activation space**, without reading “I cannot” (or any refusal template) from generated tokens.

Method steps: [../methods/cosmic-direction-id.md](../methods/cosmic-direction-id.md).

---

## Problem it solves

Classic recipes (Arditi, Heretic refusal markers, FailSpy scorers) assume you can **see** refusal in the output — a string list (`I'm sorry`, `I cannot`, …). That fails when:

- The model is **weakly aligned** (hedges, partial answers, no template)
- You ablate a **thinking** model whose refusal lives in CoT, then gets stripped
- You work in a language whose markers you did not list ([refusal-marker-tuning.md](refusal-marker-tuning.md) helps, COSMIC does not need it)
- You want to **induce** refusal (steer *toward* safety) on a base model

COSMIC is **output-independent**: it scores candidate directions by how they invert or separate concepts in hidden states.

---

## Idea

1. Cache residual activations on a **contrast set** (harmful vs harmless prompts) at every layer.
2. Build candidate directions (DIM, PCA, per-layer differences).
3. Score each candidate by **cosine structure** (how cleanly it separates the two clouds; how inverting it swaps neighborhoods).
4. Select `(layer*, r*)` that maximizes the COSMIC score.
5. Ablate or steer with any baker (Heretic, hooks, `apply-weight-abliteration.py`).

COSMIC does **not** replace weight surgery. It replaces **“which vector and which layer.”**

---

## When to use

| Use COSMIC | Stay on Heretic DIM |
|------------|---------------------|
| Marker list is empty / multilingual unknown | English instruct model, default markers work |
| Weakly aligned or base checkpoint | Strong RLHF/DPO chat model |
| You need to **add** refusal ( Latent Guard / steer-to-safe ) | You only want to remove factory false-refusal |
| Adversarial prompts hide the template | Standard `harmful_behaviors` measure |

---

## Pairing

- Bake with T03 (projected + norm-preserving) after COSMIC picks `r`.
- Compare against [mean-difference-direction.md](mean-difference-direction.md) on the same prompts — if cosine(r_COSMIC, r_DIM) ≈ 1, keep DIM (simpler).
- Factory agents: still run [../instructions/eval-driven-workflow.md](../instructions/eval-driven-workflow.md). A pretty COSMIC score is not a `tool_call` gate.
