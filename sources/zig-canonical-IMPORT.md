# Canonical Zig compiler source

**Repository:** [github.com/adybag14-cyber/zig](https://github.com/adybag14-cyber/zig)

| Branch | Contents |
|--------|----------|
| `master` | Full Zig compiler + `lib/std` — mirrors [codeberg.org/ziglang/zig](https://codeberg.org/ziglang/zig) |
| `main` | GitHub mirror automation only |

## Local clone (not committed — ~22k files)

```bash
git clone --depth 1 --branch master https://github.com/adybag14-cyber/zig.git sources/zig-canonical
```

## Prebuilt binaries

GitHub Releases: `latest-master` (rolling) or `upstream-<shortsha>` (immutable per sync).

Targets built by CI: `x86_64-linux`, `aarch64-linux`, `x86_64-windows`, `aarch64-windows`, `x86_64-macos`, `aarch64-macos`.

## Syntax handbook

Manual 0.17 analysis: [../docs/tools/zig-canonical-syntax.md](../docs/tools/zig-canonical-syntax.md)

## Verify toolchain matches source

```bash
zig version
# Should match family of master, e.g. 0.17.0-dev.*
cd sources/zig-canonical && zig build -h
```