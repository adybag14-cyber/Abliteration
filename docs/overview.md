# Overview

## Vocabulary

| Term | Meaning |
|------|---------|
| **Refusal direction** | A vector in hidden-state space whose presence correlates with the model entering a refusal / safety-response mode |
| **Residual stream** | The main hidden representation passed between transformer blocks |
| **Abliteration** | Permanent removal or attenuation of a refusal-related direction **in weights** |
| **Directional ablation** | Subtracting the component of an activation along a chosen direction (can be inference-time or baked into weights) |
| **Activation steering** | Adding/subtracting a direction at inference time — reversible, no checkpoint edit |
| **Harmful / harmless sets** | Curated prompt pairs used to estimate the mean activation difference that defines the refusal direction |

## High-level pipeline

```
1. Choose base model (safetensors / PyTorch checkpoint — often cloned from GitHub releases or a local path; HF IDs still work as model paths in most tools)
2. Build prompt datasets (harmful vs harmless — or refusal vs compliance)
3. Forward passes → collect residual activations per layer
4. Estimate refusal direction r_ℓ per layer (usually unit-normalized)
5. Choose abliteration strategy (MLP output, attn output, W_out projection…)
6. Apply weight update ΔW_ℓ to remove r_ℓ component
7. Save new checkpoint (safetensors)
8. Evaluate capability + refusal rate + safety regressions
```

## Abliteration vs alternatives

| Approach | Permanent? | Typical cost | Reversibility |
|----------|------------|--------------|---------------|
| Prompt jailbreak | No | Low | N/A |
| Activation steering | No | Medium VRAM | Instant (disable hook) |
| LoRA fine-tune on uncensored data | Yes | High GPU hours | Swap adapter |
| **Abliteration** | **Yes** | **Medium** (one-time analysis pass) | **Keep original weights** |
| **Abliteration + 4-bit (QLoRA load)** | **Yes** | **Low** (8 GB for 4B) | Keep original + quant config |
| **LoRA adapter export (ΔW)** | **Adapter** | **Low** infer VRAM | Detach adapter |
| **QLoRA Jarvis repair** | **Adapter** | **Low–med** train | Detach adapter |

## When abliteration works well

- Model family already studied (Llama, Qwen, Mistral variants have public recipes)
- Refusal is **concentrated** in a single direction per layer (often true for instruction-tuned models)
- You want a **standalone checkpoint** for agentic security / factory QA without steering hooks
- **False refusals** block `wmic`, `lspci`, firmware `strings`, CyberGym PoC builds, scoped `nmap`

### Production use cases (this repo)

| Domain | Why abliterate |
|--------|----------------|
| [Factory firmware QA](use-cases/factory-firmware-qa.md) | Bench PCs need USB/disk/BIOS enumeration without chat refusals |
| [Pentest / cyber analysis](use-cases/pentest-cyber-analysis.md) | Lab recon, binary analysis, CVE repro in authorized scope |
| [CyberGym](use-cases/cybergym-benchmark.md) | Agents must act autonomously on 1,507 real vuln tasks |
| [OSINT / Kali / hashcat](tools/README.md) | 600+ tool catalog for recon, cracking, web, AD, forensics |

Stack: Heretic abliteration → optional [Jarvis v7](../sources/jarvis-pack/IMPORT.md) tool-repair → `hardware-tool-gate.py` at runtime.

## When it struggles

- Refusal is distributed across many features (multi-direction / multi-head)
- Aggressive abliteration **damages** MMLU, coding, or reasoning scores
- Safety for *actually dangerous* requests collapses — see [risks-and-ethics.md](risks-and-ethics.md)

## Low VRAM quick paths

| Hardware | Start here |
|----------|------------|
| 8 GB GPU | [../instructions/low-vram-abliteration.md](../instructions/low-vram-abliteration.md) — Heretic `bnb_4bit` |
| 12 GB GPU, 8B model | 4-bit measure + sharded ablate |
| Inference-only 8 GB RAM | GGUF Q4 after cloud abliteration |
| LoRA / QLoRA theory | [../techniques/lora-qlora-abliteration.md](../techniques/lora-qlora-abliteration.md) |

## Advanced methods (2025–2026)

| Method | Doc |
|--------|-----|
| Projected + norm-preserving | [../techniques/projected-norm-preserving-abliteration.md](../techniques/projected-norm-preserving-abliteration.md) |
| Multi-direction / concept cones | [../techniques/beyond-single-direction.md](../techniques/beyond-single-direction.md) |
| MoE per-expert | [../techniques/moe-hybrid-abliteration.md](../techniques/moe-hybrid-abliteration.md) |
| Geometric median + winsorization | [../techniques/geometric-median-winsorization.md](../techniques/geometric-median-winsorization.md) |
| Steering & alternatives | [../techniques/steering-and-alternatives.md](../techniques/steering-and-alternatives.md) |

Full index: [research-landscape.md](research-landscape.md) · [advanced-techniques-catalog.md](advanced-techniques-catalog.md)

## Beginners improving local models

1. [../instructions/setup-environment.md](../instructions/setup-environment.md)
2. [../instructions/beginner-local-model-guide.md](../instructions/beginner-local-model-guide.md)
3. [../instructions/run-locally-ollama-lmstudio.md](../instructions/run-locally-ollama-lmstudio.md)

## Next steps

- Theory: [theory.md](theory.md)
- Technique catalog: [../techniques/README.md](../techniques/README.md)
- Advanced workflow: [../instructions/advanced-abliteration-workflow.md](../instructions/advanced-abliteration-workflow.md)
- Tool catalog: [tools/abliteration-tooling.md](tools/abliteration-tooling.md)
- Run something: [../instructions/quickstart.md](../instructions/quickstart.md)