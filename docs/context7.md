# Context7 integration

[Context7](https://github.com/upstash/context7) injects **up-to-date library docs** into agent context via MCP.

## Setup (Cursor / Windsurf / compatible IDE)

Add to your MCP config (example):

```json
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp"]
    }
  }
}
```

Restart the IDE after saving.

## Libraries to query for this repo

| Library | Context7 search term | Use for |
|---------|---------------------|---------|
| Heretic | `heretic-llm` or GitHub `p-e-w/heretic` | CLI flags, `config.default.toml`, install |
| TransformerLens | `transformer_lens` | Hook names, `HookedTransformer` |
| Optuna | `optuna` | Heretic's TPE optimizer internals |
| PyTorch | `pytorch` | `torch_dtype`, quantization |
| llama.cpp | `llama.cpp` | GGUF conversion after abliteration |

## Typical agent workflow

```
1. resolve-library-id("heretic automatic abliteration")
2. query-docs(libraryId, "installation pip install heretic-llm CLI options")
3. query-docs(libraryId, "quantization bnb_4bit config.default.toml")
```

## When Context7 is unavailable

Run the headless fetcher instead:

```bash
node scripts/fetch-docs.mjs
```

Or pull READMEs directly:

```bash
curl -L https://raw.githubusercontent.com/p-e-w/heretic/master/README.md
curl -L https://raw.githubusercontent.com/p-e-w/heretic/master/config.default.toml
```