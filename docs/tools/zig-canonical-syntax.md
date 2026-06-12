# Zig canonical syntax — 0.17 (manual analysis)

**Canonical source:** [github.com/adybag14-cyber/zig/tree/master](https://github.com/adybag14-cyber/zig/tree/master)  
Mirrors upstream [codeberg.org/ziglang/zig](https://codeberg.org/ziglang/zig) `master` every 6h.  
**Automation branch:** `main` — GitHub Actions sync/build only (not compiler source).

Analyzed against tree at commit `dde807f` (2026-06-12) and local toolchain `0.17.0-dev.830+1f43e049d`.

> Last stable release: **0.16.0** ([release notes](https://ziglang.org/download/0.16.0/release-notes.html)).  
> Your `master` is **0.17.0 development** (`build.zig` sets `zig_version = .{ .major = 0, .minor = 17, .patch = 0 }`).

---

## Version alignment

| Artifact | Version / role |
|----------|----------------|
| `adybag14-cyber/zig` `master` | Compiler + `lib/std` source of truth |
| `adybag14-cyber/zig` `main` | Mirror CI, `latest-master` release assets |
| Local dev binary | `0.17.0-dev.830+1f43e049d` (match before shipping factory tools) |
| Handbook generator | `python scripts/generate-platform-examples.py` (regen Zig rows after bumps) |

Clone compiler source (large):

```bash
git clone --depth 1 --branch master https://github.com/adybag14-cyber/zig.git sources/zig-canonical
```

Prebuilt rolling builds: GitHub Releases tag `latest-master` on the same repo.

---

## Breaking migrations (0.14 → 0.16 → 0.17)

### Standard library namespace

| Old (≤0.15) | Current (`master` / 0.17) |
|-------------|------------------------------|
| `std.builtin` | `std.lang` — `std.builtin` deprecated, **removed after 0.17.0** |
| `builtin.subsystem` | `zig.Subsystem` / target options in `build.zig` |
| `std.fs` file I/O patterns | `std.Io` — files, net, process, time ([0.16 Io overhaul](https://ziglang.org/download/0.16.0/release-notes.html)) |
| `std.ArrayListUnmanaged` | `std.ArrayList(T) = .empty` + explicit `allocator` on mutating methods |
| `mem.indexOf` | `mem.find` / `mem.findScalar` |
| `@cImport({...})` in source | **`zig translate-c`** + `addTranslateC` / `createModule` in `build.zig` |
| `@Type(.EnumLiteral)` etc. | Individual builtins: `@TypeOf`, `@field`, etc. (0.16 split) |
| `pub fn main() !void` | `pub fn main(init: std.process.Init) !void` (0.17 template) |

### Atomics (`std.lang.AtomicOrder`)

Use **lowercase** enum tags (matches `lib/std/lang.zig` on `master`):

```zig
std.atomic.Value(u32).init(0);
// .load(.acquire)  .store(x, .release)  — not .Acquire / .Release
```

### `ArrayList` (0.17 init template)

```zig
var list: std.ArrayList(i32) = .empty;
defer list.deinit(allocator);
try list.append(allocator, 42);
```

Deprecated aliases in `std.zig`: `ArrayListUnmanaged`, old `ArrayListAligned` names — do not use in new code.

---

## `main` — canonical 0.17 pattern

From `lib/init/src/main.zig` on `master`:

```zig
const std = @import("std");
const Io = std.Io;

pub fn main(init: std.process.Init) !void {
    const arena = init.arena.allocator();
    const args = try init.minimal.args.toSlice(arena);
    const io = init.io;

    var stdout_buffer: [1024]u8 = undefined;
    var stdout_writer: Io.File.Writer = .init(.stdout(), io, &stdout_buffer);
    defer stdout_writer.interface.flush() catch {};

    try stdout_writer.interface.print("hello\n", .{});
}
```

Key points:

- **Arena** from `init.arena` for argv and short-lived allocations.
- **I/O** goes through `init.io`, not legacy `std.fs.cwd()` alone.
- **Stdout** uses `Io.File.Writer` + buffer + `flush`.
- Env vars are no longer global — access via `init` / `Io` (0.16+).

---

## `build.zig` — canonical 0.17 pattern

From `lib/init/build.zig`:

```zig
pub fn build(b: *std.Build) void {
    const target = b.standardTargetOptions(.{});
    const optimize = b.standardOptimizeOption(.{});

    const mod = b.addModule("mylib", .{
        .root_source_file = b.path("src/root.zig"),
        .target = target,
    });

    const exe = b.addExecutable(.{
        .name = "myapp",
        .root_module = b.createModule(.{
            .root_source_file = b.path("src/main.zig"),
            .target = target,
            .optimize = optimize,
            .imports = &.{
                .{ .name = "mylib", .module = mod },
            },
        }),
    });

    b.installArtifact(exe);

    const run_step = b.step("run", "Run the app");
    const run_cmd = b.addRunArtifact(exe);
    run_step.dependOn(&run_cmd.step);
    run_cmd.step.dependOn(b.getInstallStep());
    run_cmd.addPassthruArgs();

    const test_step = b.step("test", "Run tests");
    const exe_tests = b.addTest(.{ .root_module = exe.root_module });
    test_step.dependOn(&b.addRunArtifact(exe_tests).step);
}
```

| Old pattern | 0.17 canonical |
|-------------|----------------|
| `b.addExecutable(.{ .root_source_file = ... })` alone | `.root_module = b.createModule(.{ ... })` |
| `exe.install()` | `b.installArtifact(exe)` |
| `b.addRunCommand` for built binary | `b.addRunArtifact(exe)` |
| `addSharedLibrary` with single file | `addLibrary` / module graph |

### Windows overlay / factory EXE options

```zig
.root_module = b.createModule(.{
    .root_source_file = b.path("src/main.zig"),
    .target = target,
    .optimize = .ReleaseFast,
    .single_threaded = true,
    .strip = true,
    .sanitize_c = .full,  // was -fsanitize=address style flags
    .imports = &.{},
}),
```

Subsystem (GUI vs console) is set on the compile step / module for Windows — use `std.Build` Windows resource / subsystem APIs or `win32` metadata in `build.zig` (see your overlay projects).

---

## `build.zig.zon` — package manifest

```zig
.{
    .name = .my_package,           // enum literal, not string
    .version = "0.1.0",
    .fingerprint = 0x...,           // u64 hex — regenerate on fork
    .minimum_zig_version = "0.17.0",
    .dependencies = .{},
    .paths = .{ "build.zig", "build.zig.zon", "src" },
}
```

Fetch deps: `zig build --fetch` then offline `zig build`.

---

## CLI commands (verified on `master` + 0.17-dev)

```bash
zig version
zig env
zig targets
zig libc
zig init                          # scaffolds lib/init template
zig build                         # -Dtarget= -Doptimize=
zig build run -- arg1 arg2
zig build test --summary all
zig build --watch -fincremental   # compiler dev on zig repo
zig test src/main.zig
zig test lib/std/std.zig --zig-lib-dir lib --test-filter "json."
zig fmt src/
zig ast-check build.zig
zig translate-c header.h -target x86_64-windows-gnu
zig cc -target x86_64-windows-msvc --version
zig std                             # open std docs (release installs)
```

### Cross-compile targets (factory / overlay)

| Target | Use |
|--------|-----|
| `x86_64-windows-gnu` | MinGW, common for overlays (e.g. SPCX ticker) |
| `x86_64-windows-msvc` | MSVC ABI, Visual Studio link |
| `aarch64-windows-msvc` | ARM64 Windows |
| `x86_64-macos` / `aarch64-macos` | Bench tools |
| `x86_64-linux-gnu` | Kali / CyberGym docker |
| `native` | Host CPU features (`-Dcpu=native`) |

```bash
zig build -Dtarget=x86_64-windows-gnu -Doptimize=ReleaseFast
zig build -Dtarget=aarch64-macos -Doptimize=ReleaseSafe
zig build -Dcpu=baseline -Dsingle-threaded=true
```

### Compiler repo only (`adybag14-cyber/zig` source)

```bash
zig build test-std -Dno-matrix          # ~3 min native std tests
zig build test -Dskip-release           # faster CI subset
zig build docs                        # langref + std-docs
```

---

## C interop (post-0.16)

No `@cImport` in application `.zig` files. In `build.zig`:

```zig
const translate_c = b.addTranslateC(.{
    .root_source_file = b.path("vendor/foo.h"),
    .target = target,
});
const c_mod = translate_c.createModule();
// add c_mod to imports
```

CLI probe: `zig translate-c -target x86_64-windows-gnu foo.h`

---

## Testing & fuzz (0.17 template)

```zig
test "alloc" {
    const gpa = std.testing.allocator;
    var list: std.ArrayList(u8) = .empty;
    defer list.deinit(gpa);
    try list.append(gpa, 'x');
}

test "fuzz" {
    try std.testing.fuzz({}, myFuzzFn, .{});
}
```

Run fuzz: `zig build test --fuzz`

---

## Deprecated / wrong in old handbooks

Do **not** teach agents these for 0.17:

| Wrong | Right |
|-------|-------|
| `std.builtin.cpu` | `std.lang` / `@import("builtin")` for target only |
| `ArrayList.init(allocator)` | `ArrayList(T) = .empty` + `append(allocator, ...)` |
| `-Drelease=true` | `-Doptimize=ReleaseFast` (or ReleaseSafe/Small) |
| `-fsanitize=address` on CLI (app) | `.sanitize_c = .full` on module, or project option |
| `zig init-exe` | `zig init` (unified scaffold) |
| `GenericReader` / `FixedBufferStream` | `std.Io.Reader` / `std.Io.Writer` |
| `std.fs.cwd().openFile` alone | `Io.Dir` / `Io.File` with `io` from `Init` |

---

## Agent eval prompts (syntax-aware)

Use [../../data/eval/platform-eval-sample.jsonl](../../data/eval/platform-eval-sample.jsonl) and regenerate:

```bash
python scripts/generate-platform-examples.py
```

Example prompt aligned to 0.17:

```text
Scaffold a Windows overlay with zig init, set build.zig root_module for x86_64-windows-gnu
ReleaseFast, use pub fn main(init: std.process.Init), and zig build run.
```

---

## References in this repo

- [zig-tooling.md](zig-tooling.md) — command corpus
- [../../sources/zig-canonical/](../../sources/zig-canonical/) — local clone (gitignored)
- Upstream langref: `doc/langref.html` inside compiler tree or [ziglang.org/documentation/master](https://ziglang.org/documentation/master/)