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

## Next steps

- Theory: [theory.md](theory.md)
- Technique catalog: [../techniques/README.md](../techniques/README.md)
- Run something: [../instructions/quickstart.md](../instructions/quickstart.md)