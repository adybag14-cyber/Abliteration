#!/usr/bin/env python3
"""Verify local evidence and export aggregate LFM3 results without raw answers."""
from __future__ import annotations
import argparse
import hashlib
import json
from pathlib import Path
import re
import subprocess

from lfm3_evaluation import PROFILES, load_protocol, text_hash
from lfm3_report import verify_measurement
from model_lock import sha256, verify_files

ROOT = Path(__file__).resolve().parents[1]


def read_json(path):
    return json.loads(path.read_text(encoding="utf-8"))


def measurement_commit(source_hashes, git):
    package = ROOT / "PACKAGE-MANIFEST.json"
    if package.exists():
        manifest = read_json(package)
        if manifest.get("source_worktree_dirty") is not False:
            raise ValueError("a package from uncommitted source cannot supply an immutable source revision")
        available = {v["path"]: v["original_source_sha256"] for v in manifest["files"]}
        if any(available.get("scripts/" + name) != digest for name, digest in source_hashes.items()):
            raise ValueError("measurement sources differ from the packaged source revision")
        revision = manifest["source_commit"]
    else:
        revision = subprocess.check_output([git, "rev-parse", "HEAD"], cwd=ROOT, text=True).strip()
        for name, expected in source_hashes.items():
            content = subprocess.check_output([git, "show", f"{revision}:scripts/{name}"], cwd=ROOT)
            if hashlib.sha256(content).hexdigest() != expected:
                raise ValueError("commit the measured source bytes before exporting a reproducible report")
    if not re.fullmatch(r"[0-9a-f]{40}", revision):
        raise ValueError("measurement source revision must be an immutable Git commit")
    return revision


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--run", type=Path, required=True)
    p.add_argument("--protocol", type=Path, required=True)
    p.add_argument("--model", type=Path, required=True)
    p.add_argument("--output", type=Path, required=True)
    p.add_argument("--git-executable", default="git", help="Use git.exe for a Windows-created worktree accessed from WSL")
    args = p.parse_args()
    if args.output.exists():
        p.error("output must be a new file")
    identity = read_json(args.run / "identity.json")
    summary = read_json(args.run / "summary.json")
    selection = read_json(args.run / "selection-before-test.json")
    status = read_json(args.run / "status.json")["status"]
    model_lock = read_json(ROOT / "data/models/lfm3-1.7b.json")
    if identity["model"] != model_lock or (summary["model_id"], summary["revision"]) != (model_lock["model_id"], model_lock["revision"]):
        raise ValueError("model identity differs from the repository lock")
    files = verify_files(args.model, model_lock["files"])
    if files != read_json(args.model / "source-lock.json")["runtime_files_sha256"]:
        raise ValueError("downloaded runtime files changed")
    names = {"run-lfm3-evaluation.py", "lfm3_evaluation.py", "model_lock.py", "research_experiment.py"}
    if set(identity["source_sha256"]) != names:
        raise ValueError("unexpected measurement source file set")
    source_hashes = {name: sha256(ROOT / "scripts" / name) for name in sorted(names)}
    if source_hashes != identity["source_sha256"] or source_hashes != summary["source_sha256"]:
        raise ValueError("measurement source code differs from the current source")
    source_commit = measurement_commit(source_hashes, args.git_executable)
    protocol = load_protocol(args.protocol)
    prepared = read_json(args.protocol.with_name("protocol-lock.json"))
    if prepared != identity["protocol"] or prepared["protocol_sha256"] != sha256(args.protocol):
        raise ValueError("protocol manifest or contents changed")
    pinned_sources = read_json(ROOT / "data/benchmarks/lfm3-benign.json")["sources"]
    if prepared["sources"] != [{**s, "loaded_rows": s["selected_rows"]} for s in pinned_sources]:
        raise ValueError("benchmark sources differ from the repository pins")
    if prepared["calibration_sha256"] != sha256(ROOT / "data/experiments/lfm3-calibration.jsonl"):
        raise ValueError("calibration prompts changed")
    if selection["profiles_sha256"] != text_hash(json.dumps(PROFILES, sort_keys=True)):
        raise ValueError("selection profile digest changed")
    response_path = args.run / "responses.jsonl"
    if response_path.stat().st_size > 64 * 1024**2 or sha256(response_path) != summary["responses_sha256"]:
        raise ValueError("response file exceeds the bound or has changed")
    responses = [json.loads(line) for line in response_path.read_text(encoding="utf-8").splitlines() if line.strip()]
    verified = verify_measurement(protocol, identity, summary, responses, selection, status)
    public = {**summary, "status": status, "run_started_at": identity["started_at"],
              "measurement_source_commit": source_commit,
              "seed": identity["seed"], "protocol": prepared, "profiles": PROFILES,
              "model_files_sha256": files, "verification": verified,
              "summary_sha256": sha256(args.run / "summary.json"),
              "selection_sha256": sha256(args.run / "selection-before-test.json"),
              "deployment_certified": False,
              "limitations": ["Lexical marker hits are not adjudicated refusals or attack success.",
                              "No harmful-request benchmark score or safety-preservation claim was measured.",
                              "No weights were trained, projected, ablated, merged or quantized.",
                              "A zero observed rate still has a nonzero confidence bound.",
                              "GPU/runtime/batch differences can change generated text despite a fixed seed."]}
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(public, indent=2) + "\n", encoding="utf-8", newline="\n")
    print(json.dumps({"output": str(args.output), "status": status, "verification": verified}))


if __name__ == "__main__":
    main()
