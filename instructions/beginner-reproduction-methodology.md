# Beginner reproduction methodology

Reproducible **safety guardrail abliteration** — remove excessive refusal from weights while keeping the original checkpoint intact.

**Theory & gates:** [../techniques/safety-guardrail-abliteration-methodology.md](../techniques/safety-guardrail-abliteration-methodology.md)  
**Operational walkthrough (tracks A/B/C):** [beginner-local-model-guide.md](beginner-local-model-guide.md)

**Goal:** Take a small public instruct model, produce one abliterated copy locally, and verify the edited model is less refusal-heavy on bundled benign evals while the original checkpoint stays untouched.

**Scope:** Local authorized lab use. Use the repo's bundled eval files — do not invent new risky prompts for the first run.

**Leading edge (optional read):** [../techniques/multi-category-refusal-beginners-guide.md](../techniques/multi-category-refusal-beginners-guide.md) — QCRI 2026 explains why single-direction Heretic still works and when factory-specific prompts matter.

---

## What a successful run looks like

You should end with:

- an untouched `*-ORIGINAL` backup
- one new abliterated model folder
- a short evaluation record with the exact config and model name
- a local inference check that loads the edited model without errors
- over-refusal rate **lower** than base on `xstest-overrefusal-sample.jsonl`
- benign prompts in `factory-good-prompts.jsonl` still answered

---

## Recommended starting point

Use the repo's own beginner flow:

1. [setup-environment.md](setup-environment.md)
2. [beginner-local-model-guide.md](beginner-local-model-guide.md)
3. [run-locally-ollama-lmstudio.md](run-locally-ollama-lmstudio.md)

Optional exploratory check:

- [quickstart.md](quickstart.md) — temporary hook-based test before permanent weight edit

---

## Minimum prerequisites

- NVIDIA GPU recommended (8 GB+ with low-VRAM profile)
- Python 3.10 or newer
- Enough disk for base model plus one copy (~30 GB minimum)
- Hugging Face account if the model is gated
- Permission to modify the model you are working with
- [../docs/risks-and-ethics.md](../docs/risks-and-ethics.md) read

On Windows with an 8 GB card, prefer **WSL2** for the surgery step. See [setup-environment.md](setup-environment.md).

---

## Reproducible procedure

### 1) Prepare the environment

Follow [setup-environment.md](setup-environment.md) through the smoke test.

Target checks:

```text
Python: installed
PyTorch: installed
CUDA available: True  (or False if only preparing files)
bitsandbytes: OK
accelerate: OK
heretic-llm: OK
```

If `python scripts/check_env.py` fails, fix the environment before continuing.

### 2) Choose one model and back it up

Pick a single model and keep it fixed for the whole run.

Suggested first model:

- `Qwen/Qwen2.5-1.5B-Instruct`

```bash
huggingface-cli download Qwen/Qwen2.5-1.5B-Instruct --local-dir ./models/Qwen2.5-1.5B-Instruct
cp -r ./models/Qwen2.5-1.5B-Instruct ./models/Qwen2.5-1.5B-Instruct-ORIGINAL
```

Do not overwrite the backup during later experiments.

### 3) Freeze run metadata

Record in `run-notes.md`:

- model name and revision
- date
- machine / GPU
- config file used (`config.low-vram.toml` vs `config.production.toml`)
- whether built-in Heretic eval was accepted

### 4) Select the config profile

| Hardware | Profile |
|----------|---------|
| 8 GB VRAM | `sources/heretic-tools/config.low-vram.toml` |
| 12 GB+ | `sources/heretic-tools/config.production.toml` |

```bash
cp sources/heretic-tools/config.low-vram.toml config.toml
```

Low-VRAM profile already enables **projected + norm-preserving** guardrail removal with lower KL — see [../techniques/projected-norm-preserving-abliteration.md](../techniques/projected-norm-preserving-abliteration.md).

### 5) Run the edit

Run Heretic on the working copy, **not** the backup:

```bash
heretic ./models/Qwen2.5-1.5B-Instruct
```

Save to a new folder:

```text
./models/Qwen2.5-1.5B-Instruct-abliterated
```

### 6) Evaluate with bundled corpora

Use repo eval files only:

| File | Checks |
|------|--------|
| `data/eval/factory-good-prompts.jsonl` | Benign operational prompts still comply |
| `data/eval/xstest-overrefusal-sample.jsonl` | False-refusal rate dropped vs base |

**First-run pass condition:**

- benign prompts still answer
- over-refusal sample refusal rate drops vs base
- output remains fluent

Do not chase perfect scores on the first run.

### 7) Compare base vs edited

Same prompts, both models. Answer:

1. Did false-refusal decrease?
2. Do benign prompts still work?
3. Did general quality collapse?

If #3 is yes — restore `*-ORIGINAL` and retry with low-VRAM profile or fewer trials.

### 8) Export or deploy locally

After comparison looks reasonable:

→ [run-locally-ollama-lmstudio.md](run-locally-ollama-lmstudio.md)

### 9) Roll back if needed

Restore the backup immediately if you see:

- broken or repetitive output
- failed load in local runtime
- large quality drop on benign prompts
- confusion about which folder is edited

---

## Simple record template

```text
Model:
Base backup:
Edited output:
Config file:
Hardware:
Date:
Eval sets used:
Refusal change (base vs edited):
Benign quality:
Rollback needed?:
```

---

## Beginner decision rule

Keep the first run simple.

| Outcome | Action |
|---------|--------|
| Benign answers OK + less over-refusal | Keep edited checkpoint; proceed to export |
| Unreliable output | Restore backup; use low-VRAM profile; reduce strength |
| Still refuses factory prompts | Second pass with factory bad/good prompts — [eval-driven-workflow.md](eval-driven-workflow.md) |

---

## Related docs

- [../techniques/safety-guardrail-abliteration-methodology.md](../techniques/safety-guardrail-abliteration-methodology.md) — full methodology
- [setup-environment.md](setup-environment.md)
- [quickstart.md](quickstart.md)
- [beginner-local-model-guide.md](beginner-local-model-guide.md)
- [low-vram-abliteration.md](low-vram-abliteration.md)
- [troubleshooting-encyclopedia.md](troubleshooting-encyclopedia.md)