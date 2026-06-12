# Manual full pipeline

Research-grade control — no automated search.

## Phase A — Data

1. **Generate** 128–512 harmful/harmless pairs (or use public refusal datasets)
2. **Filter** — run base model; drop pairs where both labels agree (no signal)
3. Store `data/paired_v1.jsonl` + `data/eval_v1.txt`

## Phase B — Directions

1. Implement activation harvester (see [../methods/manual-transformers-pipeline.md](../methods/manual-transformers-pipeline.md))
2. Hook: post-MLP residual per layer
3. Token index: last prompt token (document choice)
4. Save `runs/<run_id>/directions.pt` + `metadata.json`

## Phase C — Edit

1. Start with layers `0.45n … 0.65n` of depth
2. Apply MLP down_proj ablation α=0.5
3. Save candidate `model_a/`

## Phase D — Evaluate

| Metric | Pass criterion (tune yours) |
|--------|----------------------------|
| Benign false-refusal rate | ↓ vs base |
| MMLU subset | ≤3 pt drop |
| Harmful compliance | Document ↑ (don't deploy blindly) |

## Phase E — Iterate

- If under-ablated: ↑ α or add layers
- If capability hit: ↓ α or shrink layer band
- Log every candidate in `runs/RESULTS.md`

## Phase F — Publish artifact

```
abliterated-<base>-<date>/
  README.md          # method, eval, ethics notice
  config.json
  model.safetensors
```