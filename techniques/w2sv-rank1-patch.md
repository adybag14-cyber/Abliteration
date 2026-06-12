# W2SV / rank-1 weight patches

## Idea

Instead of full matrix projection, apply a **rank-1 update** to weights derived from activation statistics (W2SV family of methods).

```
W' = W + u vᵀ
```

where `u,v` computed from refusal vs compliance activations.

## Relation to abliteration

Functionally similar goal (remove refusal feature) but different parameterization. Some tooling chains export patches compatible with GGUF merge scripts.

## When preferred

- Memory-constrained patch distribution (ship `u,v` not full checkpoint)
- Experimenting with incremental strength by scaling `u,v`