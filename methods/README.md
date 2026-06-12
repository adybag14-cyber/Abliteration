# Methods

**How** each abliteration family is implemented — formulas, target modules, pseudocode.

| Method | Doc |
|--------|-----|
| MLP `down_proj` weight projection | [mlp-down-proj-abliteration.md](mlp-down-proj-abliteration.md) |
| Attention `o_proj` weight projection | [attention-o-proj-abliteration.md](attention-o-proj-abliteration.md) |
| Residual-stream hook ablation | [residual-hook-ablation.md](residual-hook-ablation.md) |
| Automated search (Heretic-style) | [automated-heretic-search.md](automated-heretic-search.md) |
| Manual PyTorch / Transformers | [manual-transformers-pipeline.md](manual-transformers-pipeline.md) |
| GGUF export & inference | [gguf-export-notes.md](gguf-export-notes.md) |

## Method selection guide

```
Start here
    │
    ├─ Want reversible experiments? ──► residual-hook-ablation
    │
    ├─ Want fastest path to checkpoint? ──► automated-heretic-search
    │
    ├─ Want full control / research? ──► manual-transformers-pipeline
    │                                      └─► mlp-down-proj-abliteration
    │
    └─ Deploy in llama.cpp? ──► gguf-export-notes
```