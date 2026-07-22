---
name: handbook-research-refresh
description: Audit and update the Abliteration handbook, methods, tools, research corpus, catalogs, and reusable skills from current primary sources. Use when adding advanced techniques, refreshing arXiv or upstream GitHub evidence, reconciling conflicting findings, fixing stale tool instructions, expanding handbook navigation, or validating research-backed claims in this repository.
---

# Handbook research refresh

Prefer primary papers, official tool repositories, and pinned upstream files.
Treat community claims as hypotheses until a paper, code artifact, or local
reproduction supports them.

## Workflow

1. Read `AGENTS.md`, `sources/research/README.md`, `references.md`, and the
   relevant method/technique indexes. Run `npm run ralph:next` when continuation
   mode is enabled.
2. Audit before fetching:

   ```bash
   rg -n "TODO|experimental|WIP|unverified|deprecated|T[0-9]{2}" \
     README.md docs methods techniques instructions references.md
   npm run validate
   ```

3. Search current primary sources. For each proposed addition, capture the
   paper/repository URL, immutable identifier or commit when possible, tested
   models, evaluation design, main result, limitations, and whether code exists.
4. Refresh only the needed corpus:

   ```bash
   npm run fetch:research-papers
   npm run fetch:docs
   npm run fetch:heretic
   ```

   Do not claim all sources refreshed when a fetch reports failures. Inspect
   `sources/research/manifest.json`, `sources/fetched/manifest.json`, and
   `sources/heretic-tools/UPSTREAM.json`.
5. Classify evidence in prose:

   - **Established:** peer-reviewed or independently reproduced causal result.
   - **Reported:** primary paper/repository result not reproduced here.
   - **Experimental:** plausible method with incomplete evidence.
   - **Defensive/opposite direction:** robustness method, not an abliteration
     improvement.

6. Add implementation detail under `methods/`, conceptual guidance under
   `techniques/`, operating sequence under `instructions/`, and synthesis under
   `docs/`. Avoid duplicating the same long explanation across layers.
7. For mathematical methods, include tensor shapes, orientation, numeric
   precision, invariants, failure modes, held-out diagnostics, and an evaluation
   gate. Check complements and signs with a synthetic example.
8. Cross-link every addition from the nearest index and the advanced catalog.
   Add runnable tools only when they remove a repeated manual step; keep them
   standard-library where practical and provide deterministic sample data.
9. Update `scripts/ralph-validate.mjs` when a new artifact class needs durable
   checks. Validate skills with the skill validator and Python with
   `py_compile` or repository tests.
10. Run `npm run ralph`, complete the active task, repeat until the backlog is
    clear, then run `npm run ralph:regress` for the final gate.

## Claim rules

- Distinguish geometric correlation from held-out causal intervention.
- Do not generalize a one-model result into a model-family rule.
- Preserve contradictory results and explain the differing baseline, model,
  layer, token position, or metric.
- Do not present a failed fetch, placeholder page, or tiny HTML response as a
  valid snapshot.
- Cite primary sources next to claims and keep an offline source when licensing
  and repository policy permit it.
- Keep authorized-use and preservation gates visible when expanding security or
  agentic examples.
