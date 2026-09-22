#!/usr/bin/env python3
"""Offline provenance and consistency checks for the additive research edition."""
import hashlib
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def main():
    old = json.loads((ROOT / "sources/research/catalog-2026.json").read_text(encoding="utf-8"))
    new = json.loads((ROOT / "sources/research/catalog-2026-09.json").read_text(encoding="utf-8"))
    assert old["count"] == len(old["papers"]) == 50
    assert old["snapshot_date"] == "2026-08-23"
    assert new["count"] == len(new["papers"]) == 14
    ids = {p["id"] for p in old["papers"]}
    document = (ROOT / "docs/research-september-2026.md").read_text(encoding="utf-8")
    for paper in new["papers"]:
        assert paper["id"] not in ids, "duplicate paper across snapshots"
        ids.add(paper["id"])
        assert paper["url"] == "https://arxiv.org/abs/" + paper["id"]
        assert paper["version_url"] == paper["url"] + "v" + str(paper["version"])
        assert paper["authors"] and paper["summary"] and paper["scope"]
        assert re.fullmatch(r"[0-9a-f]{64}", paper["source_page_sha256"])
        assert paper["published"] <= new["snapshot_date"]
        assert paper["id"] in document
        assert paper["implementation"] in {"reference-only", "evaluation-guidance"}
    layout = json.loads((ROOT / "data/models/minicpm5-1b-layout.json").read_text())
    lock = json.loads((ROOT / "data/models/minicpm5-1b.json").read_text())
    assert layout["revision"] == lock["revision"]
    assert layout["total_parameters"] == lock["parameters"]
    for family in layout["families"].values():
        assert family["parameters"] == family["shape"][0] * family["shape"][1]
        assert family["count"] == lock["layers"]
    protocol_hash = hashlib.sha256((ROOT / "data/experiments/minicpm5-protocol.jsonl").read_bytes()).hexdigest()
    for path in sorted((ROOT / "data/experiments").glob("minicpm5-*-*.json")):
        report = json.loads(path.read_text(encoding="utf-8"))
        if "results" not in report: continue
        assert report["status"] == "completed" and report["deployment_certified"] is False
        assert report["revision"] == lock["revision"]
        assert report["protocol_sha256"] == protocol_hash
        for name, result in report["results"].items():
            for cohort in result["cohorts"].values():
                assert 0 <= cohort["refusals"] <= cohort["n"]
                assert cohort["refusal_rate"] == cohort["refusals"] / cohort["n"]
                assert 0 <= cohort["truncated"] <= cohort["n"]
            if name != "baseline":
                assert result["edit"]["unselected_tensors_identical"]
                assert result["edit"]["changed_tensors"] <= result["edit"]["selected_tensors"]
    print(json.dumps({"ok": True, "preserved_papers": 50, "added_papers": 14, "total_papers": len(ids), "layout_tensors": layout["total_tensors"]}))


if __name__ == "__main__":
    main()
