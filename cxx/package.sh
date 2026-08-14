#!/usr/bin/env bash
# POSIX packer used when Node is missing (gcc containers). Same layout as scripts/package-cxx.mjs
# usage: bash cxx/package.sh <build-dir> <triple> <compiler>
# compiler is required (CI matrix.name). Never fall back to triple.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BUILD="${1:?build dir}"
TRIPLE="${2:?triple}"
if [[ $# -lt 3 || -z "${3//[[:space:]]/}" ]]; then
  echo "package.sh: COMPILER (arg 3) required (non-empty). Do not fall back to triple." >&2
  echo "Example compiler names: windows-x64-msvc windows-x64-clang windows-arm64-msvc linux-x64-gcc15 linux-x64-clang20 linux-arm64-gcc15 linux-arm64-clang20 macos-arm64-llvm macos-x64-llvm" >&2
  exit 2
fi
COMPILER="$3"
DEST="$ROOT/cxx/dist/abliterate-cxx-$COMPILER"
mkdir -p "$DEST"
EXE=""
for c in "$BUILD/abliterate-cxx" "$BUILD/abliterate-cxx.exe" "$BUILD/Release/abliterate-cxx.exe"; do
  if [[ -f "$c" ]]; then EXE="$c"; break; fi
done
if [[ -z "$EXE" ]]; then
  echo "no abliterate-cxx in $BUILD" >&2
  exit 1
fi
if [[ "$EXE" == *.exe ]]; then
  cp "$EXE" "$DEST/abliterate-cxx.exe"
else
  cp "$EXE" "$DEST/abliterate-cxx"
  chmod +x "$DEST/abliterate-cxx"
fi
cp "$ROOT/cxx/README.md" "$DEST/README.md"
cp "$ROOT/cxx/GETTING-STARTED.md" "$DEST/GETTING-STARTED.md"
cp "$ROOT/cxx/INSTALL.txt" "$DEST/INSTALL.txt"
cp "$ROOT/LICENSE" "$DEST/LICENSE"
cp "$ROOT/docs/cxx26-platform.md" "$DEST/cxx26-platform.md"
cp "$ROOT/docs/cxx26-researcher-guide.md" "$DEST/cxx26-researcher-guide.md"
mkdir -p "$DEST/examples"
cp "$ROOT/cxx/examples/"* "$DEST/examples/"
{
  echo "package=abliterate-cxx-$COMPILER"
  echo "compiler=$COMPILER"
  echo "triple=$TRIPLE"
  echo "source=$EXE"
  echo "built=$(date -u +%Y-%m-%dT%H:%M:%SZ)"
} > "$DEST/BUILD.txt"
mkdir -p "$ROOT/cxx/dist"
tar -C "$ROOT/cxx/dist" -czf "$ROOT/cxx/dist/abliterate-cxx-$COMPILER.tar.gz" "abliterate-cxx-$COMPILER"
echo "wrote $ROOT/cxx/dist/abliterate-cxx-$COMPILER.tar.gz"
