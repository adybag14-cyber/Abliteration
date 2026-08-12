#!/usr/bin/env bash
# POSIX packer used when Node is missing (gcc containers). Same layout as scripts/package-cxx.mjs
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BUILD="${1:?build dir}"
TRIPLE="${2:?triple}"
COMPILER="${3:-}"
DEST="$ROOT/cxx/dist/abliterate-cxx-$TRIPLE"
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
cp "$ROOT/LICENSE" "$DEST/LICENSE"
cp "$ROOT/docs/cxx26-platform.md" "$DEST/cxx26-platform.md"
{
  echo "package=abliterate-cxx-$TRIPLE"
  echo "compiler=$COMPILER"
  echo "triple=$TRIPLE"
  echo "source=$EXE"
  echo "built=$(date -u +%Y-%m-%dT%H:%M:%SZ)"
} > "$DEST/BUILD.txt"
mkdir -p "$ROOT/cxx/dist"
tar -C "$ROOT/cxx/dist" -czf "$ROOT/cxx/dist/abliterate-cxx-$TRIPLE.tar.gz" "abliterate-cxx-$TRIPLE"
echo "wrote $ROOT/cxx/dist/abliterate-cxx-$TRIPLE.tar.gz"
