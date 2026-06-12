# Inference-only prototype

No checkpoint modification — ideal first experiment.

## Goal

Confirm your refusal direction **`r_ℓ` moves the needle** before weight surgery.

## Steps

1. Follow [quickstart.md](quickstart.md) steps 1–4
2. Implement hooks for **3 layers only** (early / mid / late)
3. Benchmark 50 prompts with hooks **off** vs **on**
4. Record refusal rate delta per layer subset

## Decision tree

```
Mid-layer hook alone fixes 80% false refusals?
  YES → proceed to Heretic or manual weight edit (mid band)
  NO  → re-check dataset pairing or try attn+MLP hooks
```

## Cleanup

Remove all hooks; delete temp activations; no artifact to version-control beyond logs.