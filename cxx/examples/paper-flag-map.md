# Paper → `abliterate-cxx` flag

| Year | Work | Command |
|------|------|---------|
| 2024 | Arditi 2406.11717 | `estimate --mode dim` then `apply --mode arditi` |
| 2024 | Labonne blog | same |
| 2025 | Lai projected | `estimate --mode projected` |
| 2025 | Lai / ORBA 2026 | `apply --mode orba-directional` (stable) or `orba-householder` (A/B) |
| 2025 | COSMIC 2506.00085 | `estimate --mode cosmic` (score + DIM `r`; not the full paper ID) |
| 2025 | TUM cones 2502.17420 | GPU RDO (not this SVD toy) |
| 2025 | False-refusal 2410.03415 | `w′ = w − λ v_true` — **not** raw factory DIM; see T38 |
| 2025 | Zhao 2507.11878 | two DIMs; do not wipe harm and refuse |
| 2026 | SOM 2511.08379 | `svd` here; SOM trainer = Abliterix |
| 2026 | QCRI 2602.02132 | leftovers = style; second pass / svd |
| 2026 | Young 2512.13655 | after this lab, pick Heretic vs ErisForge |
| 2026 | Petrov 2603.22061 | do not topic-match contrast sets |
| 2026 | Task over-refuse 2603.27518 | factory DIM ≠ global harm DIM |

`apply --mode projected` bakes the same as `arditi` — the projection happens at **estimate** time.
