# Selective interventions: choose where, then choose how

This September 2026 addition preserves the earlier handbook and operators. The
[interactive planner](https://adybag14-cyber.github.io/Abliteration/#selective)
shows an actual MiniCPM5-1B tensor budget, and the
[measured walkthrough](minicpm5-selective-study.md) reports the local experiment.

## Four different units

| Unit | Meaning | What it does not establish |
| --- | --- | --- |
| Safetensors shard | Storage container holding named tensors | A layer boundary or an optimization target |
| Tensor | One named parameter array, such as an output-projection matrix | That every value in it changes, or that it uniquely controls a behavior |
| Layer or component | An architectural location containing several tensors | Compatibility with a different architecture |
| Learned adapter or neuron mask | A restricted update parameterization | Equivalence to training the original selected matrices |

MiniCPM5-1B at the pinned revision has **219 tensors in one shard**. Its `o_proj`
shape is **1536 × 2048**, not 1536 × 1536: query-head dimensions need not equal
the residual width. Its `down_proj` shape is **1536 × 4608**. Editing those two
families in two layers selects **4 tensors / 20,447,232 parameters / 1.8922%**
of the checkpoint's stored parameters. See the [inspected layout](../data/models/minicpm5-1b-layout.json).

## What the literature changes

[LoMC, arXiv:2606.13709](https://arxiv.org/abs/2606.13709) selects a compact
support before computing and applying correction directions. Its evidence is
for routed MoE and hybrid-MoE backbones. The dense selective helper here follows
the general principle of an explicit edit support; it does **not** implement
LoMC's expert localization or reproduce its results.

[NeST, arXiv:2602.16835](https://arxiv.org/abs/2602.16835) probes and clusters
safety-relevant neurons, then learns shared updates while freezing other
parameters. Its purpose is **safety strengthening**. Whole-tensor SFT in this
repository is a simpler control, not NeST or evidence for a 98% reduction claim.

[DDO, arXiv:2609.16204](https://arxiv.org/abs/2609.16204) demonstrates that a
contrastive estimator can be diverted toward a decoy. Consequently, a large
calibration separation score does not prove a direction causally mediates
refusal. Use reversible interventions and held-out evaluation before inferring
that a selected component has the intended function.

The [new annotated catalog](research-september-2026.md) distinguishes primary
references, implemented operators, and measured examples. The recalled
"over 98%" result has not been identified. No helper or page treats it as a
verified universal outcome.

## Implemented routes

1. **Selected output projection:** apply a rank-one residual-space projection
   to exact `model.layers.N.self_attn.o_proj.weight` and/or
   `model.layers.N.mlp.down_proj.weight` names. No optimizer is involved.
2. **Column-norm-preserving projection:** restore each original column norm
   after projection. This does not preserve the singular spectrum or guarantee
   utility. An erased nonzero column is rejected.
3. **Selected-tensor SFT:** freeze all parameters, enable gradients only for the
   planned tensors, and train on a separate supervised split. The experiment
   uses benign adaptation examples. It is neither full-model SFT nor LoRA.
4. **All-layer projection control:** retain the historical projection route on
   every output projection. It still does not edit embeddings, norms, or all
   checkpoint parameters. Compare this control with the smaller footprint.

The new checkpoint writer supports floating-point **dense Llama-layout**
checkpoints. MoE, packed/quantized tensors, fused projections, unknown names, and
missing selected components fail validation. Do not relabel unsupported models
to bypass these checks. The legacy architecture-specific routes remain in the
[method index](../methods/README.md).

## Inspect, plan, apply, verify

```bash
python scripts/selective-checkpoint.py inspect --model models/minicpm5-1b
python scripts/selective-checkpoint.py plan --model models/minicpm5-1b \
  --layers 21,22 --modules o_proj,down_proj --output plan.json
python scripts/selective-checkpoint.py apply --model models/minicpm5-1b \
  --layers 21,22 --modules o_proj,down_proj \
  --direction runs/my-study/directions.pt --mode norm-preserving --alpha 0.8 \
  --output outputs/selected-candidate
python scripts/selective-checkpoint.py verify \
  --base models/minicpm5-1b --candidate outputs/selected-candidate
```

The layer numbers above are the tutorial's calibration selection, not a
recommendation for another dataset or revision. A directions file may contain
one vector or a mapping from string layer indices to vectors. Estimate directions
using the same model, chat template, and residual position as your intervention.

The writer requires a new output directory outside the source. It keeps shard
layout, dtype, tokenizer assets, chat template, index, and safetensors metadata.
Unchanged shards are copied exactly. The edit manifest records every tensor's
before/after SHA-256 plus shard digests; `verify` independently reloads both
checkpoints and rejects any unexpected change. Partial exports never become the
final output directory. Source weights are never edited in place.

The existing helper also accepts `--layers 21,22 --modules o_proj,down_proj` to
use this verified route. Its no-selection legacy behavior remains available.

## Native C++26 helpers

```bash
abliterate-cxx select-layers --scores runs/my-study/layer-scores.txt --count 2
abliterate-cxx apply --mode norm-preserving \
  --weight tiny-W.txt --direction r.txt --alpha 0.8 --out W-selected.txt
```

The score file is the existing text-matrix format: `N 2`, then zero-based layer
IDs and finite nonnegative calibration scores. Ties choose the lower layer ID;
returned IDs are sorted. The model runner can cross-check its selection with
`--cxx /path/to/abliterate-cxx`. The C++ executable handles numerical matrices
and layer plans; Transformers and safetensors handle real checkpoint inference,
training, and serialization. This distinction is part of the support contract.
