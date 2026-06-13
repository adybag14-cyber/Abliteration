# CyberGym benchmark integration

[CyberGym](https://cybergym.io) — UC Berkeley RDI — evaluates AI agents on **1,507 real-world vulnerabilities** across 188 OSS projects (OpenSSL, FFmpeg, etc.).

Paper: [arXiv:2506.02548](https://arxiv.org/abs/2506.02548)  
Blog: [rdi.berkeley.edu/blog/cybergym](https://rdi.berkeley.edu/blog/cybergym/)

## Why this matters for abliterated models

CyberGym measures **execution-based PoC reproduction**, not chat refusals. Top agents hit ~30% single-trial / ~67% @30 trials (2025 results). A common failure mode is **safety alignment blocking autonomous action** — models ask for confirmation instead of writing/running PoCs.

Abliteration targets exactly that refusal layer. Combine with:

- Strong coding agent (OpenHands, Codex CLI)
- Test-time scaling (multiple rollouts)
- Thinking/reasoning mode where available

## Setup outline

```bash
# Clone CyberGym (check cybergym.io for current repo URL)
git clone https://github.com/ucbepic/CyberGym.git tools/CyberGym   # verify upstream
cd tools/CyberGym
# follow repo README for Docker + task deps
```

Point your agent's LLM endpoint at a **local abliterated checkpoint** (vLLM, llama.cpp server, Ollama).

## Runner stub

Use the handbook runner stub for flow documentation, proxy task preparation, and lightweight trace analysis before wiring the full upstream CyberGym verifier:

```bash
python scripts/cybergym-eval-stub.py --help
python scripts/cybergym-eval-stub.py --print-flow
python scripts/cybergym-eval-stub.py --prepare-subset --count 50 --out data/eval/cybergym-subset-sample.jsonl
```

The stub writes illustrative proxy tasks (mapped from the cyber-research corpus + paper patterns) so you can iterate on prompts and agent harnesses locally. Replace with real task exports from the CyberGym repo for scored runs.

See also the CyberGym section in [../../docs/evaluation.md](../../docs/evaluation.md).

## Evaluation matrix

Track before/after abliteration on a **fixed subset** (~50 tasks) before full 1,507 run:

| Metric | Source |
|--------|--------|
| Single-trial success % | CyberGym verifier |
| Union success @6 rollouts | Test-time scaling |
| Refusal / confirm rate | Agent trace logs |
| KL / MMLU drift | Heretic eval |

## Agent tips from CyberGym findings

- **OpenHands** — efficient bash chaining beats script-heavy CTF agents on union success
- **GPT-5 high-reasoning** — large gain vs minimal reasoning on security tasks
- **Specialized SWE-only models** — poor transfer; general + abliterated often wins

## Factory ↔ CyberGym parallel

| CyberGym | Factory QA |
|----------|------------|
| Reproduce CVE PoC | Reproduce firmware regression test |
| Pre/post patch binary | Golden vs incoming firmware hash |
| Sanitizer crash = pass | Expected USB/disk inventory = pass |
| OSS-Fuzz docker env | Bench PC golden image |

Same agent stack; different verifier and prompt corpus.

## Citation

```bibtex
@misc{wang2025cybergym,
  title={CyberGym: Evaluating AI Agents' Cybersecurity Capabilities with Real-World Vulnerabilities at Scale},
  author={Zhun Wang and Tianneng Shi and Jingxuan He and Matthew Cai and Jialin Zhang and Dawn Song},
  year={2025},
  eprint={2506.02548},
  archivePrefix={arXiv},
  primaryClass={cs.CR}
}
```