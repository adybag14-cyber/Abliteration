# abliterate-cxx nightly

ISO C++26 lab for refusal-direction math. **No GPU, no Python** for the first hour.

## 10 minutes

```text
abliterate-cxx guide
abliterate-cxx doctor
abliterate-cxx demo
```

Then open `GETTING-STARTED.md` in the archive (repo: [docs/cxx26-researcher-guide.md](https://github.com/adybag14-cyber/Abliteration/blob/main/docs/cxx26-researcher-guide.md)).

## Pick one archive (names do not collide)

| Archive | Who |
|---------|-----|
| [abliterate-cxx-linux-x64-gcc15.tar.gz](https://github.com/adybag14-cyber/Abliteration/releases/download/cxx-nightly/abliterate-cxx-linux-x64-gcc15.tar.gz) | Linux x86_64 (default) |
| [abliterate-cxx-linux-x64-clang20.tar.gz](https://github.com/adybag14-cyber/Abliteration/releases/download/cxx-nightly/abliterate-cxx-linux-x64-clang20.tar.gz) | Linux x86_64 Clang |
| [abliterate-cxx-linux-arm64-gcc15.tar.gz](https://github.com/adybag14-cyber/Abliteration/releases/download/cxx-nightly/abliterate-cxx-linux-arm64-gcc15.tar.gz) | Linux aarch64 |
| [abliterate-cxx-linux-arm64-clang20.tar.gz](https://github.com/adybag14-cyber/Abliteration/releases/download/cxx-nightly/abliterate-cxx-linux-arm64-clang20.tar.gz) | Linux aarch64 Clang |
| [abliterate-cxx-windows-x64-msvc.zip](https://github.com/adybag14-cyber/Abliteration/releases/download/cxx-nightly/abliterate-cxx-windows-x64-msvc.zip) | Windows x64 (default) |
| [abliterate-cxx-windows-x64-clang.zip](https://github.com/adybag14-cyber/Abliteration/releases/download/cxx-nightly/abliterate-cxx-windows-x64-clang.zip) | Windows x64 Clang |
| [abliterate-cxx-windows-arm64-msvc.zip](https://github.com/adybag14-cyber/Abliteration/releases/download/cxx-nightly/abliterate-cxx-windows-arm64-msvc.zip) | Windows ARM64 |
| [abliterate-cxx-macos-arm64-llvm.tar.gz](https://github.com/adybag14-cyber/Abliteration/releases/download/cxx-nightly/abliterate-cxx-macos-arm64-llvm.tar.gz) | Apple Silicon |
| [abliterate-cxx-macos-x64-llvm.tar.gz](https://github.com/adybag14-cyber/Abliteration/releases/download/cxx-nightly/abliterate-cxx-macos-x64-llvm.tar.gz) | Intel Mac |

Verify with `SHA256SUMS` on the release. Each archive was **unpacked on the runner** and `doctor` + `demo` + estimate/apply/eval ran **outside the git checkout**.

`doctor` must print `cplusplus=202400`. Next: `recipes`, then Heretic for a real model.

This is a **toy-matrix lab**, not a Heretic/GGUF substitute.
