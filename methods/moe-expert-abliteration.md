# MoE per-expert abliteration (manual)

When not using Heretic, apply the same `r_ℓ` projection to **every expert** output matrix.

## Pseudocode

```python
import torch
import torch.nn.functional as F

def ablate_matrix(W, r, alpha=1.0):
    r = F.normalize(r.float(), dim=0)
    P = torch.eye(W.shape[0]) - torch.outer(r, r)
    return W - alpha * (P @ W.float()).to(W.dtype)

def ablate_qwen_moe_layer(layer, r, alpha):
    if hasattr(layer.mlp, "experts"):
        for expert in layer.mlp.experts:
            expert.down_proj.weight.data = ablate_matrix(
                expert.down_proj.weight.data, r, alpha
            )
    if hasattr(layer, "self_attn") and hasattr(layer.self_attn, "o_proj"):
        layer.self_attn.o_proj.weight.data = ablate_matrix(
            layer.self_attn.o_proj.weight.data, r, alpha * 0.5  # gentler on attn
        )
```

## Load directions

From `llm-abliteration` `directions.pt` or Heretic export — one vector per layer index.

## Router

Do **not** ablate router/gate weights by default — changes expert selection dynamics unpredictably.

## Verification

```python
# Expert count × layer count sanity
n_experts = len(model.model.layers[10].mlp.experts)
print(f"experts per layer: {n_experts}")
```

→ [../techniques/moe-hybrid-abliteration.md](../techniques/moe-hybrid-abliteration.md)