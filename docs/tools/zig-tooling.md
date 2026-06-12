# Zig tooling — extensive reference

Systems programming for **Windows overlays**, **cross-platform factory tools**, **firmware test harnesses**, and **CyberGym native PoCs**. **1,099 generated commands** → [../../data/examples/zig-commands.jsonl](../../data/examples/zig-commands.jsonl)

**Canonical 0.17 syntax (manual analysis):** [zig-canonical-syntax.md](zig-canonical-syntax.md)  
**Compiler source:** [github.com/adybag14-cyber/zig/tree/master](https://github.com/adybag14-cyber/zig/tree/master) · [sources/zig-canonical-IMPORT.md](../../sources/zig-canonical-IMPORT.md)

Official: [ziglang.org](https://ziglang.org/) · stable **0.16.0** · dev **0.17** on your `master`

---

## Toolchain introspection

```bash
zig version
zig env
zig targets
zig libc
zig init                       # 0.17 scaffold — see zig-canonical-syntax.md
zig build --help
zig build --fetch
zig ast-check build.zig
zig fmt --check src/
```

---

## Build & test

```bash
zig build
zig build -Dtarget=x86_64-windows-gnu -Doptimize=ReleaseFast
zig build run -- arg1
zig build test --summary all
zig build test --fuzz
zig build install
zig test src/main.zig
zig test src/ --test-filter hardware
```

Entry point is **`pub fn main(init: std.process.Init) !void`** on 0.17 — not bare `main()`.

**70+ test filters** in corpus: `hardware`, `firmware`, `usb`, `overlay`, `factory`, etc.

---

## Cross-compilation matrix

| Target | Use case |
|--------|----------|
| `x86_64-windows-gnu` | MinGW overlay / ticker (factory PCs) |
| `x86_64-windows-msvc` | MSVC-linked Windows binaries |
| `aarch64-windows-msvc` | ARM64 Windows |
| `x86_64-macos` | Intel Mac bench tools |
| `aarch64-macos` | Apple Silicon native |
| `x86_64-linux-gnu` | Kali / factory Linux bench |
| `aarch64-linux-gnu` | ARM64 Linux |
| `x86_64-linux-musl` | Static portable tools |
| `wasm32-wasi` | Sandbox test harness |
| `wasm32-freestanding` | Embedded experiments |
| `riscv64-linux-gnu` | RISC-V factory boards |
| `native` | Host-optimized local build |

Generated: **every target × 4 optimize modes** + flag combinations.

```bash
zig build -Dtarget=x86_64-windows-gnu -Doptimize=ReleaseFast
zig build -Dtarget=aarch64-macos -Doptimize=ReleaseSafe
zig build test -Dtarget=x86_64-linux-gnu -Doptimize=Debug
```

---

## Build flags (factory / security)

```bash
zig build -Dstrip=true
zig build -Dsingle-threaded=true
zig build -Dcpu=baseline
zig build -Dcpu=native
```

Sanitizers (0.17): set on **module** in `build.zig`, not legacy `-fsanitize=` CLI:

```zig
.sanitize_c = .full,      // .off / .trap / .full
.sanitize_thread = true,
```

---

## C/C++ interoperability (Windows resources)

```bash
zig cc --version
zig c++ --version
zig cc -target x86_64-windows-msvc -c driver.c
zig windres --help                # .rc resources
zig dlltool --help                # import libs
zig lib file.o -o out.lib
zig objcopy --help
```

---

## Windows overlay pattern (e.g. SPCX ticker)

```bash
zig build -Dtarget=x86_64-windows-gnu -Doptimize=ReleaseFast
zig build run -Dtarget=x86_64-windows
# build.zig: exe.linkLibC(), addWin32Resources(), subsystem WINDOWS
```

Typical `build.zig` options agents should know:

| Flag | Meaning |
|------|---------|
| `-Dtarget=` | Cross-compile triple |
| `-Doptimize=` | Debug / ReleaseSafe / ReleaseFast / ReleaseSmall |
| `-Dcpu=` | `baseline`, `native`, or specific |
| `-Dstrip=` | Strip debug symbols |
| `.sanitize_c = .full` | ASAN/UBSAN on module (see zig-advanced-techniques.md) |

---

## macOS builds

```bash
zig build -Dtarget=aarch64-macos -Doptimize=ReleaseSafe
zig build -Dtarget=x86_64-macos -Doptimize=ReleaseFast
zig build -Dtarget=aarch64-macos -Doptimize=ReleaseSmall
```

---

## Security research workflow

**Advanced patterns:** [zig-advanced-techniques.md](zig-advanced-techniques.md) · snippets [../../data/examples/zig-code-snippets.jsonl](../../data/examples/zig-code-snippets.jsonl)

```text
1. zig init / use existing PoC repo
2. build.zig: .sanitize_c = .full on root module, -Doptimize=Debug
3. zig build test --test-filter crash
4. zig build test --fuzz
5. zig build -Dtarget=x86_64-linux-gnu for CyberGym docker
6. Ship ReleaseSafe artifact to factory bench
```

---

## Dependencies

```bash
zig fetch --save git+https://github.com/ziglang/zig#master
# build.zig.zon: .dependencies, .paths
```

---

## Agent eval

- Prompts: [../../data/examples/zig-prompts.jsonl](../../data/examples/zig-prompts.jsonl) (6,594)
- Cross-platform factory: combine with [windows-tooling.md](windows-tooling.md) deploy step

Regenerate all platform examples:

```bash
python scripts/generate-platform-examples.py
```