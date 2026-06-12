# MLP down_proj abliteration

Most common **permanent** recipe for decoder-only LLMs (Llama, Mistral, Qwen architectures).

## Target module

Per transformer block:

```
block.mlp.down_proj   # Linear: intermediate_size → hidden_size
```

The down projection writes directly into the residual stream — removing refusal write directions here is effective.

## Math

Given unit vector `r ∈ ℝ^{d_model}` and weight matrix `W ∈ ℝ^{d_model × d_intermediate}`:

```
P_⊥ = I - r rᵀ
W' = P_⊥ @ W
```

Some recipes transpose depending on `nn.Linear` layout — **verify dimensions** in your framework.

## Pseudocode

```python
import torch

def ablate_down_proj(W, r, alpha=1.0):
    # W shape: [d_out, d_in] = [hidden, intermediate] in PyTorch Linear
    r = r / r.norm()
    # Remove rows' component along r (output space of down_proj)
    proj = torch.outer(r, r)  # [hidden, hidden]
    return W - alpha * (proj @ W)
```

Apply per selected layer; save `state_dict`.

## Validation

- `W'` shape unchanged
- Forward pass on dummy input — no NaNs
- Compare logits drift on benign prompt (should be small pre-abliteration)