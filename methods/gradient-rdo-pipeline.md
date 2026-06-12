# Gradient RDO pipeline (Refusal Direction Optimization)

Implement or reuse [TUM geometry-of-refusal](https://www.cs.cit.tum.de/daml/geometry-of-refusal/) when mean-difference fails.

## Algorithm summary

Optimize unit direction `r` with losses:

| Loss | Purpose |
|------|---------|
| `L_ablation` | After projecting out `r`, model answers harmful prompts |
| `L_addition` | After adding `αr`, model refuses harmless prompts |
| `L_retain` | KL unchanged on harmless when ablating `r` |

Train `r` with gradient descent; model weights **frozen**.

## Minimal PyTorch sketch

```python
import torch
import torch.nn.functional as F

r = torch.randn(hidden_dim, requires_grad=True, device="cuda")
opt = torch.optim.Adam([r], lr=0.05)

for step in range(500):
    r_norm = F.normalize(r, dim=0)
    loss_abl = ablation_ce_loss(model, r_norm, harmful_batch, target_answer)
    loss_add = addition_ce_loss(model, r_norm, harmless_batch, target_refusal, layer=L_add)
    loss_ret = kl_retain_loss(model, r_norm, harmless_batch)
    loss = lam_abl * loss_abl + lam_add * loss_add + lam_ret * loss_ret
    opt.zero_grad()
    loss.backward()
    opt.step()

torch.save(r_norm.detach().cpu(), "rdo_direction.pt")
```

Hook implementation: register forward pre-hook on `blocks.{L}.hook_resid_post` to apply `h - (h·r)r`.

## After RDO

1. Save `rdo_direction.pt` per layer (or single global)
2. Bake into weights via [mlp-down-proj-abliteration.md](mlp-down-proj-abliteration.md) or Heretic-style LoRA delta
3. Eval vs DIM baseline on jailbreak + factory corpora

## Resources

- Paper: [arxiv 2502.17420](https://arxiv.org/html/2502.17420v2)
- Official code: TUM DAML geometry-of-refusal repository

## When to use

- Single DIM leaves >10% refusals after Heretic
- Research on independent refusal mechanisms
- Willing to tune `λ_abl`, `λ_add`, `λ_ret` and target strings per model family

→ [../techniques/beyond-single-direction.md](../techniques/beyond-single-direction.md)