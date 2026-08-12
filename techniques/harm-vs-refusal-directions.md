# T39 — Harmfulness and refusal are different directions

Zhao, Huang, Wu, Bau, Shi (NeurIPS 2025): [LLMs Encode Harmfulness and Refusal Separately](https://arxiv.org/abs/2507.11878). Code: [CHATS-lab/LLMs_Encode_Harmfulness_Refusal_Separately](https://github.com/CHATS-lab/LLMs_Encode_Harmfulness_Refusal_Separately).

**One sentence:** the model can **believe** a prompt is harmful along one axis and **emit a refusal** along another. Abliterating only `r_refuse` does not flip the harm judgment; steering `r_harm` can make a benign prompt look harmful without the usual refusal template.

**Token positions (Zhao):** harm and refusal are **separate concepts at different tokens**, not a proof that the two vectors are orthogonal. Harmfulness clusters at `t_inst` (last token of the user instruction). Refusal clusters at `t_post-inst` (last token of the full chat-template sequence, after post-instruction markers). Distinct ≠ orthogonal: Zhao report low cosine on some models (e.g. ~0.1 on Llama-2) but do **not** establish `r_harm ⊥ r_refuse`.

---

## Why factory / pentest people should care

| Goal | Axis to touch |
|------|----------------|
| Stop false-refusing `wmic` / lab `nmap` | **False-refusal** / over-refusal (T38), not “delete all harm” |
| Understand leftover “I shouldn’t” after Heretic | Measure `r_harm` vs `r_refuse` cosine |
| Runtime filter after surgery | **Latent Guard** — threshold on `h · r_harm` (paper: competitive with Llama Guard 3 8B in their tests) |
| Interpret a jailbreak | Many jailbreaks suppress `r_refuse` while `r_harm` stays high |

If you flatten **both** axes with a wide multi-D wipe, you lose the cheap intrinsic detector the paper recommends keeping.

---

## Causal picture (from the paper)

- Steer **+r_harm** (extracted at `t_inst`) → model **reinterprets** harmless instructions as harmful.
- Steer **+r_refuse** (extracted at `t_post-inst`) → model **says no** without changing the harm judgment as cleanly.
- Adversarial finetunes that “accept harmful” barely move internal harmfulness.

So “uncensored SFT” and “abliteration” are not the same intervention on the same feature.

---

## Practice in this handbook

1. Estimate two DIMs: (a) harmful vs harmless **safety** set, (b) **false-refusal** vs should-comply factory set ([false-refusal-vector-ablation.md](false-refusal-vector-ablation.md) T38).
2. Report `cos(r_safety, r_factory)`. If they are aligned, one projected pass is enough. If they are ~orthogonal, **ablate factory only**.
3. Optional: keep `r_harm` for [../scripts/hardware-tool-gate.py](../scripts/hardware-tool-gate.py)-style policy — the gate is lexical; Latent Guard is activation-space.

Do not ship a public “harmfulness jailbreak” recipe. The point of T39 here is **eval literacy**: measure both axes; do not flatten harm detection just to stop factory over-refusal (that edit is T38).

---

## See also

Zhang & Sun (AAAI-26): [Differentiated Directional Intervention](https://arxiv.org/abs/2511.06852). Independent split of **harm detection** vs **refusal execution**. Same handbook takeaway as Zhao: the two processes are distinct; do not treat a single DIM as both. Their attack framing is out of scope here.
