# References

> **Source policy:** GitHub repos and arXiv first. Hugging Face is listed for weights and the heretic/abliterated model registry. Refresh with `npm run fetch:all` (or `fetch:heretic` / `fetch:docs` / `fetch:web-research` / `fetch:hf-models:firefox`).

## Primary papers

| Title | Link | GitHub reproduction |
|-------|------|---------------------|
| Refusal in LLMs is mediated by a single direction | [arXiv:2406.11717](https://arxiv.org/abs/2406.11717) | [andyrdt/refusal_direction](https://github.com/andyrdt/refusal_direction) |
| Accessible summary | [LessWrong](https://www.lesswrong.com/posts/jGuXSZgv6qfdhMCuJ/refusal-in-llms-is-mediated-by-a-single-direction) | — |
| The Geometry of Refusal — concept cones | [arXiv:2502.17420](https://arxiv.org/html/2502.17420v2) | [TUM geometry-of-refusal](https://www.cs.cit.tum.de/daml/geometry-of-refusal/) |
| More to refusal than a single direction (QCRI) | [arXiv:2602.02132](https://arxiv.org/abs/2602.02132) · [PDF](https://arxiv.org/pdf/2602.02132) | Handbook: [techniques/multi-category-refusal-beginners-guide.md](techniques/multi-category-refusal-beginners-guide.md) |
| Representation Engineering | [arXiv:2310.01405](https://arxiv.org/abs/2310.01405) | RepE ecosystem |
| Circuit Breakers (defensive) | [arXiv:2406.04313](https://arxiv.org/html/2406.04313v3) | [GraySwanAI/circuit-breakers](https://github.com/GraySwanAI/circuit-breakers) |
| Projected abliteration (blog) | [grimjim/projected](https://huggingface.co/blog/grimjim/projected-abliteration) | llm-abliteration `--projected` |
| Norm-preserving biprojected (blog) | [grimjim/norm-preserving](https://huggingface.co/blog/grimjim/norm-preserving-biprojected-abliteration) | `--normpreserve` |
| Heretic concepts (live) | [mintlify Heretic](https://p-e-w-heretic.mintlify.app/concepts/abliteration) | [p-e-w/heretic](https://github.com/p-e-w/heretic) |

## Tools (GitHub — preferred)

| Project | URL | Role |
|---------|-----|------|
| **Heretic** | [github.com/p-e-w/heretic](https://github.com/p-e-w/heretic) | Fully automatic abliteration + Optuna search |
| **llm-abliteration** | [github.com/jim-plus/llm-abliteration](https://github.com/jim-plus/llm-abliteration) | measure.py → analyze.py → sharded_ablate.py |
| **refusal_direction** | [github.com/andyrdt/refusal_direction](https://github.com/andyrdt/refusal_direction) | Paper pipeline, `direction.pt` artifacts |
| **TransformerLens** | [github.com/TransformerLensOrg/TransformerLens](https://github.com/TransformerLensOrg/TransformerLens) | Hooks, residual analysis |
| **FailSpy/abliterator** | [github.com/FailSpy/abliterator](https://github.com/FailSpy/abliterator) | TransformerLens hooks; mechanistic prototyping |
| **remove-refusals-with-transformers** | [github.com/Sumandora/remove-refusals-with-transformers](https://github.com/Sumandora/remove-refusals-with-transformers) | Pure Transformers, no TransformerLens |
| **wassname/abliterator** | [github.com/wassname/abliterator](https://github.com/wassname/abliterator) | Community implementation |
| **ErisForge** | [github.com/Tsadoq/ErisForge](https://github.com/Tsadoq/ErisForge) | Layer-band single-pass; ExpressionRefusalScorer |
| **NousResearch/llm-abliteration** | [github.com/NousResearch/llm-abliteration](https://github.com/NousResearch/llm-abliteration) | Sharded manual pipeline; `--deccp` measure |
| **abliterate.cpp** | [github.com/kabachuha/abliterate.cpp](https://github.com/kabachuha/abliterate.cpp) | GGUF measure → llm-abliteration (WIP) |
| **Abliterix** | [github.com/wuwangzhang1216/abliterix](https://github.com/wuwangzhang1216/abliterix) | Optuna multi-objective; 150+ configs; HonestAbliterationBench |
| **DECCP** | [github.com/AUGMXNT/deccp](https://github.com/AUGMXNT/deccp) | Multilingual deccp topics for `measure.py --deccp` |
| **GraySwan circuit-breakers** | [github.com/GraySwanAI/circuit-breakers](https://github.com/GraySwanAI/circuit-breakers) | Defensive alignment (contrast) |

Heretic also mirrors to [codeberg.org/p-e-w/heretic](https://codeberg.org/p-e-w/heretic).

**Alternative tools (arXiv:2512.13655 benchmarks):**

```bash
# ErisForge — single-pass toolkit (often better GSM8K preservation on subset)
pip install erisforge   # verify package name on github.com/Tsadoq/ErisForge README
git clone https://github.com/Tsadoq/ErisForge.git && cd ErisForge && pip install -e .

# DECCP — deccp topics + single-pass (see repo for model-specific usage)
git clone https://github.com/AUGMXNT/deccp.git && cd deccp && pip install -r requirements.txt
```

→ [docs/comparative-abliteration-benchmarks.md](docs/comparative-abliteration-benchmarks.md) · [techniques/extended-abliteration-toolkit.md](techniques/extended-abliteration-toolkit.md)

**Tool selection for responsible use:** GSM8K capability deltas and architecture-specific findings in the comparative benchmarks directly inform risk mitigation. Pair any tool decision with the capability sanity gates, post-edit labeling, and authorized scope rules in [docs/risks-and-ethics.md](docs/risks-and-ethics.md). 

For agentic workloads, also cross-reference:
- Full eval-driven workflow + gate checklist: [instructions/eval-driven-workflow.md](instructions/eval-driven-workflow.md)
- Use-case evals: [docs/use-cases/factory-firmware-qa.md](docs/use-cases/factory-firmware-qa.md) · [docs/use-cases/pentest-cyber-analysis.md](docs/use-cases/pentest-cyber-analysis.md) · [docs/use-cases/cybergym-benchmark.md](docs/use-cases/cybergym-benchmark.md)
- Detailed agentic security stack: [instructions/agentic-security-stack.md](instructions/agentic-security-stack.md)

See the dedicated "Tool selection via comparative benchmarks" section + "Agentic use-case evals & benchmarks" list in [docs/risks-and-ethics.md](docs/risks-and-ethics.md) and the bidirectional links + responsible selection guidance in [docs/comparative-abliteration-benchmarks.md](docs/comparative-abliteration-benchmarks.md).

**Pinned in this repo:** [sources/heretic-tools/](sources/heretic-tools/) · [docs/tools/heretic-tools-reference.md](docs/tools/heretic-tools-reference.md)

## Heretic / abliterated models (Hugging Face)

| Resource | URL |
|----------|-----|
| Live browse | [huggingface.co/models?other=heretic](https://huggingface.co/models?other=heretic) |
| Registry (JSONL) | [data/heretic-models-registry.jsonl](data/heretic-models-registry.jsonl) |
| Human table | [docs/tools/heretic-models-registry.md](docs/tools/heretic-models-registry.md) |
| Handbook seeds | [data/heretic-models-registry.seed.jsonl](data/heretic-models-registry.seed.jsonl) |

## Live documentation

| Site | URL |
|------|-----|
| abliteration.ai docs | [docs.abliteration.ai](https://docs.abliteration.ai/what-is-abliteration) |
| Agent doc index | [docs.abliteration.ai/llms.txt](https://docs.abliteration.ai/llms.txt) |
| Heretic README (fetched) | [sources/fetched/heretic-readme.txt](sources/fetched/heretic-readme.txt) |
| CyberGym paper (fetched) | [sources/fetched/cybergym-arxiv.txt](sources/fetched/cybergym-arxiv.txt) |
| OpenHands README (fetched) | [sources/fetched/openhands-readme.txt](sources/fetched/openhands-readme.txt) |
| hashcat README (fetched) | [sources/fetched/hashcat-readme.txt](sources/fetched/hashcat-readme.txt) |
| Kali metapackages (fetched) | [sources/fetched/kali-metapackages.txt](sources/fetched/kali-metapackages.txt) |

## Low VRAM & LoRA tooling

| Project | URL | Role |
|---------|-----|------|
| **bitsandbytes** | [bitsandbytes-foundation/bitsandbytes](https://github.com/bitsandbytes-foundation/bitsandbytes) | Heretic `bnb_4bit`, QLoRA load |
| **PEFT** | [huggingface/peft](https://github.com/huggingface/peft) | LoRA adapter export & infer |
| **Unsloth** | [unslothai/unsloth](https://github.com/unslothai/unsloth) | Fast QLoRA (Jarvis repair) |
| **Accelerate** | [huggingface/accelerate](https://github.com/huggingface/accelerate) | `max_memory` CPU offload |
| **llama.cpp** | [ggml-org/llama.cpp](https://github.com/ggml-org/llama.cpp) | `convert_hf_to_gguf.py`, `convert_lora_to_gguf.py` |
| **GGUF-my-LoRA** | [spaces/ggml-org/gguf-my-lora](https://huggingface.co/spaces/ggml-org/gguf-my-lora) | Web PEFT → GGUF LoRA |
| **grimjim abliteration LoRA** | [grimjim/Llama-3-Instruct-abliteration-LoRA-8B](https://huggingface.co/grimjim/Llama-3-Instruct-abliteration-LoRA-8B) | Refusal removal as adapter |
| **vLLM** | [vllm-project/vllm](https://github.com/vllm-project/vllm) | Agent API + LoRA slots |
| **mlx-lm** | [ml-explore/mlx-examples](https://github.com/ml-explore/mlx-examples) | Apple Silicon inference |
| **export-abliteration-lora.py** | [scripts/export-abliteration-lora.py](scripts/export-abliteration-lora.py) | ΔW → adapter safetensors |

Guides: [docs/toolchain-safetensors-gguf-lora.md](docs/toolchain-safetensors-gguf-lora.md) · [methods/safetensor-abliteration-pipeline.md](methods/safetensor-abliteration-pipeline.md) · [methods/gguf-export-notes.md](methods/gguf-export-notes.md) · [techniques/lora-qlora-abliteration.md](techniques/lora-qlora-abliteration.md)

## Install commands (from upstream, Jun 2026)

```bash
# Heretic — PyPI package built from GitHub
pip install -U heretic-llm bitsandbytes accelerate
heretic Qwen/Qwen3-4B-Instruct-2507
# Low VRAM: quantization = "bnb_4bit" in config.toml

# Or clone for reproducible uv.lock
git clone https://github.com/p-e-w/heretic.git
cd heretic && uv run heretic <model>

# Manual pipeline (4-bit measure)
git clone https://github.com/jim-plus/llm-abliteration.git
cd llm-abliteration && pip install -r requirements.txt
python measure.py -m <model_path> -o directions.pt --quant 4bit --projected
python sharded_ablate.py config.yml --projected --normpreserve

# GGUF merged deploy
python llama.cpp/convert_hf_to_gguf.py ./abliterated --outfile model-q4_k_m.gguf --outtype q4_k_m

# LoRA sidecar deploy
python scripts/export-abliteration-lora.py --base ./base --abliterated ./out --out ./adapter --rank 16
python llama.cpp/convert_lora_to_gguf.py --outfile lora.gguf --base-model-id <id> --lora-path ./adapter
```

**Toolchain overview:** [docs/toolchain-safetensors-gguf-lora.md](docs/toolchain-safetensors-gguf-lora.md)

## Validation & agent loop

```bash
npm run validate    # links, jsonl, pins, python — exit 0 required before commit
npm run ralph       # validate → refresh pins → re-validate (max 3)
```

→ [docs/ralph-loop.md](docs/ralph-loop.md) · [docs/agent-development-loop.md](docs/agent-development-loop.md) · Benchmarks: [docs/comparative-abliteration-benchmarks.md](docs/comparative-abliteration-benchmarks.md) · [arXiv:2512.13655](https://arxiv.org/abs/2512.13655)

## Agentic security & evaluation

| Project | URL | Role |
|---------|-----|------|
| **CyberGym** | [cybergym.io](https://cybergym.io) · [arXiv:2506.02548](https://arxiv.org/abs/2506.02548) | 1,507 real-world vuln tasks for agent scoring |
| **OpenHands** | [github.com/OpenHands/OpenHands](https://github.com/OpenHands/OpenHands) | Bash-chaining agent (CyberGym top performer) |
| **JARVIS Tool Repair v7** | [sources/jarvis-pack/IMPORT.md](sources/jarvis-pack/IMPORT.md) | SFT/DPO tool-use repair (48k rows, local) |
| **hardware-tool-gate** | [scripts/hardware-tool-gate.py](scripts/hardware-tool-gate.py) | Runtime ALLOW / CONFIRM / BLOCK for terminal calls |
| **Command catalog** | [docs/hardware-command-catalog.md](docs/hardware-command-catalog.md) | Factory / firmware / lab read-only diagnostics |

Use-case guides: [factory-firmware-qa.md](docs/use-cases/factory-firmware-qa.md) · [pentest-cyber-analysis.md](docs/use-cases/pentest-cyber-analysis.md) · [cybergym-benchmark.md](docs/use-cases/cybergym-benchmark.md)

**Benchmarks & ethics for agentic selection:** Choose abliteration backends using evidence from [docs/comparative-abliteration-benchmarks.md](docs/comparative-abliteration-benchmarks.md) (GSM8K sensitivity by tool/architecture, Heretic vs single-pass tradeoffs) and always enforce the gates + provenance in [docs/risks-and-ethics.md](docs/risks-and-ethics.md). See the new "Tool selection via comparative benchmarks" section there for use-case-specific gating steps (factory/pentest/CyberGym corpora via eval-driven-workflow).

Full pipeline including eval corpora and runtime gate: [instructions/agentic-security-stack.md](instructions/agentic-security-stack.md). Use-case guides: [docs/use-cases/factory-firmware-qa.md](docs/use-cases/factory-firmware-qa.md) · [docs/use-cases/pentest-cyber-analysis.md](docs/use-cases/pentest-cyber-analysis.md) · [docs/use-cases/cybergym-benchmark.md](docs/use-cases/cybergym-benchmark.md).

## Security tool catalogs (OSINT / Kali / hashcat)

| Resource | URL |
|----------|-----|
| **Handbook hub** | [docs/tools/README.md](docs/tools/README.md) |
| Kali tools (official) | [kali.org/tools](https://www.kali.org/tools/) |
| Kali metapackages | [kali.org/docs/general-use/metapackages](https://www.kali.org/docs/general-use/metapackages/) |
| **hashcat** | [hashcat.net](https://hashcat.net/hashcat/) · [GitHub](https://github.com/hashcat/hashcat) |
| hashcat wiki | [hashcat.net/wiki](https://hashcat.net/wiki/) |
| OSINT Framework | [osintframework.com](https://osintframework.com/) |
| Exploit-DB / searchsploit | [exploit-db.com](https://www.exploit-db.com/) |
| SecLists wordlists | [github.com/danielmiessler/SecLists](https://github.com/danielmiessler/SecLists) |
| Impacket | [github.com/fortra/impacket](https://github.com/fortra/impacket) |
| BloodHound | [github.com/SpecterOps/BloodHound](https://github.com/SpecterOps/BloodHound) |
| Nuclei | [github.com/projectdiscovery/nuclei](https://github.com/projectdiscovery/nuclei) |

## Platform tooling (Windows / macOS / Zig)

| Resource | Link |
|----------|------|
| Windows catalog | [docs/tools/windows-tooling.md](docs/tools/windows-tooling.md) |
| macOS catalog | [docs/tools/macos-tooling.md](docs/tools/macos-tooling.md) |
| Zig catalog | [docs/tools/zig-tooling.md](docs/tools/zig-tooling.md) |
| Generated examples | [data/examples/README.md](data/examples/README.md) |
| **Zig (canonical)** | [github.com/adybag14-cyber/zig](https://github.com/adybag14-cyber/zig) `master` |
| Zig 0.17 syntax doc | [docs/tools/zig-canonical-syntax.md](docs/tools/zig-canonical-syntax.md) |
| **Zig upstream** | [ziglang.org](https://ziglang.org/) · [codeberg.org/ziglang/zig](https://codeberg.org/ziglang/zig) |
| Zig 0.16 release notes | [ziglang.org/download/0.16.0/release-notes.html](https://ziglang.org/download/0.16.0/release-notes.html) |
| Zig targets | `zig targets` / [documentation/master](https://ziglang.org/documentation/master/) |

## Interpretability & SAE

| Resource | URL |
|----------|-----|
| GemmaScope SAEs | [huggingface.co/google/gemma-scope-9b-it-res](https://huggingface.co/google/gemma-scope-9b-it-res) |
| Llama 3.1 SAEs | [andyrdt/saes-llama-3.1-8b-instruct](https://huggingface.co/andyrdt/saes-llama-3.1-8b-instruct) |
| PaCMAP (Heretic plots) | [YingfanWang/PaCMAP](https://github.com/YingfanWang/PaCMAP) |

## Advanced handbook sections

| Doc | Topic |
|-----|-------|
| [docs/research-landscape.md](docs/research-landscape.md) | Method taxonomy & decision tree |
| [docs/advanced-techniques-catalog.md](docs/advanced-techniques-catalog.md) | Parameters & math |
| [instructions/advanced-abliteration-workflow.md](instructions/advanced-abliteration-workflow.md) | Multi-track workflows |
| [docs/tools/abliteration-tooling.md](docs/tools/abliteration-tooling.md) | Full tool stack |

## Related concepts

- **Activation steering** — inference-time only (reversible)
- **Directional ablation** — subtract refusal component from activations or weights
- **Norm-preserving biprojected abliteration** — Jim Lai / llm-abliteration `--normpreserve --projected`
- **Gradient RDO** — optimized refusal direction (TUM 2025)
- **Multi-direction subspace** — PCA / category-specific directions
- **Context7** — up-to-date dependency docs → [docs/context7.md](docs/context7.md)