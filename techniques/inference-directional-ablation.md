# Inference-time directional ablation

## Idea

Before the model writes to the residual stream at layer ℓ, remove the component along `r_ℓ`:

```
h' = h - (h · r_ℓ) r_ℓ
```

Weights stay untouched — toggle hooks on/off to compare.

## When to use

- Prototyping direction quality before permanent edits
- A/B testing refusal benchmarks quickly
- Research on **which layers** matter

## Implementation sketch (PyTorch hook)

```python
def make_ablation_hook(r):
    r = r / r.norm()
    def hook(module, inp, out):
        h = out[0] if isinstance(out, tuple) else out
        coeff = (h @ r).unsqueeze(-1)
        return h - coeff * r
    return hook
```

Register on chosen submodule; run generation; remove hooks to restore base behavior.

## Limitations

- Small inference overhead
- Must ship direction vectors alongside model
- Some serving frameworks disallow custom hooks