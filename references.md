# References

> **Source policy:** GitHub repos and arXiv first. Hugging Face is listed only where upstream projects still host weights or legacy blog posts. Refresh with `node scripts/fetch-docs.mjs`.

## Primary papers

| Title | Link | GitHub reproduction |
|-------|------|---------------------|
| Refusal in LLMs is mediated by a single direction | [arXiv:2406.11717](https://arxiv.org/abs/2406.11717) | [andyrdt/refusal_direction](https://github.com/andyrdt/refusal_direction) |
| Accessible summary | [LessWrong](https://www.lesswrong.com/posts/jGuXSZgv6qfdhMCuJ/refusal-in-llms-is-mediated-by-a-single-direction) | — |

## Tools (GitHub — preferred)

| Project | URL | Role |
|---------|-----|------|
| **Heretic** | [github.com/p-e-w/heretic](https://github.com/p-e-w/heretic) | Fully automatic abliteration + Optuna search |
| **llm-abliteration** | [github.com/jim-plus/llm-abliteration](https://github.com/jim-plus/llm-abliteration) | measure.py → analyze.py → sharded_ablate.py |
| **refusal_direction** | [github.com/andyrdt/refusal_direction](https://github.com/andyrdt/refusal_direction) | Paper pipeline, `direction.pt` artifacts |
| **TransformerLens** | [github.com/TransformerLensOrg/TransformerLens](https://github.com/TransformerLensOrg/TransformerLens) | Hooks, residual analysis |
| **FailSpy/abliterator** | [github.com/FailSpy/abliterator](https://github.com/FailSpy/abliterator) | Early public abliterator |
| **remove-refusals-with-transformers** | [github.com/Sumandora/remove-refusals-with-transformers](https://github.com/Sumandora/remove-refusals-with-transformers) | Pure Transformers, no TransformerLens |
| **wassname/abliterator** | [github.com/wassname/abliterator](https://github.com/wassname/abliterator) | Community implementation |
| **ErisForge** | [github.com/Tsadoq/ErisForge](https://github.com/Tsadoq/ErisForge) | Toolkit |
| **deccp** | [github.com/AUGMXNT/deccp](https://github.com/AUGMXNT/deccp) | Dataset / deccp topics for measurement |

Heretic also mirrors to [codeberg.org/p-e-w/heretic](https://codeberg.org/p-e-w/heretic).

## Live documentation

| Site | URL |
|------|-----|
| abliteration.ai docs | [docs.abliteration.ai](https://docs.abliteration.ai/what-is-abliteration) |
| Agent doc index | [docs.abliteration.ai/llms.txt](https://docs.abliteration.ai/llms.txt) |
| Heretic README (fetched) | [sources/fetched/heretic-readme.txt](sources/fetched/heretic-readme.txt) |
| CyberGym paper (fetched) | [sources/fetched/cybergym-arxiv.txt](sources/fetched/cybergym-arxiv.txt) |
| OpenHands README (fetched) | [sources/fetched/openhands-readme.txt](sources/fetched/openhands-readme.txt) |

## Install commands (from upstream, Jun 2026)

```bash
# Heretic — PyPI package built from GitHub
pip install -U heretic-llm
heretic Qwen/Qwen3-4B-Instruct-2507

# Or clone for reproducible uv.lock
git clone https://github.com/p-e-w/heretic.git
cd heretic && uv run heretic <model>

# Manual pipeline
git clone https://github.com/jim-plus/llm-abliteration.git
cd llm-abliteration && pip install -r requirements.txt
python measure.py -m <model_path> -o directions.pt
```

## Agentic security & evaluation

| Project | URL | Role |
|---------|-----|------|
| **CyberGym** | [cybergym.io](https://cybergym.io) · [arXiv:2506.02548](https://arxiv.org/abs/2506.02548) | 1,507 real-world vuln tasks for agent scoring |
| **OpenHands** | [github.com/OpenHands/OpenHands](https://github.com/OpenHands/OpenHands) | Bash-chaining agent (CyberGym top performer) |
| **JARVIS Tool Repair v7** | [sources/jarvis-pack/IMPORT.md](sources/jarvis-pack/IMPORT.md) | SFT/DPO tool-use repair (48k rows, local) |
| **hardware-tool-gate** | [scripts/hardware-tool-gate.py](scripts/hardware-tool-gate.py) | Runtime ALLOW / CONFIRM / BLOCK for terminal calls |
| **Command catalog** | [docs/hardware-command-catalog.md](docs/hardware-command-catalog.md) | Factory / firmware / lab read-only diagnostics |

Use-case guides: [factory-firmware-qa.md](docs/use-cases/factory-firmware-qa.md) · [pentest-cyber-analysis.md](docs/use-cases/pentest-cyber-analysis.md) · [cybergym-benchmark.md](docs/use-cases/cybergym-benchmark.md)

Full stack workflow: [instructions/agentic-security-stack.md](instructions/agentic-security-stack.md)

## Related concepts

- **Activation steering** — inference-time only (reversible)
- **Directional ablation** — subtract refusal component from activations or weights
- **Norm-preserving biprojected abliteration** — Jim Lai / llm-abliteration `--normpreserve --projected`
- **Context7** — up-to-date dependency docs → [docs/context7.md](docs/context7.md)