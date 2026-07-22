#!/usr/bin/env python3
"""Create or verify content-addressed abliteration experiment manifests."""

from __future__ import annotations

import argparse
import hashlib
import importlib.metadata
import json
import os
import platform
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

SCHEMA_VERSION = 1
PACKAGES = ("torch", "transformers", "accelerate", "safetensors", "peft", "bitsandbytes", "heretic-llm")


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(4 * 1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def hash_path(path: Path) -> dict[str, Any]:
    if path.is_symlink():
        raise ValueError(f"refusing to hash symlink: {path}")
    if path.is_file():
        return {"kind": "file", "bytes": path.stat().st_size, "sha256": sha256_file(path)}
    if not path.is_dir():
        raise ValueError(f"path does not exist or is unsupported: {path}")

    files: list[dict[str, Any]] = []
    total_bytes = 0
    for child in sorted(path.rglob("*"), key=lambda item: item.as_posix()):
        if child.is_symlink():
            raise ValueError(f"refusing to hash symlink inside directory: {child}")
        if not child.is_file():
            continue
        relative = child.relative_to(path).as_posix()
        size = child.stat().st_size
        files.append({"path": relative, "bytes": size, "sha256": sha256_file(child)})
        total_bytes += size
    canonical = json.dumps(files, sort_keys=True, separators=(",", ":")).encode("utf-8")
    return {
        "kind": "directory",
        "files": len(files),
        "bytes": total_bytes,
        "sha256": hashlib.sha256(canonical).hexdigest(),
        "entries": files,
    }


def display_path(path: Path, root: Path) -> str:
    absolute = path.resolve()
    try:
        return absolute.relative_to(root).as_posix()
    except ValueError:
        return str(absolute)


def resolve_recorded_path(value: str, root: Path) -> Path:
    path = Path(value)
    return path if path.is_absolute() else root / path


def git_output(root: Path, *args: str) -> tuple[int, str]:
    completed = subprocess.run(
        ["git", "-C", str(root), *args],
        text=True,
        encoding="utf-8",
        errors="replace",
        stdout=subprocess.PIPE,
        stderr=subprocess.DEVNULL,
        check=False,
    )
    return completed.returncode, completed.stdout.strip()


def git_state(root: Path) -> dict[str, Any] | None:
    status, commit = git_output(root, "rev-parse", "HEAD")
    if status != 0:
        return None
    _, branch = git_output(root, "branch", "--show-current")
    _, porcelain = git_output(root, "status", "--porcelain=v1")
    dirty_entries = porcelain.splitlines() if porcelain else []
    return {"commit": commit, "branch": branch or None, "dirty": bool(dirty_entries), "dirty_entries": dirty_entries}


def package_versions() -> dict[str, str]:
    versions: dict[str, str] = {}
    for package in PACKAGES:
        try:
            versions[package] = importlib.metadata.version(package)
        except importlib.metadata.PackageNotFoundError:
            continue
    return versions


def parse_parameters(items: list[str]) -> dict[str, Any]:
    output: dict[str, Any] = {}
    for item in items:
        if "=" not in item:
            raise ValueError(f"parameter must be KEY=VALUE: {item!r}")
        key, raw = item.split("=", 1)
        key = key.strip()
        if not key or key in output:
            raise ValueError(f"parameter key is empty or repeated: {key!r}")
        try:
            output[key] = json.loads(raw)
        except json.JSONDecodeError:
            output[key] = raw
    return output


def make_entry(path: Path, root: Path, role: str) -> dict[str, Any]:
    return {"path": display_path(path, root), "role": role, **hash_path(path.resolve())}


def create_manifest(args: argparse.Namespace) -> int:
    root = args.root.resolve()
    if not root.is_dir():
        print(f"error: root is not a directory: {root}", file=sys.stderr)
        return 2
    try:
        parameters = parse_parameters(args.parameter)
        config = make_entry(args.config, root, "config") if args.config else None
        inputs = [make_entry(path, root, "input") for path in args.input]
        artifacts = [make_entry(path, root, "artifact") for path in args.artifact]
    except (OSError, ValueError) as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 2

    manifest = {
        "schema_version": SCHEMA_VERSION,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "root_hint": str(root),
        "model": {"id_or_path": args.base_model, "revision": args.revision},
        "method": {"name": args.method, "parameters": parameters},
        "config": config,
        "inputs": inputs,
        "artifacts": artifacts,
        "repository": git_state(root),
        "environment": {
            "python": sys.version.split()[0],
            "platform": platform.platform(),
            "packages": package_versions(),
        },
        "notes": args.note,
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8", newline="\n")
    print(json.dumps({"manifest": str(args.output), "inputs": len(inputs), "artifacts": len(artifacts), "repository": manifest["repository"]}, indent=2))
    return 0


def compare_hashes(expected: dict[str, Any], actual: dict[str, Any]) -> list[str]:
    errors: list[str] = []
    for field in ("kind", "bytes", "sha256"):
        if expected.get(field) != actual.get(field):
            errors.append(f"{field}: expected {expected.get(field)!r}, got {actual.get(field)!r}")
    if expected.get("kind") == "directory" and expected.get("entries") != actual.get("entries"):
        errors.append("directory entries changed")
    return errors


def verify_manifest(args: argparse.Namespace) -> int:
    try:
        manifest = json.loads(args.manifest.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        print(f"error: cannot read manifest: {exc}", file=sys.stderr)
        return 2
    if manifest.get("schema_version") != SCHEMA_VERSION:
        print(f"error: unsupported schema_version {manifest.get('schema_version')!r}", file=sys.stderr)
        return 2
    root = args.root.resolve()
    records = []
    if manifest.get("config"):
        records.append(manifest["config"])
    records.extend(manifest.get("inputs") or [])
    records.extend(manifest.get("artifacts") or [])

    failures: list[dict[str, Any]] = []
    for record in records:
        path = resolve_recorded_path(record["path"], root)
        try:
            actual = hash_path(path)
            errors = compare_hashes(record, actual)
        except (OSError, ValueError) as exc:
            errors = [str(exc)]
        if errors:
            failures.append({"path": record["path"], "errors": errors})

    git_failure = None
    if args.check_git and manifest.get("repository"):
        current = git_state(root)
        expected = manifest["repository"]
        if current is None or current.get("commit") != expected.get("commit") or current.get("dirty_entries") != expected.get("dirty_entries"):
            git_failure = {"expected": expected, "actual": current}
    report = {"manifest": str(args.manifest), "verified": len(records), "pass": not failures and git_failure is None, "failures": failures, "git_failure": git_failure}
    print(json.dumps(report, indent=2, ensure_ascii=False))
    return 0 if report["pass"] else 1


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    subparsers = parser.add_subparsers(dest="command", required=True)
    create = subparsers.add_parser("create", help="create a manifest after producing artifacts")
    create.add_argument("--output", type=Path, required=True)
    create.add_argument("--root", type=Path, default=Path.cwd())
    create.add_argument("--base-model", required=True)
    create.add_argument("--revision", required=True, help="immutable commit/revision, not main")
    create.add_argument("--method", required=True)
    create.add_argument("--config", type=Path)
    create.add_argument("--input", type=Path, action="append", default=[])
    create.add_argument("--artifact", type=Path, action="append", default=[])
    create.add_argument("--parameter", action="append", default=[], metavar="KEY=JSON_VALUE")
    create.add_argument("--note", action="append", default=[])
    create.set_defaults(function=create_manifest)

    verify = subparsers.add_parser("verify", help="rehash all recorded paths")
    verify.add_argument("manifest", type=Path)
    verify.add_argument("--root", type=Path, default=Path.cwd())
    verify.add_argument("--check-git", action="store_true")
    verify.set_defaults(function=verify_manifest)
    return parser


def main() -> int:
    args = build_parser().parse_args()
    return args.function(args)


if __name__ == "__main__":
    raise SystemExit(main())
