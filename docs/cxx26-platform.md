# C++26 abliteration platform

The handbook’s **technique helpers** — direction estimate, weight bake, inference ablation, marker scoring — ship as a **fully C++26** CLI. You do not need Python or `npm run abliterate:*` for those operators.

**Hold your hand:** `abliterate-cxx guide` · [cxx26-researcher-guide.md](cxx26-researcher-guide.md) · [../cxx/GETTING-STARTED.md](../cxx/GETTING-STARTED.md)

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

## GitHub Actions — every platform

Workflow: [../.github/workflows/cxx26-platform.yml](../.github/workflows/cxx26-platform.yml)

On every `cxx/**` change (and on `main`), Actions **builds, dialect-checks (`cplusplus=202400`), tests, self-checks twice, and packages** these targets:

| Artifact prefix | Runner | Compiler |
|-----------------|--------|----------|
| `linux-x64-gcc15` | `ubuntu-24.04` + `gcc:15` | GCC 15, `-std=c++26` |
| `linux-x64-clang20` | `ubuntu-24.04` | LLVM 20 clang++ |
| `linux-arm64-gcc15` | `ubuntu-24.04-arm` + `gcc:15` | GCC 15 |
| `linux-arm64-clang20` | `ubuntu-24.04-arm` | LLVM 20 |
| `windows-x64-clang` | `windows-latest` | LLVM 20 |
| `windows-x64-msvc` | `windows-latest` | MSVC `/std:c++latest` + `/Zc:__cplusplus` |
| `windows-arm64-msvc` | `windows-11-arm` | MSVC (experimental runner) |
| `macos-arm64-llvm` | `macos-latest` | Homebrew LLVM |
| `macos-x64-llvm` | `macos-latest` + `-arch x86_64` (Rosetta test) | Homebrew LLVM |

A target that cannot prove `cplusplus=202400` **fails**. There is no C++20 fallback.

**Download:** Actions run artifacts (30 days) and the rolling GitHub Release [`cxx-nightly`](https://github.com/adybag14-cyber/Abliteration/releases/tag/cxx-nightly) on every `main` push. Version tags `v*` publish a full release.

```bash
tar -xzf abliterate-cxx-linux-x64-gcc15.tar.gz
cd abliterate-cxx-linux-x64-gcc15
./abliterate-cxx guide
./abliterate-cxx doctor
./abliterate-cxx self-check
./abliterate-cxx demo
sha256sum -c SHA256SUMS   # from the release root
```

Hour 0 is `guide` → `doctor` → `self-check` → `demo`. Hour 0.5: `estimate dim` → `apply orba-directional` → `eval` toys → `recipes`.

Archives are named `abliterate-cxx-<os>-<arch>-<compiler>` so GCC and Clang never overwrite each other. `examples/` sits next to the binary (`doctor` finds them without `cd` if you keep that layout). The **MSVC** Windows nightly (`windows-x64-msvc`) is `/MT` (static CRT, no VC++ redistributable). The Clang Windows zip may still need the Universal CRT. `doctor` locates `examples/` from the real executable path.
