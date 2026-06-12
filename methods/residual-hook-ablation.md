# Residual-stream hook ablation

Non-destructive method — see [../techniques/inference-directional-ablation.md](../techniques/inference-directional-ablation.md).

## Hook points (TransformerLens naming)

| Hook | Location |
|------|----------|
| `blocks.{L}.hook_resid_post` | After full block |
| `blocks.{L}.hook_mlp_out` | MLP contribution only |
| `blocks.{L}.hook_attn_out` | Attention contribution only |

Ablating at `hook_resid_post` is the blunt instrument; finer hooks localize side effects.

## TransformerLens example flow

```python
from transformer_lens import HookedTransformer

model = HookedTransformer.from_pretrained("meta-llama/Llama-3.1-8B-Instruct")

def ablate_hook(r, h, hook):
    r = r / r.norm()
    return h - (h @ r).unsqueeze(-1) * r

for L, r in directions.items():
    model.add_hook(f"blocks.{L}.hook_resid_post", lambda h, hook, r=r: ablate_hook(r, h, hook))

logits = model("Your prompt here")
```