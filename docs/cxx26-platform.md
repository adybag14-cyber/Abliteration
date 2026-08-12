# C++26 abliteration platform

The handbook’s **technique helpers** — direction estimate, weight bake, inference ablation, marker scoring — ship as a **fully C++26** CLI. You do not need Python or `npm run abliterate:*` for those operators.

| Piece | Path |
|-------|------|
| Operators (same functions tests + CLI call) | [../cxx/include/abliteration/ops.hpp](../cxx/include/abliteration/ops.hpp) |
| Marker eval | [../cxx/include/abliteration/eval.hpp](../cxx/include/abliteration/eval.hpp) |
| CLI | [../cxx/src/main.cpp](../cxx/src/main.cpp) |
| Unit tests | [../cxx/tests/test_ops.cpp](../cxx/tests/test_ops.cpp) |
| Build | [../cxx/CMakeLists.txt](../cxx/CMakeLists.txt) · `npm run cxx:build` |

**Dialect:** `-std=c++26` (ISO C++26). The headers `static_assert(__cplusplus >= 202400L)`. A C++17/20-only build is rejected.

## Build and run

```bash
npm run cxx:build
npm run cxx:test
npm run cxx:self-check
```

```text
cxx/build/abliterate-cxx self-check
cxx/build/abliterate-cxx estimate --mode projected --bad bad.txt --good good.txt --out r.txt
cxx/build/abliterate-cxx apply --mode orba-directional --weight W.txt --direction r.txt --out W2.txt
cxx/build/abliterate-cxx hook --h h.txt --direction r.txt
cxx/build/abliterate-cxx eval --jsonl generations.jsonl
```

Matrix files: first line `rows cols`, then row-major floats.

## What this is (and is not)

**Is:** the student/researcher path for DIM / projected / COSMIC-score / SVD estimate, Arditi / ORBA-directional / Householder / subspace bake, residual hook math, and JSONL refusal-rate scoring.

**Is not:** Heretic Optuna, Hugging Face checkpoint load, GPU measure, or Ralph/Node fetch. Those stay in their own tools (see [complete-curriculum.md](complete-curriculum.md)).

Python twins under `scripts/` remain for notebooks; they are **not** required for the operators above.

Cookbook: [../instructions/method-cookbook.md](../instructions/method-cookbook.md) §0.
