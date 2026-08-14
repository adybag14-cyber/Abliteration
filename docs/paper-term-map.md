# Paper term → chapter

Type the word from the paper. Open one chapter. Authorized factory QA / research only.

| You read | Paper | Open | Lab command / next |
|----------|-------|------|--------------------|
| **DIM** / mean-difference | Arditi et al. 2024, 2406.11717 | [techniques/mean-difference-direction.md](../techniques/mean-difference-direction.md) | `abliterate-cxx estimate --mode dim` |
| **projected** / norm-preserving | Lai 2025 | [techniques/projected-norm-preserving-abliteration.md](../techniques/projected-norm-preserving-abliteration.md) | `--mode projected` · Heretic `orthogonalize_direction = true` |
| **ORBA** / Householder | Lai 2026 | [techniques/orba-orthogonal-reflection.md](../techniques/orba-orthogonal-reflection.md) · [methods/orba-pipeline.md](../methods/orba-pipeline.md) | `--mode orba-directional` (not a full flip) |
| **COSMIC** | Siu et al. ACL 2025, 2506.00085 | [techniques/cosmic-refusal-direction.md](../techniques/cosmic-refusal-direction.md) · [methods/cosmic-direction-id.md](../methods/cosmic-direction-id.md) | `--mode cosmic` (score + DIM `r`; not full paper ID) |
| **false-refusal** / over-refusal | Wang et al. 2410.03415 · T38 | [techniques/false-refusal-vector-ablation.md](../techniques/false-refusal-vector-ablation.md) | Paper: `w′ ← w − λ v` against **true** refusal (need a harmful set for `v`). Not factory DIM, not T03 (project off `g`). Table 1: raw `w` lifts harmful **and** XSTest. C++: two `estimate --mode dim`, form `w′` offline — no Wang flag. Maskey 2603.27518: one factory vector may still be incomplete |
| **harm ≠ refusal** | Zhao et al. 2507.11878 · T39 | [techniques/harm-vs-refusal-directions.md](../techniques/harm-vs-refusal-directions.md) | Analysis / Latent Guard; do not flatten both axes |
| **Heretic** | p-e-w/heretic | [instructions/heretic-workflow.md](../instructions/heretic-workflow.md) | Day 1 real checkpoint |
| **C++26 lab** | this repo | [cxx26-researcher-guide.md](cxx26-researcher-guide.md) | `guide` → `doctor` → `demo` on [cxx-nightly](https://github.com/adybag14-cyber/Abliteration/releases/tag/cxx-nightly) |
| **eval gates** | handbook contract | [evaluation.md](evaluation.md) · [instructions/eval-driven-workflow.md](../instructions/eval-driven-workflow.md) | Empty / mute ≠ safety. Keyword judge ≠ deploy truth. |

T-IDs in this table follow [advanced-techniques-catalog.md](advanced-techniques-catalog.md) (T34 ORBA, T38 false-refusal, T39 harm≠refusal).
