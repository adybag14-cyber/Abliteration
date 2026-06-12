# Heretic workflow

Automated abliteration — lowest friction for a **saved** abliterated checkpoint.

## Checklist

- [ ] GPU ready, drivers updated
- [ ] HF token: `huggingface-cli login`
- [ ] Base model ID chosen & license accepted on HF
- [ ] Disk space ≥ 2× model size

## Steps

### 1. Install tool

```bash
# Clone the Heretic fork you trust — verify README & commit hash
git clone https://github.com/<org>/heretic.git tools/heretic
cd tools/heretic
pip install -e .
```

> This repo does not vendor Heretic — pin your own fork.

### 2. Configure run

Create `config.yaml` (example skeleton):

```yaml
model: meta-llama/Llama-3.1-8B-Instruct
dtype: float16
output_dir: ./outputs/llama31-8b-abliterated
search:
  layer_fraction: [0.4, 0.7]
  alpha_grid: [0.5, 0.75, 1.0]
eval:
  benign_prompts: ./data/benign_eval.txt
```

### 3. Run

```bash
heretic run -c config.yaml
```

Monitor logs for refusal rate vs capability proxy.

### 4. Validate output

- [ ] Load in Transformers — forward pass OK
- [ ] Run [../docs/evaluation.md](../docs/evaluation.md) suite
- [ ] Document commit hashes in `runs/MANIFEST.md`

### 5. Optional GGUF

→ [../methods/gguf-export-notes.md](../methods/gguf-export-notes.md)

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| CUDA OOM | Smaller model; `device_map`; 8-bit load |
| All outputs degenerate | Lower α; fewer layers |
| No refusal change | Wrong chat template; re-check directions |
| HF 403 | Accept license; refresh token |