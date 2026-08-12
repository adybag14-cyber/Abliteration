# Toy tensors (safe to commit, no model weights)

| File | Shape | Use |
|------|-------|-----|
| `tiny-bad.txt` | 5×4 | “refusal-ish” cloud (large on dim 0) |
| `tiny-good.txt` | 5×4 | harmless cloud |
| `tiny-W.txt` | 4×3 | toy output-projection weight |
| `tiny-h.txt` | 1×4 | one residual for `hook` |
| `generations.jsonl` | 5 lines | marker eval |

```text
abliterate-cxx demo
abliterate-cxx estimate --mode dim --bad tiny-bad.txt --good tiny-good.txt --out r.txt
```

First line of every `.txt` is `rows cols`.
