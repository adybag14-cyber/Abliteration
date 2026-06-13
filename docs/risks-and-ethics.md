# Operational scope & responsible use

This handbook covers abliteration for **authorized environments** only:

- Factory firmware QA benches (air-gapped or VLAN-isolated)
- Internal pentest labs with written rules of engagement
- CyberGym / academic security research sandboxes
- DFIR on owned infrastructure

Deploy only on systems and networks you own or have explicit permission to test. Keep original model weights and label all modified checkpoints.

**Runtime enforcement:** use [../scripts/hardware-tool-gate.py](../scripts/hardware-tool-gate.py) — model edits alone are not a security boundary. The gate intercepts destructive or out-of-scope commands at inference time for agent use cases.

## Capability sanity gates (ethical requirement)

Abliteration removes refusal / over-refusal but **must preserve** the model's core capabilities for its intended use. In security, factory, or research contexts, a model that becomes compliant yet loses tool-calling precision, reasoning depth, or code generation fidelity creates new risks: missed vulnerabilities, hallucinated commands, or agents that appear "jailbroken" but are unreliable.

**Post-abliteration capability checks are mandatory before any deployment or sharing of weights.**

Use the [eval-driven workflow](../instructions/eval-driven-workflow.md) (and its deploy gate checklist) together with the capability benchmarks in [../docs/evaluation.md](../docs/evaluation.md#capability-benchmarks-sanity):

| Benchmark | Threshold (vs base / original checkpoint) |
|-----------|-------------------------------------------|
| MMLU subset | ≤ 3 pt drop |
| GSM8K sample | ≤ 5 pt drop |
| HumanEval sample | No large regression |

Additional agentic gates (enforced via the eval-driven workflow and corpora):

- hardware-factory-prompts.jsonl: ≥ 95% correct tool/command compliance
- xstest-overrefusal-sample.jsonl: ≤ 5% refusal on benign authorized prompts
- Spot checks on cyber-research, osint-pentest, zig-security, platform-eval, jarvis-safe, and cybergym-subset

See full matrices, pass/fail rules, and refresh commands in [../instructions/eval-driven-workflow.md](../instructions/eval-driven-workflow.md) and [../docs/evaluation.md](../docs/evaluation.md).

Only proceed to GGUF export / Ollama deploy / agent integration when both refusal reduction **and** capability sanity are satisfied. Archive the original checkpoint for rollback.

## Tool selection via comparative benchmarks

Abliteration backend choice (Heretic Optuna, ErisForge single-pass, DECCP, llm-abliteration projected, etc.) is **not neutral** for agentic reliability. Per cross-architecture eval research, GSM8K/math and tool-calling regressions differ measurably by tool + model family. A pipeline that looks good on KL alone can still degrade command compliance on factory or CyberGym-style tasks.

**Before locking a recipe for any agentic deployment:**

- Consult [../docs/comparative-abliteration-benchmarks.md](../docs/comparative-abliteration-benchmarks.md) (arXiv:2512.13655) for GSM8K deltas, architecture notes, and Heretic vs single-pass trade-offs on your target family.
- Gate the chosen backend end-to-end against the **exact use-case corpora** using the eval-driven workflow:
  - Factory firmware QA: [../docs/use-cases/factory-firmware-qa.md](../docs/use-cases/factory-firmware-qa.md) (hardware-tool-gate + JSONL compliance)
  - Pentest & cyber analysis: [../docs/use-cases/pentest-cyber-analysis.md](../docs/use-cases/pentest-cyber-analysis.md) (OSINT/recon/playbooks)
  - CyberGym proxy: [../docs/use-cases/cybergym-benchmark.md](../docs/use-cases/cybergym-benchmark.md) (1,507 real vuln execution tasks)
- Re-run capability spot checks (MMLU/GSM8K slices + xstest-overrefusal + jarvis-safe) post-edit.

See also the full agentic stack in [../instructions/agentic-security-stack.md](../instructions/agentic-security-stack.md) and hardware gate enforcement in [../scripts/hardware-tool-gate.py](../scripts/hardware-tool-gate.py).

## Risks of skipping gates or scope violations

- **Capability collapse**: Model stops refusing harmful prompts but also fails to execute the very factory/pentest/OSINT tasks it was abliterated to enable. Result: wasted lab time and false confidence.
- **Silent degradation**: KL drift or MMLU/GSM8K drops that only appear under load or on edge prompts; agents produce plausible-but-wrong command sequences.
- **Scope creep**: Applying the same recipe outside authorized benches (e.g. consumer chat or production user-facing) can surface retained harmful capabilities or remove useful guardrails in unintended domains.
- **Eval gaming**: Relying solely on Heretic KL without the JSONL acceptance tests or capability slices lets low-quality ablations ship.
- **Tool selection risk (cross-architecture)**: Different abliteration implementations (Heretic Optuna vs single-pass DECCP/ErisForge) show measurable differences in GSM8K/MMLU regression on the same models per arXiv:2512.13655. A tool that excels at KL on one architecture may silently degrade reasoning/tool-calling on another. Always consult the comparative evidence before locking a recipe for agentic workloads.

Mitigate by cross-referencing the full [comparative-abliteration-benchmarks.md](../docs/comparative-abliteration-benchmarks.md) when choosing between Heretic, ErisForge, DECCP, or llm-abliteration for your target model family. For agentic deployments, gate the chosen pipeline against the exact use-case corpora (factory, pentest, CyberGym proxy) via the eval-driven workflow.

Mitigations are built into this handbook:
- Always run `npm run eval:stats`, the factory good/bad pairs, jarvis-safe filter, and cybergym stub before/after.
- Follow [../instructions/eval-driven-workflow.md](../instructions/eval-driven-workflow.md) step-by-step (corpora choice → Heretic profile → JSONL gate → capability spot checks).
- Use `hardware-tool-gate.py` at runtime for any agent that will execute commands.
- Cross-reference [techniques/eval-driven-abliteration.md](../techniques/eval-driven-abliteration.md) for the measurement theory and [instructions/advanced-abliteration-workflow.md](../instructions/advanced-abliteration-workflow.md) for full pipelines that include the sanity gates.
- Consult [../docs/comparative-abliteration-benchmarks.md](../docs/comparative-abliteration-benchmarks.md) (arXiv:2512.13655) for tool/architecture-specific capability preservation data before selecting an abliteration backend for factory, pentest, or CyberGym-style agent use cases. Pair every choice with the authorized scope and post-edit labeling rules in this document.

## Labeling and provenance

Every released or transferred checkpoint must:
- Retain the exact original model ID + revision in metadata/filename
- Document the exact abliteration recipe (Heretic config + flags, or manual script + seeds)
- Record eval results: refusal % , tool_call % , KL, MMLU/GSM8K delta, and corpus versions
- Carry an explicit "AUTHORIZED LAB USE ONLY" notice matching the scope above

This handbook's [evaluation](../docs/evaluation.md) and eval-driven workflow sections are the primary mechanisms to keep abliteration responsible within its documented bounds.

See also: [agentic-security-stack.md](../instructions/agentic-security-stack.md) for layered controls (abliteration + repair + runtime gate).

**Agentic use-case evals & benchmarks:** [../docs/use-cases/factory-firmware-qa.md](../docs/use-cases/factory-firmware-qa.md) · [../docs/use-cases/pentest-cyber-analysis.md](../docs/use-cases/pentest-cyber-analysis.md) · [../docs/use-cases/cybergym-benchmark.md](../docs/use-cases/cybergym-benchmark.md) · [../docs/comparative-abliteration-benchmarks.md](../docs/comparative-abliteration-benchmarks.md) (tool selection evidence for capability-safe agentic deployment) · [../docs/evaluation.md](../docs/evaluation.md) (corpora + sanity thresholds).