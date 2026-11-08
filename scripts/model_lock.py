"""Verify explicitly pinned runtime files before loading a model or custom code."""
from __future__ import annotations

import hashlib
import re
from pathlib import Path


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(4 * 1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def validate_file_manifest(files: dict) -> None:
    if not isinstance(files, dict) or not 1 <= len(files) <= 128:
        raise ValueError("model file manifest must contain 1..128 files")
    folded = set()
    for name, expected in files.items():
        if not isinstance(name, str) or not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9_.-]{0,127}", name):
            raise ValueError("model file names must be plain, bounded basenames")
        if name.casefold() in folded:
            raise ValueError("model file names alias on Windows")
        folded.add(name.casefold())
        if not isinstance(expected, dict) or set(expected) != {"sha256", "bytes"}:
            raise ValueError("each model file needs its exact SHA-256 and size")
        if not re.fullmatch(r"[0-9a-f]{64}", expected.get("sha256", "")):
            raise ValueError("invalid model file SHA-256")
        size = expected["bytes"]
        if type(size) is not int or not 0 < size <= 32 * 1024**3:
            raise ValueError("model file size is outside the supported range")


def verify_files(directory: Path, files: dict) -> dict[str, str]:
    validate_file_manifest(files)
    result = {}
    for name, expected in files.items():
        path = directory / name
        if path.is_symlink() or not path.is_file() or path.stat().st_size != expected["bytes"]:
            raise ValueError(f"missing, linked or wrong-sized model file: {name}")
        digest = sha256(path)
        if digest != expected["sha256"]:
            raise ValueError(f"model file SHA-256 mismatch: {name}")
        result[name] = digest
    return result
