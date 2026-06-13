# Heretic tool files (immutable reference)

Pinned copies of **upstream Heretic** configuration and lockfiles for offline/docs use.  
**Do not edit `config.default.toml` by hand** — refresh from GitHub.

## Upstream source of truth

| Artifact | URL |
|----------|-----|
| Repository | [github.com/p-e-w/heretic](https://github.com/p-e-w/heretic) (`master`) |
| Mirror | [codeberg.org/p-e-w/heretic](https://codeberg.org/p-e-w/heretic) |
| PyPI | `heretic-llm` |
| Live docs | [p-e-w-heretic.mintlify.app](https://p-e-w-heretic.mintlify.app/) |

## Files in this folder

| File | Role | Updated how |
|------|------|-------------|
| `config.default.toml` | **Exact upstream** default config | `node scripts/fetch-heretic-tools.mjs` |
| `config.low-vram.toml` | Handbook profile — 8 GB GPU | Maintained in abliteration repo |
| `config.production.toml` | Handbook profile — agent quality | Maintained in abliteration repo |
| `config.thinking-model.toml` | Thinking / CoT models | Maintained in abliteration repo |
| `config.factory-qa.toml` | Factory bench domain prompts | Maintained in abliteration repo |
| `config.noslop.toml` | Upstream slop-reduction profile | `fetch-heretic-tools.mjs` |
| `config.nohumor.toml` | Upstream humor-reduction profile | `fetch-heretic-tools.mjs` |
| `pyproject.toml.reference` | Dependency names / version pins | `fetch-heretic-tools.mjs` |
| `uv.lock.reference` | Full uv lock for reproducible `uv run` | `fetch-heretic-tools.mjs` |
| `UPSTREAM.json` | URLs, sync timestamps, sha256 | Written by fetch script |
| `install.ps1` / `install.sh` | Install helpers | Handbook maintained |

## Refresh from upstream

```bash
cd abliteration
npm install                    # once — playwright for HF fetch
node scripts/fetch-heretic-tools.mjs
node scripts/fetch-hf-heretic-models.mjs          # Chromium
node scripts/fetch-hf-heretic-models.mjs --firefox
```

## Use in a Heretic run

```bash
# Low VRAM
cp sources/heretic-tools/config.low-vram.toml config.toml
heretic ./models/Qwen2.5-1.5B-Instruct

# Or upstream defaults unchanged
cp sources/heretic-tools/config.default.toml config.toml
```

## Model registry (open-weight HF)

Community and official Heretic models are catalogued in:

- [../../data/heretic-models-registry.jsonl](../../data/heretic-models-registry.jsonl) — merged registry
- [../../data/heretic-models-hf-snapshot.json](../../data/heretic-models-hf-snapshot.json) — raw HF API scrape

Refresh: `node scripts/fetch-hf-heretic-models.mjs`

Browse live: [huggingface.co/models?other=heretic](https://huggingface.co/models?other=heretic)

## Handbook models already attempted / recommended

See registry rows with `attempted_by: abliteration-handbook` — includes Qwen2.5-1.5B, Qwen3-4B, Gemma-3-12B baselines and documented eval paths in [../../instructions/beginner-local-model-guide.md](../../instructions/beginner-local-model-guide.md).

Human-readable table: [../../docs/tools/heretic-models-registry.md](../../docs/tools/heretic-models-registry.md)  
Full reference: [../../docs/tools/heretic-tools-reference.md](../../docs/tools/heretic-tools-reference.md)