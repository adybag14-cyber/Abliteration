# W2SV / rank-1 weight patches

**Status:** experimental / unverified. This page has **no primary paper**. It is **not** a paper-grade method.

## Idea

Community / informal: apply a rank-1 update `W' = W + u vᵀ` from activation statistics instead of a full matrix projection. Some tooling chains export patches compatible with GGUF merge scripts.

Do not treat this as equivalent to Arditi / ORBA / Wang. Those have papers; this does not.

## When it appears

- Memory-constrained patch experiments (ship `u,v` not a full checkpoint)
- Informal incremental-strength tests by scaling `u,v`

Prefer documented operators (DIM + Arditi / ORBA directional) unless you are explicitly exploring this parameterization.