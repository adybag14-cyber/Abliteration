# abliterate-cxx — C++26 technique platform

ISO **C++26** CLI for the handbook’s core operators. This is the helper path for students and researchers who want estimate / bake / hook / eval **without Python**.

Requires a C++26 compiler (`-std=c++26`). The release matrix covers GCC 16.2, Clang/LLVM 22 on Linux/Windows, LLVM 23 on macOS, and MSVC 14.51; older GCC 15 and Clang 20 builds are no longer release targets.

## Memory-safety contract

The CLI validates dimensions, shape products, ranks, edit strengths, finite numbers, file sizes, line sizes, and JSONL record counts **before** allocation or indexing. Matrix storage is capped at 64 Mi elements / 512 MiB of text input, evaluation input at 1,000,000 records with 1 MiB per line, and SVD feature width at 512. `abliterate-cxx limits` prints the executable contract.

Bounds-checked access, owned environment strings, guarded arithmetic, deterministic error exits, stack protection, control-flow protection on MSVC, FORTIFY/RELRO on supported Linux builds, and a Clang 22 ASan+UBSan hostile-input lane form the release baseline. These controls reduce risk; they are not a formal proof of memory safety. Report suspected bypasses privately through [SECURITY.md](../SECURITY.md).

```bash
# from repo root
npm run cxx:build
npm run cxx:test
npm run cxx:self-check
```

Or:

```bash
cmake -S cxx -B cxx/build -DCMAKE_CXX_COMPILER=g++
cmake --build cxx/build
./cxx/build/abliterate-cxx self-check
./cxx/build/abliterate-cxx-tests
```

**First hour:** Hour 0 is `abliterate-cxx guide` → `doctor` → `limits` → `self-check` → `demo`. Hour 0.5: `estimate dim` → `apply orba-directional` → `eval` toys → `recipes`. Walkthrough: [GETTING-STARTED.md](GETTING-STARTED.md) · [docs/cxx26-researcher-guide.md](../docs/cxx26-researcher-guide.md)

## Subcommands

| Command | Operator |
|---------|----------|
| `guide` / `doctor` / `demo` / `recipes` / `why <mode>` | hand-holding UX |
| `self-check` | planted-direction + bake + hook + marker eval |
| `estimate --mode dim\|projected\|cosmic\|svd` | refusal direction |
| `apply --mode arditi\|orba-directional\|orba-householder\|subspace` | weight wipe |
| `hook --h H.txt --direction r.txt` | inference residual ablation |
| `eval --jsonl generations.jsonl` | marker refusal rate |

Matrix files: first line `rows cols`, then row-major floats.

Python `scripts/abliterate:*` remain as an optional twin. The operators live in `cxx/include/abliteration/ops.hpp` — tests and the CLI call the same functions.

Prebuilt binaries for Linux (x64/arm64), Windows (x64/arm64), and macOS (arm64/x64) come from GitHub Actions: [cxx-nightly release](https://github.com/adybag14-cyber/Abliteration/releases/tag/cxx-nightly) · workflow [cxx26-platform.yml](../.github/workflows/cxx26-platform.yml).

See [../docs/cxx26-platform.md](../docs/cxx26-platform.md).
