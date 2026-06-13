# Research landscape — refusal mechanisms & removal methods

Taxonomy of **papers**, **open-source tools**, and **when each method applies**. Updated Jun 2026.

---

## Timeline

| Year | Work | Contribution |
|------|------|--------------|
| 2024 | [Arditi et al. — single direction](https://arxiv.org/abs/2406.11717) | Mean-diff refusal vector; weight orthogonalization |
| 2024 | [Zou et al. — circuit breakers](https://arxiv.org/html/2406.04313v3) | **Defensive** training — orthogonalize harmful activations |
| 2024 | [Representation Engineering (RepE)](https://arxiv.org/abs/2310.01405) | Inference-time concept vectors |
| 2025 | [Jim Lai — projected abliteration](https://huggingface.co/blog/grimjim/projected-abliteration) | Subtract only refusal ⊥ harmless component |
| 2025 | [Jim Lai — norm-preserving biprojected](https://huggingface.co/blog/grimjim/norm-preserving-biprojected-abliteration) | Preserve row norms of weight matrices |
| 2025 | [Wollschläger et al. — concept cones](https://arxiv.org/html/2502.17420v2) | Multi-D refusal cones; gradient RDO |
| 2025 | [QCRI — more than single direction](https://arxiv.org/html/2602.02132v1) | 11 refusal categories; SAE latent structure |
| 2025+ | [Heretic](https://github.com/p-e-w/heretic) | Auto Optuna + projected + norm-preserving + MoE |

---

## Method families

```
                    Refusal intervention
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
   Inference-time      Weight surgery      Training-time
   (reversible)        (abliteration)      (alignment / CB)
        │                   │                   │
   ├─ RepE steer      ├─ Mean-diff DIM    ├─ RLHF / DPO
   ├─ Hook ablate     ├─ Projected        ├─ Circuit breakers
   ├─ Activation ±r   ├─ Norm-preserving  └─ Refusal-only SFT
   └─ Multi-dir steer ├─ Heretic kernel
                      ├─ Multi-direction PCA
                      ├─ Gradient RDO
                      ├─ MoE per-expert
                      └─ LoRA / QLoRA export
```

---

## Decision tree — which method?

```
Start: need refusal reduction on aligned model
│
├─ Reversible experiment only?
│   └─ Inference hook ablation OR RepE steering
│
├─ Permanent checkpoint, minimal tuning?
│   ├─ 8–12 GB VRAM → Heretic bnb_4bit + orthogonalize_direction=true
│   ├─ 24 GB+ → Heretic default (row_normalization=full)
│   └─ Research control → llm-abliteration --projected --normpreserve
│
├─ False refusals on factory/OSINT tools after abliteration?
│   └─ Jarvis QLoRA adapter (not more abliteration)
│
├─ Model still refuses after single-direction abliteration?
│   ├─ Try multi-direction PCA ablation (methods/multi-direction-ablation.md)
│   ├─ Try gradient RDO direction (techniques/beyond-single-direction.md)
│   └─ Domain-specific direction (factory-only harmful/harmless pairs)
│
├─ MoE model (Qwen-MoE, Phi-3.5-MoE, Granite hybrid)?
│   └─ Per-expert down_proj (techniques/moe-hybrid-abliteration.md)
│
├─ Capability collapse (KL/MMLU drop)?
│   ├─ Lower Heretic max_weight / narrower kernel
│   ├─ orthogonalize_direction = true
│   ├─ winsorization_quantile = 0.95
│   └─ partial strength α < 1.0
│
└─ Ship MB adapter not full weights?
    └─ LoRA export (methods/lora-adapter-export.md)
```

---

## Key theoretical tensions

| Claim | Nuance (2025–2026 research) |
|-------|------------------------------|
| "Single refusal direction" | **Approximately true** for safety harmful↔harmless DIM; **false** for full refusal taxonomy (11+ categories) |
| Linear steering = one knob | Different directions change **how** model refuses, not just **whether** |
| Abliteration = uncensoring | Removes **alignment direction**; does not add domain skills (use Jarvis/fine-tune) |
| Orthogonal directions = independent | [Concept cones paper](https://arxiv.org/html/2502.17420v2): need **representational independence** under intervention |

---

## Eval dimensions (always measure)

| Metric | Tool |
|--------|------|
| Refusal rate (harmful set) | Heretic `--evaluate-model`, custom JSONL |
| Over-refusal (benign set) | XSTest-style prompts in eval corpora |
| KL divergence (harmless) | Heretic built-in |
| Capability | MMLU subset, HumanEval, GSM8K |
| Agent tool-call | `data/eval/*-prompts.jsonl` |
| CyberGym | [use-cases/cybergym-benchmark.md](use-cases/cybergym-benchmark.md) |

---

## Related docs

| Doc | Content |
|-----|---------|
| [advanced-techniques-catalog.md](advanced-techniques-catalog.md) | Parameter & technique quick reference |
| [../instructions/advanced-abliteration-workflow.md](../instructions/advanced-abliteration-workflow.md) | Step-by-step advanced pipelines |
| [../techniques/README.md](../techniques/README.md) | Technique index (24 techniques) |
| [../instructions/eval-driven-workflow.md](../instructions/eval-driven-workflow.md) | Factory / XSTest eval gates |
| [../instructions/troubleshooting-encyclopedia.md](../instructions/troubleshooting-encyclopedia.md) | Symptom → fix |
| [../references.md](../references.md) | URLs & install commands |