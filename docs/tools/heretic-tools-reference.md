# Heretic tool files (immutable pins)

Pinned **Heretic** configs and lockfiles live in [`sources/heretic-tools/`](../../sources/heretic-tools/).  
They are **immutable reference copies** — refresh from upstream, do not hand-edit the pinned files.

| Need | File / doc |
|------|------------|
| Upstream default config | `sources/heretic-tools/config.default.toml` |
| 8 GB GPU profile | `sources/heretic-tools/config.low-vram.toml` |
| 12–24 GB agent profile | `sources/heretic-tools/config.production.toml` |
| Thinking / CoT models | `sources/heretic-tools/config.thinking-model.toml` |
| Factory bench domain | `sources/heretic-tools/config.factory-qa.toml` |
| Dependency pins | `pyproject.toml.reference`, `uv.lock.reference` |
| Sync manifest (sha256) | `UPSTREAM.json` |
| Import / refresh guide | [`sources/heretic-tools/IMPORT.md`](../../sources/heretic-tools/IMPORT.md) |
| HF models attempted | [`heretic-models-registry.md`](heretic-models-registry.md) |

---

## Upstream source of truth

| Artifact | URL |
|----------|-----|
| Repository | [github.com/p-e-w/heretic](https://github.com/p-e-w/heretic) (`master`) |
| Mirror | [codeberg.org/p-e-w/heretic](https://codeberg.org/p-e-w/heretic) |
| PyPI package | `heretic-llm` |
| Live docs | [p-e-w-heretic.mintlify.app](https://p-e-w-heretic.mintlify.app/) |

**Where to update from:** run `npm run fetch:heretic` (or `node scripts/fetch-heretic-tools.mjs`).  
That script pulls raw GitHub files and writes sha256 timestamps into `UPSTREAM.json`.

Handbook-only profiles (`config.low-vram.toml`, `config.production.toml`) are **edited in this repo** — not overwritten by fetch.

---

## Quick use

```bash
# Low VRAM (8–12 GB)
cp sources/heretic-tools/config.low-vram.toml config.toml
heretic ./models/Qwen2.5-1.5B-Instruct

# Upstream defaults unchanged
cp sources/heretic-tools/config.default.toml config.toml
```

Install helpers: `sources/heretic-tools/install.ps1` (Windows) · `install.sh` (Linux/macOS).

---

## Refresh everything (docs + pins + HF registry)

```bash
cd abliteration
npm install                              # once
npx playwright install chromium firefox  # once

npm run fetch:all
# or step by step:
npm run fetch:heretic
npm run fetch:docs
npm run fetch:hf-models:firefox          # preferred on Windows if Chromium resets
npm run build:heretic-models-doc
```

### Why headless Chromium / Firefox?

Hugging Face blocks bare `curl` / `fetch` from CI and some networks (`ERR_CONNECTION_RESET`).  
`scripts/fetch-hf-heretic-models.mjs` opens the public model list in Playwright, then calls the HF API **inside the browser** so cookies and TLS fingerprint match a real session.

| Script | Browser | Output |
|--------|---------|--------|
| `fetch-hf-heretic-models.mjs` | Chromium (auto-fallback → Firefox) | `data/heretic-models-hf-snapshot.json` |
| `fetch-hf-heretic-models.mjs --firefox` | Firefox | same |
| `fetch-docs.mjs` | Chromium / `--firefox` | `sources/fetched/*.txt` |

---

## Model registry

Open-weight models tagged **heretic** or **abliterated** on Hugging Face:

- **Machine-readable:** [`data/heretic-models-registry.jsonl`](../../data/heretic-models-registry.jsonl)
- **Human table:** [heretic-models-registry.md](heretic-models-registry.md)
- **Handbook seeds:** [`data/heretic-models-registry.seed.jsonl`](../../data/heretic-models-registry.seed.jsonl)

Browse live: [huggingface.co/models?other=heretic](https://huggingface.co/models?other=heretic)

---

## Related

- [abliteration-tooling.md](abliteration-tooling.md) — full tooling catalog
- [../../instructions/heretic-workflow.md](../../instructions/heretic-workflow.md) — run Heretic end-to-end
- [../../instructions/low-vram-abliteration.md](../../instructions/low-vram-abliteration.md) — 8 GB path