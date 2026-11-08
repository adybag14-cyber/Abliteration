#!/usr/bin/env python3
"""Download the immutable model revision declared in a researcher lock file."""
import argparse
import json
import os
import re
import sys
from pathlib import Path


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--lock", type=Path, default=Path("data/models/minicpm5-1b.json"))
    p.add_argument("--output", type=Path, required=True)
    args = p.parse_args()
    lock = json.loads(args.lock.read_text(encoding="utf-8"))
    if not re.fullmatch(r"[0-9a-f]{40}", lock["revision"]):
        raise ValueError("model revision must be an immutable commit SHA")
    from model_lock import validate_file_manifest, verify_files
    files = lock.get("files")
    if files is not None:
        validate_file_manifest(files)
    from huggingface_hub import snapshot_download
    print(json.dumps({"state": "downloading", "pid": os.getpid(), "executable": sys.executable, "model": lock["model_id"], "revision": lock["revision"]}), flush=True)
    snapshot_download(lock["model_id"], revision=lock["revision"], local_dir=args.output,
                      allow_patterns=list(files) if files is not None else ["*.safetensors", "*.json", "*.jinja", "*.model", "*.txt"],
                      max_workers=2)
    runtime_files = verify_files(args.output, files) if files is not None else {}
    from checkpoint_tools import inventory, sha256
    info = inventory(args.output)
    config = json.loads((args.output / "config.json").read_text(encoding="utf-8"))
    if config.get("architectures") != [lock["architecture"]] or config.get("num_hidden_layers") != lock["layers"]:
        raise ValueError("downloaded model architecture disagrees with lock")
    if "model_type" in lock and config.get("model_type") != lock["model_type"]:
        raise ValueError("downloaded model type disagrees with lock")
    result = {"lock": lock, "shards": {s: sha256(args.output / s) for s in info["shards"]}, "total_parameters": info["total_parameters"]}
    if runtime_files:
        result["runtime_files_sha256"] = runtime_files
    if result["total_parameters"] != lock["parameters"]:
        raise ValueError("downloaded checkpoint parameter count disagrees with lock")
    (args.output / "source-lock.json").write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"state": "completed", "path": str(args.output.resolve()), **result}), flush=True)


if __name__ == "__main__":
    main()
