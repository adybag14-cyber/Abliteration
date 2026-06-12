# Attention o_proj abliteration

## Target

```
block.self_attn.o_proj   # Linear: num_heads * head_dim → hidden_size
```

Refusal signal sometimes couples through attention mixing — ablating `o_proj` can complement MLP edits.

## Caution

Attention layers are more sensitive — start with **lower α** and fewer layers than MLP recipe.

## Procedure

Same projection as MLP method but on `o_proj.weight` with the **same** `r_ℓ` estimated at post-attention residual (not post-MLP) if you want consistency.

## Combined strategy

1. Abliterate MLP bands at α=0.75
2. If false refusals remain, add `o_proj` on top 3 layers at α=0.25
3. Re-evaluate capability suite