# Heretic workflow

Automated abliteration via [p-e-w/heretic](https://github.com/p-e-w/heretic) — **install from GitHub/PyPI, not Hugging Face docs.**

## Checklist

- [ ] Python 3.10+, PyTorch 2.2+ (2.6+ for MXFP4 models like gpt-oss)
- [ ] NVIDIA GPU with enough VRAM (16 GB+ for 4B at 4-bit)
- [ ] Base model accessible locally or via HF path string (gated models need HF token)
- [ ] Original weights backed up

## Install (recommended)

```bash
pip install -U heretic-llm
heretic --help
```

## Install (reproducible, from GitHub)

```bash
git clone https://github.com/p-e-w/heretic.git tools/heretic
cd tools/heretic
# uses uv.lock for pinned deps
uv run heretic --help
```

## Run

```bash
heretic Qwen/Qwen3-4B-Instruct-2507
# or local path:
heretic ./models/Qwen3-4B-Instruct-2507
```

Typical runtime: **20–30 min** on RTX 3090-class GPU for 4B (per upstream README).

### Low VRAM

```bash
# In config.default.toml or CLI equivalent:
# quantization = "bnb_4bit"
```

Clone `config.default.toml` from GitHub for all options:

```bash
curl -L -o config.default.toml \
  https://raw.githubusercontent.com/p-e-w/heretic/master/config.default.toml
```

## After completion

Heretic prompts you to:

- Save checkpoint (safetensors)
- Upload (optional — skip if self-hosting)
- Chat test
- Built-in eval (`--evaluate-model`)

## Research extras

```bash
pip install -U "heretic-llm[research]"
heretic <model> --plot-residuals
heretic <model> --print-residual-geometry
```

## Refresh upstream docs

```bash
node scripts/fetch-docs.mjs
# or Context7: query-docs on heretic-llm
```

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| CUDA OOM | `quantization = bnb_4bit` in config |
| Degenerate outputs | Lower `max_weight`; fewer layers in kernel |
| No refusal change | Verify chat template matches model family |
| Gated model 403 | `huggingface-cli login` (weights only — tool is on GitHub) |

See [../sources/fetched/heretic-readme.txt](../sources/fetched/heretic-readme.txt) for latest fetched README.