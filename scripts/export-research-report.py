#!/usr/bin/env python3
"""Publish aggregate research evidence without raw responses or workstation paths."""
import argparse
import json
from pathlib import Path
from checkpoint_tools import sha256


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--summary", type=Path, required=True)
    p.add_argument("--output", type=Path, required=True)
    args = p.parse_args()
    summary = json.loads(args.summary.read_text(encoding="utf-8"))
    if summary.get("status") != "completed":
        raise ValueError("only completed runs can be exported")
    identity = summary["identity"]
    verification_path = args.summary.parent / "verification.json"
    verification = json.loads(verification_path.read_text(encoding="utf-8")) if verification_path.exists() else None
    if verification and verification["summary_sha256"] != sha256(args.summary):
        raise ValueError("verification does not belong to this summary")
    report = {"schema_version": 1, "run_date": "2026-09-22", "status": "completed", "model_id": identity["model"]["lock"]["model_id"], "revision": identity["model"]["lock"]["revision"], "source_shards": identity["model"]["shards"], "protocol_sha256": identity["protocol_sha256"], "source_sha256": identity.get("source_sha256", {}), "run_summary_sha256": sha256(args.summary), "runtime": {k: identity[k] for k in ["torch", "transformers", "python", "device", "seed"]}, "decoding": identity["decoding"], "alpha": identity["alpha"], "selection_rule": identity["selection_rule"], "elapsed_seconds": summary["elapsed_seconds"], "metric_label": "lexical refusal-marker rate in a bounded generation window", "deployment_certified": False, "results": {}, "limitations": summary["limitations"]}
    report["independent_checkpoint_verification"] = verification
    for name, result in summary["results"].items():
        report["results"][name] = {k: result[k] for k in ["cohorts", "mean_benign_next_token_kl", "edit", "training"] if k in result}
        report["results"][name]["response_records_sha256"] = sha256(args.summary.parent / f"{name}-responses.jsonl")
        if name != "baseline":
            report["results"][name]["edit_manifest_sha256"] = sha256(args.summary.parent / name / "edit-manifest.json")
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"output": str(args.output), "methods": list(report["results"]), "max_new_tokens": report["decoding"]["max_new_tokens"]}))


if __name__ == "__main__":
    main()
