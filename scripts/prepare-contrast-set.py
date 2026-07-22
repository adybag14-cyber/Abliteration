#!/usr/bin/env python3
"""Audit and deterministically split JSONL contrast prompts for direction work."""

from __future__ import annotations

import argparse
import hashlib
import json
import sys
import unicodedata
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

VERSION = "1.0"
LABEL_ALIASES = {
    "bad": "bad",
    "refusal": "bad",
    "target": "bad",
    "harmful": "bad",
    "good": "good",
    "control": "good",
    "harmless": "good",
    "benign": "good",
}


def normalize_prompt(value: str) -> str:
    value = unicodedata.normalize("NFKC", value)
    return " ".join(value.split()).casefold()


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def stable_key(seed: str, row: dict[str, Any]) -> str:
    payload = f"{seed}\0{row['category']}\0{row['label']}\0{normalize_prompt(row['prompt'])}"
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


def load_rows(path: Path) -> tuple[list[dict[str, Any]], list[str], list[dict[str, Any]]]:
    rows: list[dict[str, Any]] = []
    errors: list[str] = []
    duplicates: list[dict[str, Any]] = []
    seen: dict[str, dict[str, Any]] = {}

    with path.open("r", encoding="utf-8-sig") as handle:
        for line_number, raw in enumerate(handle, 1):
            if not raw.strip():
                continue
            try:
                item = json.loads(raw)
            except json.JSONDecodeError as exc:
                errors.append(f"line {line_number}: invalid JSON: {exc.msg}")
                continue
            if not isinstance(item, dict):
                errors.append(f"line {line_number}: expected a JSON object")
                continue

            prompt = item.get("prompt")
            label_raw = str(item.get("label", "")).strip().casefold()
            label = LABEL_ALIASES.get(label_raw)
            if not isinstance(prompt, str) or not prompt.strip():
                errors.append(f"line {line_number}: prompt must be a non-empty string")
                continue
            if label is None:
                errors.append(f"line {line_number}: label must be bad/good (or a documented alias)")
                continue

            row = {
                "id": str(item.get("id") or f"row-{line_number:06d}"),
                "prompt": " ".join(unicodedata.normalize("NFKC", prompt).split()),
                "label": label,
                "category": str(item.get("category") or "uncategorized").strip() or "uncategorized",
                "source": item.get("source"),
                "group_id": item.get("group_id"),
            }
            normalized = normalize_prompt(row["prompt"])
            previous = seen.get(normalized)
            if previous:
                duplicates.append(
                    {
                        "normalized_sha256": hashlib.sha256(normalized.encode()).hexdigest(),
                        "first_id": previous["id"],
                        "duplicate_id": row["id"],
                        "labels": sorted({previous["label"], row["label"]}),
                        "cross_label": previous["label"] != row["label"],
                    }
                )
                continue
            seen[normalized] = row
            rows.append(row)
    return rows, errors, duplicates


def split_rows(rows: list[dict[str, Any]], fraction: float, seed: str) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    strata = Counter((row["category"], row["label"]) for row in rows)
    targets = {
        stratum: (0 if count < 2 or fraction == 0 else min(count - 1, max(1, round(count * fraction))))
        for stratum, count in strata.items()
    }
    groups: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for row in rows:
        # A supplied group_id binds paraphrases/templates across labels or
        # categories. Ungrouped rows remain independently assignable.
        group_key = f"group:{row['group_id']}" if row.get("group_id") else f"row:{row['id']}:{normalize_prompt(row['prompt'])}"
        groups[group_key].append(row)

    train: list[dict[str, Any]] = []
    validation: list[dict[str, Any]] = []
    selected = Counter()
    ordered_groups = sorted(
        groups.items(),
        key=lambda item: hashlib.sha256(f"{seed}\0{item[0]}".encode("utf-8")).hexdigest(),
    )
    for _, group_rows in ordered_groups:
        group_counts = Counter((row["category"], row["label"]) for row in group_rows)
        fits_targets = all(selected[stratum] + count <= targets[stratum] for stratum, count in group_counts.items())
        reduces_deficit = any(selected[stratum] < targets[stratum] for stratum in group_counts)
        if fits_targets and reduces_deficit:
            validation.extend(group_rows)
            selected.update(group_counts)
        else:
            train.extend(group_rows)
    return sorted(train, key=lambda row: stable_key(seed, row)), sorted(validation, key=lambda row: stable_key(seed, row))


