#!/usr/bin/env python3
"""Create a new dated primary-source catalog; never overwrite prior snapshots.

Bibliographic metadata comes from arXiv citation tags. Human-curated implications
remain distinct from paper claims. Discovery does not auto-enable an algorithm.
"""
from __future__ import annotations
import argparse
import hashlib
import json
import re
import urllib.request
from html.parser import HTMLParser
from pathlib import Path


class Citations(HTMLParser):
    def __init__(self):
        super().__init__(); self.metadata = {}
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "meta" and attrs.get("name", "").startswith("citation_"):
            self.metadata.setdefault(attrs["name"], []).append(attrs.get("content", ""))


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--seeds", type=Path, default=Path("data/research-refresh-seeds.json"))
    p.add_argument("--output", type=Path, required=True)
    args = p.parse_args()
    if args.output.exists():
        p.error("append-only snapshots: choose a new output path")
    seeds = json.loads(args.seeds.read_text(encoding="utf-8"))
    papers, seen = [], set()
    for seed in seeds["papers"]:
        aid = seed["id"]
        if not re.fullmatch(r"\d{4}\.\d{4,5}", aid) or aid in seen:
            raise ValueError("invalid or duplicate arXiv id")
        seen.add(aid)
        url = "https://arxiv.org/abs/" + aid
        request = urllib.request.Request(url, headers={"User-Agent": "AbliterationResearchCatalog/1.0"})
        with urllib.request.urlopen(request, timeout=30) as response:
            raw = response.read(4 * 1024 * 1024 + 1)
        if len(raw) > 4 * 1024 * 1024:
            raise ValueError("metadata page exceeds bound")
        html = raw.decode("utf-8")
        parser = Citations(); parser.feed(html); meta = parser.metadata
        if meta.get("citation_arxiv_id") != [aid]:
            raise ValueError("primary identifier mismatch")
        title = meta["citation_title"][0].strip()
        if not title or not meta.get("citation_author"):
            raise ValueError("missing primary metadata")
        versions = re.findall(r"\[v(\d+)\]", html)
        version = max(map(int, versions)) if versions else 1
        categories = re.search(r'<span class="primary-subject">.*?\(([^)]+)\)', html)
        papers.append({**seed, "title": title, "authors": meta["citation_author"], "published": meta["citation_date"][0].replace("/", "-"), "category": categories[1] if categories else "not parsed", "url": url, "version_url": url + f"v{version}", "version": version, "pdf_url": "https://arxiv.org/pdf/" + aid + f"v{version}", "source": "arXiv citation metadata", "retrieved_at": seeds["snapshot_date"], "source_page_sha256": hashlib.sha256(raw).hexdigest(), "evidence_level": "primary-source; not independently replicated here"})
        print(f"verified {aid}: {title}", flush=True)
    result = {"schema_version": 1, "snapshot_date": seeds["snapshot_date"], "source": "arXiv citation metadata", "count": len(papers), "claim_policy": "Additive bibliography refresh; dates are publication dates, not the date this repository discovered a paper. No 98% claim has been identified or reproduced.", "papers": sorted(papers, key=lambda x: (x["published"], x["id"]), reverse=True)}
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open("x", encoding="utf-8") as f:
        f.write(json.dumps(result, indent=2, ensure_ascii=False) + "\n")


if __name__ == "__main__":
    main()
