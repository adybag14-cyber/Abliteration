# MoE & hybrid architecture abliteration

Mixture-of-Experts and **linear-attention hybrid** models require **per-expert** and **per-layer-type** targets. Heretic handles many architectures automatically — manual pipelines must mirror its module map.

**Source:** [Heretic directional ablation docs](https://p-e-w-heretic.mintlify.app/concepts/abliteration)

---

## Architecture → module map

| Model family | Abliteration targets |
|--------------|---------------------|
| Dense (Llama, Qwen, Gemma) | `layer.self_attn.o_proj`, `layer.mlp.down_proj` |
| Qwen3 MoE | `layer.mlp.experts[e].down_proj` for **each expert** |
| Phi-3.5-MoE | `layer.block_sparse_moe.experts[e].w2` |
| Granite MoE hybrid (attn layer) | `layer.shared_mlp.output_linear` |
| Granite MoE hybrid (MoE layer) | `layer.moe.experts[e].output_linear` |
| Qwen3.5 hybrid (linear attn) | `layer.linear_attn.out_proj` |

**Rule:** target **output projections** that write to the residual stream — not `q_proj` / `gate_proj` inputs.

---

## Why experts matter

Each expert's `down_proj` can carry refusal writes independently. Abliterating only the shared router or one expert leaves refusal paths in inactive experts.

**Heretic:** iterates all experts when building the optimization graph.

**Manual:** loop experts in `sharded_ablate.py` config or custom script:

```python
for layer in model.model.layers:
    if hasattr(layer.mlp, "experts"):
        for expert in layer.mlp.experts:
            expert.down_proj.weight.data = ablate_down_proj(
                expert.down_proj.weight.data, r_layer, alpha
            )
```

---

## VRAM considerations (MoE)

| Issue | Mitigation |
|-------|------------|
| Many experts × large matrices | `quantization = bnb_4bit` |
| Router + all experts loaded | `device_map` + `max_memory` CPU offload |
| Optuna trials slow | Reduce `n_trials`; use smaller MoE (e.g. 30B-A3B not 235B) |

MoE abliteration on **consumer GPU** often requires 4-bit + cloud GPU for initial Heretic run, then GGUF for local inference.

---

## Hybrid linear attention (Qwen3.5)

Some layers use `linear_attn` instead of standard `self_attn`. `o_proj` may be absent — use `linear_attn.out_proj` for those layer indices only.

**Verify in model:**

```python
for i, layer in enumerate(model.model.layers):
    has_sa = hasattr(layer, "self_attn") and hasattr(layer.self_attn, "o_proj")
    has_la = hasattr(layer, "linear_attn")
    print(i, "self_attn" if has_sa else "", "linear_attn" if has_la else "")
```

---

## Eval notes

- MoE models may show **expert routing shift** post-abliteration — monitor perplexity on domain prompts.
- KL eval per Heretic still applies; add expert-load entropy check if available.

---

## Related

- [../methods/moe-expert-abliteration.md](../methods/moe-expert-abliteration.md)
- [../instructions/low-vram-abliteration.md](../instructions/low-vram-abliteration.md)