# Upstream sources

This repo prefers **GitHub** and **live doc fetches** over stale Hugging Face blog links.

## Refresh fetched docs (headless browser)

```bash
cd abliteration
node scripts/fetch-docs.mjs          # Chromium (default)
node scripts/fetch-docs.mjs --firefox # requires: npx playwright install firefox
```

Outputs land in `sources/fetched/` with a `manifest.json` timestamp.

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