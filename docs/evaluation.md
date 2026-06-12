# Evaluation

Always evaluate **before and after** abliteration. Keep the original checkpoint.

## Refusal rate

1. Build a benchmark list (100–500 prompts) spanning:
   - Benign requests that aligned models wrongly refuse
   - Standard harmful-policy prompts (to measure safety regression)
2. Generate with fixed decoding (`temperature=0`, `top_p=1`)
3. Classify responses:
   - **Refusal** — contains apology / policy / "I can't"
   - **Compliance** — attempts the task
   - **Degenerate** — empty, loops, unicode spam

Report: `% refusal`, `% compliance`, `% degenerate`.

## Capability benchmarks (sanity check)

Run a **subset** (full suites are expensive):

| Benchmark | What it catches |
|-----------|-----------------|
| MMLU (5-shot subset) | General knowledge collapse |
| GSM8K sample | Math reasoning damage |
| HumanEval sample | Code quality regression |
| MT-Bench / simple QA | Instruction following |

**Rule of thumb:** if MMLU drops >5 absolute points, reduce abliteration strength or fewer layers.

## Qualitative probes

- Multi-turn conversations (does refusal return in turn 2?)
- Roleplay / fiction (often over-refused pre-abliteration)
- JSON / tool-call formatting (structure should survive)

## Logging checklist

```
[ ] Original model hash / revision
[ ] Prompt dataset version for direction estimation
[ ] Layers ablated + strength α per layer
[ ] Eval date + decoding params
[ ] Refusal % / capability scores table
[ ] Notes on failure modes observed
```