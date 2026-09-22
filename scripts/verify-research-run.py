#!/usr/bin/env python3
"""Independently verify every exported checkpoint in a completed experiment."""
import argparse
import datetime
import importlib.util
import json
from pathlib import Path
from checkpoint_tools import sha256


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--run", type=Path, required=True)
    parser.add_argument("--base", type=Path, required=True)
    args = parser.parse_args()
    output = args.run / "verification.json"
    if output.exists(): parser.error("verification already exists; preserve that evidence")
    summary_file = args.run / "summary.json"
    summary = json.loads(summary_file.read_text(encoding="utf-8"))
    if summary.get("status") != "completed": raise ValueError("run is incomplete")
    spec = importlib.util.spec_from_file_location("selective_cli", Path(__file__).with_name("selective-checkpoint.py"))
    module = importlib.util.module_from_spec(spec); spec.loader.exec_module(module)
    result = {"verified_at_utc": datetime.datetime.now(datetime.timezone.utc).isoformat(), "summary_sha256": sha256(summary_file), "candidates": {}}
    for method in summary["results"]:
        if method == "baseline": continue
        verified = module.verify(args.base, args.run / method)
        result["candidates"][method] = verified
        print(json.dumps({"method": method, **verified}), flush=True)
    with output.open("x", encoding="utf-8") as handle:
        handle.write(json.dumps(result, indent=2) + "\n")


if __name__ == "__main__":
    main()
