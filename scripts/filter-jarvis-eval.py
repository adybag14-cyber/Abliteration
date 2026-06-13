#!/usr/bin/env python3
"""Export Jarvis eval_prompts.jsonl subsets (e.g. category=safe) for handbook eval."""
import argparse
import json
from pathlib import Path

DEFAULT_SRC = Path("sources/jarvis-pack/jarvis-tool-repair-pack/data/eval_prompts.jsonl")
DEFAULT_OUT = Path("data/eval/jarvis-safe-eval.jsonl")


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--src", type=Path, default=DEFAULT_SRC)
    p.add_argument("--out", type=Path, default=DEFAULT_OUT)
    p.add_argument("--category", default="safe", help="Filter by category field")
    p.add_argument("--expected", default=None, help="Optional expected field filter (e.g. allow_tool)")
    args = p.parse_args()

    if not args.src.is_file():
        raise SystemExit(f"Missing source: {args.src}")

    rows: list[dict] = []
    with args.src.open(encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            row = json.loads(line)
            if row.get("category") != args.category:
                continue
            if args.expected and row.get("expected") != args.expected:
                continue
            rows.append(row)

    args.out.parent.mkdir(parents=True, exist_ok=True)
    with args.out.open("w", encoding="utf-8") as f:
        for row in rows:
            f.write(json.dumps(row, ensure_ascii=False) + "\n")

    print(f"Wrote {len(rows)} rows → {args.out}")


if __name__ == "__main__":
    main()