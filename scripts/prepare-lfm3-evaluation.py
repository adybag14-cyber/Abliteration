#!/usr/bin/env python3
"""Prepare hash-pinned benign cohorts without borrowing harmful target completions."""
from __future__ import annotations
import argparse
import csv
import hashlib
import io
import json
from pathlib import Path
import time
import urllib.request

from lfm3_evaluation import validate_protocol


def fetch(url: str, expected: str) -> bytes:
    if not url.startswith("https://"):
        raise ValueError("dataset sources must use HTTPS")
    for attempt in range(3):
        try:
            with urllib.request.urlopen(url, timeout=60) as response:
                if not response.geturl().startswith("https://"):
                    raise ValueError("dataset download downgraded HTTPS")
                data = response.read(8 * 1024**2 + 1)
            break
        except OSError:
            if attempt == 2:
                raise
            time.sleep(attempt + 1)
    if len(data) > 8 * 1024**2 or hashlib.sha256(data).hexdigest() != expected:
        raise ValueError("dataset size/hash differs from the pinned protocol")
    return data


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--lock", type=Path, default=Path("data/benchmarks/lfm3-benign.json"))
    parser.add_argument("--calibration", type=Path, default=Path("data/experiments/lfm3-calibration.jsonl"))
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    if args.output.exists():
        parser.error("output must be a new directory")
    lock = json.loads(args.lock.read_text(encoding="utf-8"))
    rows = [json.loads(s) for s in args.calibration.read_text(encoding="utf-8").splitlines() if s.strip()]
    sources = []
    for source in lock["sources"]:
        if source["id"] not in {"xstest_safe", "jbb_benign"}:
            raise ValueError("the executable protocol accepts benign cohorts only")
        payload = fetch(source["url"], source["sha256"])
        table = list(csv.DictReader(io.StringIO(payload.decode("utf-8-sig"))))
        if len(table) != source["source_rows"]:
            raise ValueError("source row count changed")
        selected = [r for r in table if all(r.get(k) == v for k, v in source["filter"].items())]
        if len(selected) != source["selected_rows"]:
            raise ValueError("selected benign cohort row count changed")
        for row in selected:
            rows.append({"id": source["id"] + ":" + row[source["id_column"]],
                         "dataset": source["id"], "split": "test", "expected": "comply",
                         "prompt": row[source["prompt_column"]]})
        sources.append({**source, "loaded_rows": len(selected)})
    validate_protocol(rows)
    args.output.mkdir(parents=True)
    protocol = "".join(json.dumps(r, ensure_ascii=False) + "\n" for r in rows)
    (args.output / "protocol.jsonl").write_text(protocol, encoding="utf-8", newline="\n")
    proof = {"sources": sources, "protocol_sha256": hashlib.sha256(protocol.encode()).hexdigest(),
             "calibration_sha256": hashlib.sha256(args.calibration.read_bytes()).hexdigest(),
             "n": len(rows), "test_rows": sum(r["split"] == "test" for r in rows),
             "harmful_prompts_executed": False, "jbb_target_column_used": False}
    (args.output / "protocol-lock.json").write_text(json.dumps(proof, indent=2) + "\n")
    print(json.dumps(proof, indent=2))


if __name__ == "__main__":
    main()
