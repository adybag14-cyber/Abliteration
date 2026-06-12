# Abliteration — One-Stop Reference

A curated, practical reference for **LLM abliteration**: identifying refusal-related directions in transformer activations and removing or attenuating them in model weights.

This repo is organized as a living handbook — theory, techniques, methods, tools, and step-by-step instructions in one place.

## What is abliteration?

**Abliteration** (from *ablate* + *obliteration*) is a weight-editing procedure that reduces a model's tendency to refuse benign or policy-triggering prompts by surgically modifying weights instead of relying on prompt jailbreaks.

The core insight (Arditi et al., 2024): **refusal behavior in many LLMs is largely mediated by a low-dimensional direction** in the residual stream. If you can estimate that direction per layer, you can **project it out** of MLP/attention outputs (or directly from weight matrices) and produce a variant that retains general capabilities while refusing less often.

> This is interpretability-driven **model surgery**, not fine-tuning. It is irreversible without keeping original weights.

## Repo layout

```
abliteration/
├── README.md                 ← you are here
├── docs/
│   ├── overview.md           ← concepts & vocabulary
│   ├── theory.md             ← math intuition & paper summaries
│   ├── evaluation.md         ← how to measure effect
│   └── risks-and-ethics.md   ← safety, legality, responsible use
├── techniques/               ← *what* you can do (conceptual catalog)
├── methods/                  ← *how* each family of approaches works
├── instructions/             ← runnable workflows & checklists
└── references.md             ← papers, repos, blog posts
```

## Quick navigation

| I want to… | Start here |
|------------|------------|
| Understand the idea in 10 minutes | [docs/overview.md](docs/overview.md) |
| See the math / intuition | [docs/theory.md](docs/theory.md) |
| Compare technique families | [techniques/README.md](techniques/README.md) |
| Pick a method | [methods/README.md](methods/README.md) |
| Run a pipeline end-to-end | [instructions/quickstart.md](instructions/quickstart.md) |
| Use Heretic (automated tool) | [instructions/heretic-workflow.md](instructions/heretic-workflow.md) |
| Evaluate before/after | [docs/evaluation.md](docs/evaluation.md) |

## Upstream docs (GitHub-first)

| Source | How to refresh |
|--------|----------------|
| [p-e-w/heretic](https://github.com/p-e-w/heretic) | `node scripts/fetch-docs.mjs` |
| [docs.abliteration.ai](https://docs.abliteration.ai/llms.txt) | fetched to `sources/fetched/` |
| Context7 MCP | [docs/context7.md](docs/context7.md) |

```bash
node scripts/fetch-docs.mjs          # headless Chromium
node scripts/fetch-docs.mjs --firefox  # needs: npx playwright install firefox
```

## Status

🚧 **Work in progress** — run the fetch script after upstream releases; use Context7 for library API details.

## License

Documentation: CC0-1.0 (public domain) unless otherwise noted.  
Third-party tools referenced here retain their own licenses.