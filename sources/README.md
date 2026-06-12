# Upstream sources

This repo prefers **GitHub** and **live doc fetches** over stale Hugging Face blog links.

## Heretic tool pins (immutable)

Pinned configs and lockfiles: [`heretic-tools/`](heretic-tools/) — see [heretic-tools/IMPORT.md](heretic-tools/IMPORT.md).

```bash
npm run fetch:heretic    # sync config.default.toml, pyproject, uv.lock from GitHub
```

## Refresh fetched docs + HF model registry (headless browser)

```bash
cd abliteration
npm install
npx playwright install chromium firefox   # once

npm run fetch:all                         # pins + docs + HF registry + markdown table
# or:
node scripts/fetch-docs.mjs               # Chromium
node scripts/fetch-docs.mjs --firefox
node scripts/fetch-hf-heretic-models.mjs --firefox   # HF API via in-page fetch
```

- Doc snapshots → `sources/fetched/` + `manifest.json`
- Heretic/abliterated HF models → `data/heretic-models-registry.jsonl` + [../docs/tools/heretic-models-registry.md](../docs/tools/heretic-models-registry.md)

## Context7 (optional MCP)

If Context7 is configured in your editor, query libraries before editing workflows:

1. `resolve-library-id` → e.g. `/p-e-w/heretic`, `/TransformerLensOrg/TransformerLens`
2. `query-docs` → "install", "abliteration parameters", "config.default.toml"

See [../docs/context7.md](../docs/context7.md).

## Primary GitHub repos

| Repo | Role |
|------|------|
| [p-e-w/heretic](https://github.com/p-e-w/heretic) | Automated abliteration (recommended) |
| [andyrdt/refusal_direction](https://github.com/andyrdt/refusal_direction) | Original paper reproduction |
| [jim-plus/llm-abliteration](https://github.com/jim-plus/llm-abliteration) | measure → analyze → sharded ablate pipeline |
| [TransformerLensOrg/TransformerLens](https://github.com/TransformerLensOrg/TransformerLens) | Activation hooks / interpretability |
| [FailSpy/abliterator](https://github.com/FailSpy/abliterator) | Early abliterator tooling |
| [Sumandora/remove-refusals-with-transformers](https://github.com/Sumandora/remove-refusals-with-transformers) | HF-free-ish Transformers approach |
| [wassname/abliterator](https://github.com/wassname/abliterator) | Community abliterator |
| [Tsadoq/ErisForge](https://github.com/Tsadoq/ErisForge) | Abliteration toolkit |
| [AUGMXNT/deccp](https://github.com/AUGMXNT/deccp) | deccp / topic-aware datasets |

## Live documentation sites

- [docs.abliteration.ai](https://docs.abliteration.ai/what-is-abliteration) — technique + inference API docs
- [docs.abliteration.ai/llms.txt](https://docs.abliteration.ai/llms.txt) — full doc index for agents