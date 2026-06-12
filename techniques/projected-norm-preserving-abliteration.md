# Projected & norm-preserving abliteration

Refinements by **Jim Lai** (2025), implemented in **Heretic** and **llm-abliteration**. Reduce capability damage vs raw Arditi orthogonalization.

**Sources:** [projected abliteration](https://huggingface.co/blog/grimjim/projected-abliteration) · [norm-preserving biprojected](https://huggingface.co/blog/grimjim/norm-preserving-biprojected-abliteration) · [Heretic concepts](https://p-e-w-heretic.mintlify.app/concepts/abliteration)

---

## Problem with raw mean-diff abliteration

Classic direction:

```
r = normalize(mean(h_bad) - mean(h_good))
W' = P_⊥ W,   P_⊥ = I - r rᵀ
```

Harmful and harmless activations are **not** symmetric — the refusal vector often has a component **parallel to the harmless centroid** `g`. Removing full `r` can delete useful "helpful assistant" features, raising KL divergence and hurting MMLU/coding.

---

## Projected abliteration

Subtract only the refusal component **orthogonal to the harmless direction**:

```python
import torch.nn.functional as F

g = F.normalize(good_means, dim=-1)          # per-layer harmless mean
r = bad_means - good_means
r_proj = r - (r * g).sum(-1, keepdim=True) * g
r_proj = F.normalize(r_proj, dim=-1)
```

**Heretic:**

```toml
orthogonalize_direction = true
```

**llm-abliteration:**

```bash
python measure.py ... --projected
python sharded_ablate.py config.yaml --projected
```

**When to enable:** almost always for production agents. Disable only for ablation studies comparing to Arditi baseline.

---

## Norm-preserving (biprojected) weight edit

Raw `W' = P_⊥ W` changes **row L2 norms** of weight matrices. Downstream matmuls scale differently → logit drift.

### Modes (Heretic `row_normalization`)

| Mode | Behavior |
|------|----------|
| `none` | Basic LoRA-style delta `ΔW = -λ v (vᵀ W)` |
| `pre` | Compute delta on row-normalized `W`; scale LoRA_B by original row norms |
| `full` | Apply ablation, renormalize rows to original magnitudes, express remainder as **rank-r SVD LoRA** |

```toml
row_normalization = "full"
full_normalization_lora_rank = 3
```

Rank 3 is default; increase if eval shows norm reconstruction error or KL spike.

### llm-abliteration equivalent

```bash
python sharded_ablate.py config.yaml --projected --normpreserve
```

---

## Heretic LoRA implementation (technical)

Heretic does **not** always materialize full `W'` in FP16 during search. It applies abliteration as **PEFT LoRA** on target modules:

```
ΔW = -λ · v · (vᵀ W)
lora_A = vᵀ W    (shape 1 × in_features)
lora_B = -λ · v   (shape out_features × 1)
```

Works with **4-bit quantized** base weights via `bnb.functional.dequantize_4bit` during delta computation.

For `row_normalization = full`, low-rank SVD approximates the norm-restoration residual:

```python
U, S, Vh = torch.svd_lowrank(W_delta, q=2*r+4, niter=6)
lora_B = U[:, :r] @ diag(sqrt(S[:r]))
lora_A = diag(sqrt(S[:r])) @ Vh[:r, :].T
```

---

## Recommended production stack

```toml
orthogonalize_direction = true
row_normalization = "full"
full_normalization_lora_rank = 8
winsorization_quantile = 0.95   # if model has massive activations
kl_divergence_target = 0.01
```

```bash
pip install -U heretic-llm bitsandbytes
heretic Qwen/Qwen3-4B-Instruct-2507
```

---

## Eval checklist

| Check | Pass |
|-------|------|
| Refusal rate (harmful) | ≤ baseline Heretic benchmarks |
| KL (harmless) | Lower than `orthogonalize_direction = false` |
| Factory tool prompts | Compliance ↑ without new harmful compliance |
| MMLU / coding subset | ≤3 pt drop vs projected-only |

→ [../methods/projected-llm-abliteration.md](../methods/projected-llm-abliteration.md) · [../instructions/advanced-abliteration-workflow.md](../instructions/advanced-abliteration-workflow.md)