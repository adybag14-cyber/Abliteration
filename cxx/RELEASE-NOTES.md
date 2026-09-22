# abliterate-cxx nightly

ISO C++26 lab for refusal-direction math. **No GPU, no Python** for the first hour.

## 1.2 selective research refresh

- The macOS release lanes use pinned-major Homebrew LLVM 23; Linux and Windows Clang lanes retain LLVM 22.
- Adds `select-layers --scores FILE --count K` with bounded, deterministic support selection and JSON output.
- Adds `apply --mode norm-preserving`: rank-one removal plus column-norm restoration, with erased-column rejection.
- Adds selective checkpoint planning/export/verification and selected-tensor SFT in the companion Python research toolkit.
- Includes a pinned MiniCPM5-1B researcher example, disjoint data splits, tensor/shard digests, and measured aggregate results.
- Preserves the original numerical modes and August research catalog; adds 14 primary references and an interactive shadcn/ui planner.
- C++ handles numerical operators and plans. Real checkpoint inference, training, and serialization require the documented Python runtime.

## 1.1 safety and toolchain refresh

- Certified release lanes now target GCC 16.2, LLVM/Clang 22 (including verified LLVM 22.1.8 on Windows), and MSVC 14.51 on the Visual Studio 2026 image.
- Dimensions, allocation products, ranks, edit strengths, finite values, matrix files, JSONL lines, and record counts fail closed before unsafe work begins.
- Bounds-checked tensor access and owned environment reads replace unchecked indexing and borrowed process-environment pointers at input boundaries.
- Every release build enables platform hardening; Clang 22 ASan+UBSan runs hostile parser/arithmetic tests before publishing.
- Release archives receive GitHub build-provenance attestations in addition to `SHA256SUMS`.

## 10 minutes

```text
abliterate-cxx guide
abliterate-cxx doctor
abliterate-cxx limits
abliterate-cxx self-check
abliterate-cxx demo
```

Hour 0.5 (after demo): `estimate dim` → `apply orba-directional` → `eval` toys → `recipes`.

Then open `GETTING-STARTED.md` in the archive (repo: [docs/cxx26-researcher-guide.md](https://github.com/adybag14-cyber/Abliteration/blob/main/docs/cxx26-researcher-guide.md)).

## Pick one archive (names do not collide)

| Archive | Who |
|---------|-----|
| [abliterate-cxx-linux-x64-gcc16.tar.gz](https://github.com/adybag14-cyber/Abliteration/releases/download/cxx-nightly/abliterate-cxx-linux-x64-gcc16.tar.gz) | Linux x86_64 (GCC 16.2 default) |
| [abliterate-cxx-linux-x64-clang22.tar.gz](https://github.com/adybag14-cyber/Abliteration/releases/download/cxx-nightly/abliterate-cxx-linux-x64-clang22.tar.gz) | Linux x86_64 Clang 22 |
| [abliterate-cxx-linux-arm64-gcc16.tar.gz](https://github.com/adybag14-cyber/Abliteration/releases/download/cxx-nightly/abliterate-cxx-linux-arm64-gcc16.tar.gz) | Linux aarch64 GCC 16.2 |
| [abliterate-cxx-linux-arm64-clang22.tar.gz](https://github.com/adybag14-cyber/Abliteration/releases/download/cxx-nightly/abliterate-cxx-linux-arm64-clang22.tar.gz) | Linux aarch64 Clang 22 |
| [abliterate-cxx-windows-x64-msvc.zip](https://github.com/adybag14-cyber/Abliteration/releases/download/cxx-nightly/abliterate-cxx-windows-x64-msvc.zip) | Windows x64 (default) |
| [abliterate-cxx-windows-x64-clang22.zip](https://github.com/adybag14-cyber/Abliteration/releases/download/cxx-nightly/abliterate-cxx-windows-x64-clang22.zip) | Windows x64 Clang 22 |
| [abliterate-cxx-windows-arm64-msvc.zip](https://github.com/adybag14-cyber/Abliteration/releases/download/cxx-nightly/abliterate-cxx-windows-arm64-msvc.zip) | Windows ARM64 |
| [abliterate-cxx-macos-arm64-llvm.tar.gz](https://github.com/adybag14-cyber/Abliteration/releases/download/cxx-nightly/abliterate-cxx-macos-arm64-llvm.tar.gz) | Apple Silicon |
| [abliterate-cxx-macos-x64-llvm.tar.gz](https://github.com/adybag14-cyber/Abliteration/releases/download/cxx-nightly/abliterate-cxx-macos-x64-llvm.tar.gz) | Intel Mac |

Verify with `SHA256SUMS` on the release. Each archive was **unpacked on the runner** and `guide` + `doctor` + `limits` + `self-check` + `demo` + estimate/apply/eval ran **outside the git checkout**. Release archives also carry GitHub artifact attestations.

`doctor` must print `cplusplus=202400`. After Hour 0, do Hour 0.5 (`estimate dim` → `apply orba-directional` → `eval` toys → `recipes`), then Heretic for a real model.

This is a **toy-matrix lab**, not a Heretic/GGUF substitute.
