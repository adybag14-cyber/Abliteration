#!/usr/bin/env python3
"""Offline provenance and consistency checks for additive research editions."""
import hashlib
import json
import re
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

def digest(value):
    return isinstance(value, str) and re.fullmatch(r"[0-9a-f]{64}", value)

def main():
    old = json.loads((ROOT / "sources/research/catalog-2026.json").read_text(encoding="utf-8"))
    assert old["count"] == len(old["papers"]) == 50
    assert old["snapshot_date"] == "2026-08-23"
    ids = {p["id"] for p in old["papers"]}
    assert len(ids) == 50
    editions = [
        ("2026-09", "2026-09-22", 14, "research-september-2026.md"),
        ("2026-10", "2026-10-05", 8, "research-october-2026.md"),
    ]
    for edition, snapshot, expected_count, document_name in editions:
        new = json.loads((ROOT / f"sources/research/catalog-{edition}.json").read_text(encoding="utf-8"))
        assert new["snapshot_date"] == snapshot
        assert new["count"] == len(new["papers"]) == expected_count
        document = (ROOT / "docs" / document_name).read_text(encoding="utf-8")
        for paper in new["papers"]:
            assert paper["id"] not in ids, "duplicate paper across snapshots"
            ids.add(paper["id"])
            assert re.fullmatch(r"\d{4}\.\d{4,5}", paper["id"])
            assert paper["url"] == "https://arxiv.org/abs/" + paper["id"]
            assert isinstance(paper["version"], int) and paper["version"] >= 1
            assert paper["version_url"] == paper["url"] + "v" + str(paper["version"])
            assert paper["pdf_url"] == "https://arxiv.org/pdf/" + paper["id"] + "v" + str(paper["version"])
            assert paper["title"] and paper["authors"] and paper["summary"] and paper["scope"]
            assert paper["area"] in {"Mechanism", "Intervention", "Defense", "Evaluation", "Attack"}
            assert digest(paper["source_page_sha256"])
            assert date.fromisoformat(paper["published"]) <= date.fromisoformat(snapshot)
            assert paper["retrieved_at"] == snapshot
            assert paper["id"] in document
            assert paper["implementation"] in {"reference-only", "evaluation-guidance"}
            if edition == "2026-10":
                assert paper["limitations"] and paper["code_status"]

    huihui = json.loads((ROOT / "sources/research/huihui-2026-10.json").read_text(encoding="utf-8"))
    assert huihui["verified_at"] == "2026-10-05"
    assert len(huihui["models"]) == len({m["id"] for m in huihui["models"]}) == 8
    for model in huihui["models"]:
        assert model["id"].startswith("huihui-ai/")
        assert re.fullmatch(r"[0-9a-f]{40}", model["revision"])
        assert model["base_models"] and model["license_reported"]
        assert model["url"] == "https://huggingface.co/" + model["id"]
        assert model["card_url"] == model["url"] + "/blob/" + model["revision"] + "/README.md"
        assert model["card_download_url"] == model["url"] + "/resolve/" + model["revision"] + "/README.md"
        assert digest(model["card_sha256"]) and digest(model["metadata_sha256"])
        assert model["created_at"][:10] <= model["last_modified"][:10] <= huihui["verified_at"]
        assert model["reviewed_at"] == huihui["verified_at"]
        assert model["format"] in {"GGUF", "safetensors"}
        assert all(isinstance(v, bool) for v in model["claims"].values())

    tooling = json.loads((ROOT / "sources/research/tooling-2026-10.json").read_text(encoding="utf-8"))
    assert tooling["verified_at"] == "2026-10-05" and len(tooling["sources"]) == 4
    for source in tooling["sources"]:
        assert re.fullmatch(r"[0-9a-f]{40}", source["revision"])
        assert source["repository"].startswith("https://github.com/")
        for item in source.get("files", []):
            assert digest(item["sha256"])
    discovery = json.loads((ROOT / "sources/research/discovery-2026-10.json").read_text(encoding="utf-8"))
    assert discovery["new_papers"] == 8 and discovery["huihui_cards"] == 8
    hermes = discovery["hermes"]
    assert hermes["parsed_documents"] == hermes["reviewed_source_briefs"] == len(hermes["sources"])
    assert hermes["target_met"] == (hermes["parsed_documents"] >= hermes["target_documents"])


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
    print(json.dumps({"ok": True, "preserved_papers": 50, "added_papers": 22, "october_papers": 8, "huihui_cards": 8, "total_papers": len(ids), "layout_tensors": layout["total_tensors"]}))


if __name__ == "__main__":
    main()