def write_text(path: Path, prompts: list[str]) -> None:
    path.write_text("\n".join(prompts) + ("\n" if prompts else ""), encoding="utf-8", newline="\n")


def write_jsonl(path: Path, rows: list[dict[str, Any]]) -> None:
    with path.open("w", encoding="utf-8", newline="\n") as handle:
        for row in rows:
            handle.write(json.dumps(row, ensure_ascii=False, sort_keys=True) + "\n")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input", type=Path, help="JSONL with prompt, label, and optional category/id/source/group_id")
    parser.add_argument("--output-dir", type=Path, required=True)
    parser.add_argument("--validation-fraction", type=float, default=0.2)
    parser.add_argument("--seed", default="abliteration-contrast-v1")
    parser.add_argument(
        "--baseline-design",
        choices=("general", "category-stratified", "topic-matched"),
        default="general",
        help="Record the contrast design; does not manufacture prompt pairs",
    )
    parser.add_argument("--allow-cross-label-duplicates", action="store_true")
    parser.add_argument("--force", action="store_true", help="Replace this tool's known output files")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    if not 0 <= args.validation_fraction < 1:
        print("error: --validation-fraction must be in [0, 1)", file=sys.stderr)
        return 2
    if not args.input.is_file():
        print(f"error: input not found: {args.input}", file=sys.stderr)
        return 2

    rows, errors, duplicates = load_rows(args.input)
    if errors:
        print("\n".join(f"error: {message}" for message in errors), file=sys.stderr)
        return 2
    cross_label = [item for item in duplicates if item["cross_label"]]
    if cross_label and not args.allow_cross_label_duplicates:
        print(f"error: {len(cross_label)} normalized prompt(s) occur under both labels", file=sys.stderr)
        for item in cross_label[:10]:
            print(f"  {item['first_id']} <-> {item['duplicate_id']}", file=sys.stderr)
        return 2
    if not rows or set(row["label"] for row in rows) != {"bad", "good"}:
        print("error: the deduplicated input must contain both bad and good labels", file=sys.stderr)
        return 2

    output_dir = args.output_dir
    output_names = ("train-bad.txt", "train-good.txt", "validation.jsonl", "contrast-manifest.json")
    existing = [output_dir / name for name in output_names if (output_dir / name).exists()]
    if existing and not args.force:
        print("error: outputs already exist; use --force to replace this tool's files", file=sys.stderr)
        return 2
    output_dir.mkdir(parents=True, exist_ok=True)

    train, validation = split_rows(rows, args.validation_fraction, args.seed)
    train_bad = [row["prompt"] for row in train if row["label"] == "bad"]
    train_good = [row["prompt"] for row in train if row["label"] == "good"]
    paths = {
        "train_bad": output_dir / "train-bad.txt",
        "train_good": output_dir / "train-good.txt",
        "validation": output_dir / "validation.jsonl",
    }
    write_text(paths["train_bad"], train_bad)
    write_text(paths["train_good"], train_good)
    write_jsonl(paths["validation"], validation)

    manifest = {
        "schema_version": 1,
        "tool": f"prepare-contrast-set.py/{VERSION}",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "input": {"path": str(args.input), "sha256": sha256_file(args.input)},
        "parameters": {
            "seed": args.seed,
            "validation_fraction": args.validation_fraction,
            "baseline_design": args.baseline_design,
            "normalization": "Unicode NFKC + whitespace collapse + casefold for duplicate detection",
        },
        "counts": {
            "deduplicated": len(rows),
            "train": len(train),
            "validation": len(validation),
            "labels": dict(sorted(Counter(row["label"] for row in rows).items())),
            "categories": dict(sorted(Counter(row["category"] for row in rows).items())),
            "duplicates_removed": len(duplicates),
            "cross_label_duplicates": len(cross_label),
        },
        "warnings": (["topic-matched baselines can cancel a usable direction; compare against general controls"] if args.baseline_design == "topic-matched" else []),
        "duplicates": duplicates,
        "outputs": {
            key: {"path": path.name, "sha256": sha256_file(path)} for key, path in paths.items()
        },
    }
    manifest_path = output_dir / "contrast-manifest.json"
    manifest_path.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8", newline="\n")
    print(json.dumps({"output_dir": str(output_dir), "counts": manifest["counts"], "manifest": str(manifest_path)}, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
