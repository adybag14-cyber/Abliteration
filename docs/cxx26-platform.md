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

## Memory-safety and resource contract

`abliterate-cxx limits` is the machine-adjacent source of truth for pre-allocation ceilings. The parser rejects zero, negative, overflowing, non-finite, truncated, trailing, or oversized input; vector/matrix access is bounds checked; arithmetic accumulates in `double` and rejects non-finite results. CLI exceptions and allocation failures become stable nonzero exits instead of escaping the process boundary.

Release builds enable stack and link hardening appropriate to each platform. CI additionally compiles the hostile-input suites under Clang 22 AddressSanitizer and UndefinedBehaviorSanitizer. This is a defense-in-depth contract, not a claim that C++ has become memory-safe by construction; see [SECURITY.md](../SECURITY.md) for private reporting.

## Build and run

```bash
npm run cxx:build
npm run cxx:test
npm run cxx:self-check
```

```text
cxx/build/abliterate-cxx limits
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
| `linux-x64-gcc16` | `ubuntu-24.04` + `gcc:16.2` | GCC 16.2, `-std=c++26` |
| `linux-x64-clang22` | `ubuntu-24.04` | LLVM 22 clang++ |
| `linux-arm64-gcc16` | `ubuntu-24.04-arm` + `gcc:16.2` | GCC 16.2 |
| `linux-arm64-clang22` | `ubuntu-24.04-arm` | LLVM 22 |
| `windows-x64-clang22` | `windows-2025-vs2026` | SHA-256-verified, cached LLVM 22.1.8 archive + MSVC STL |
| `windows-x64-msvc` | `windows-2025-vs2026` | MSVC 14.51 `/std:c++latest` + `/Zc:__cplusplus` |
| `windows-arm64-msvc` | `windows-11-vs2026-arm` | MSVC 14.51 cross-targeting ARM64 (preview runner) |
| `macos-arm64-llvm` | `macos-latest` | Homebrew LLVM |
| `macos-x64-llvm` | `macos-latest` + `-arch x86_64` (Rosetta test) | Homebrew LLVM |

A target that cannot prove `cplusplus=202400` **fails**. There is no C++20 fallback.

**Download:** Actions run artifacts (30 days) and the rolling GitHub Release [`cxx-nightly`](https://github.com/adybag14-cyber/Abliteration/releases/tag/cxx-nightly) on every `main` push. Version tags `v*` publish a full release.

```text
SHA256SUMS is on the cxx-nightly release, not inside the archive.
Verify the download before you unpack (copy-ready sha256sum / shasum /
Get-FileHash blocks are in cxx/GETTING-STARTED.md and the Pages #lab workbench).

# Linux
mkdir abliterate-cxx-1.1.0 && tar -xzf abliterate-cxx-linux-x64-gcc16.tar.gz -C abliterate-cxx-1.1.0
cd abliterate-cxx-1.1.0

# macOS
mkdir abliterate-cxx-1.1.0 && tar -xzf abliterate-cxx-macos-arm64-llvm.tar.gz -C abliterate-cxx-1.1.0
cd abliterate-cxx-1.1.0

# Windows — use a clean destination; do not overwrite an existing lab
Expand-Archive -Path abliterate-cxx-windows-x64-msvc.zip -DestinationPath abliterate-cxx-1.1.0
Set-Location abliterate-cxx-1.1.0

# Windows — no dest: cd into the zip-stem folder
# (abliterate-cxx-windows-x64-msvc). The exe is immediately there.

./abliterate-cxx guide
./abliterate-cxx doctor
./abliterate-cxx limits
./abliterate-cxx self-check
./abliterate-cxx demo
```

Hour 0 is `guide` → `doctor` → `limits` → `self-check` → `demo`. Hour 0.5: `estimate dim` → `apply orba-directional` → `eval` toys → `recipes`.

Archives are named `abliterate-cxx-<os>-<arch>-<compiler>` so GCC and Clang never overwrite each other. `examples/` sits next to the binary (`doctor` finds them without `cd` if you keep that layout). The **MSVC** Windows nightly (`windows-x64-msvc`) is `/MT` (static CRT, no VC++ redistributable). The Clang Windows zip may still need the Universal CRT. `doctor` locates `examples/` from the real executable path.
