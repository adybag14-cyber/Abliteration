# T35 — SOM multi-directional refusal (AAAI 2026)

Piras et al.: [SOM Directions are Better than One](https://arxiv.org/abs/2511.08379) (arXiv:2511.08379, AAAI 2026).

**One sentence:** train a **Self-Organizing Map** on harmful residual vectors; each neuron minus the harmless centroid is a refusal direction. Ablating the set beats single DIM in their experiments.

---

## Why SOM, not just PCA

PCA finds **orthogonal** variance axes. Refusal may be a **curved manifold** (see TUM concept cones). A SOM places a grid of prototype neurons on that manifold. The paper proves SOMs **generalize difference-in-means**: a one-neuron SOM recovers DIM.

```text
# harmful activations H_bad at hook layer ℓ
train SOM prototypes {m_i} on H_bad
c_good = mean(H_good)
r_i = normalize(m_i − c_good)
ablate span{r_1, …, r_k}   # or top-k by separation
```

Pairwise cosine among `r_i` is often **high** (they all sit near global DIM). The win is covering **spread along the manifold**, not finding exotic orthogonal concepts.

---

## When to use

| Use SOM | Skip |
|---------|------|
| Single Heretic pass leaves category-specific refusals | First run on a new 4B/8B |
| You already cache residuals (FailSpy / measure.py) | No GPU for a second analysis pass |
| Research comparison vs jailbreak baselines | Production deadline — use Heretic + domain `[bad_prompts]` first |

QCRI 2026 still applies: many directions may be **style**, one **volume** knob. SOM is worth it when leftovers are **mechanistically different** (factory vs SafetyCore), not when you just want a louder knob (that is `α` / `max_weight`).

---

## Practical recipe (research)

1. Cache last-token residuals on harmful + harmless sets (same hook as DIM).
2. Fit a small SOM (`grid=3×3` or `4×4`) on harmful rows only.
3. Build `r_i`, drop near-duplicates (`cos > 0.95`).
4. Ablate k=3–6 with [../methods/multi-direction-ablation.md](../methods/multi-direction-ablation.md) or `--mode subspace`.
5. Eval factory JSONL **and** XSTest — SOM can increase over-refusal if neurons sit on the over-refusal tail.

Related multi-D CLI: [senbonzakura](https://github.com/elementmerc/senbonzakura).
