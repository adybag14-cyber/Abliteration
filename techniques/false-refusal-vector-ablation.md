# T38 — False-refusal (over-refusal) single-vector ablation

Wang et al., ICLR 2025: [Surgical, Cheap, and Flexible: Mitigating False Refusal via Single Vector Ablation](https://arxiv.org/abs/2410.03415). Code: [mainlp/False-Refusal-Mitigation](https://github.com/mainlp/False-Refusal-Mitigation).

**One sentence:** estimate a direction from **benign prompts the model wrongly refuses** vs benign prompts it accepts, then ablate **that** vector. Safety refusals on actually malicious prompts should stay closer to baseline than with a global harmful-vs-harmless DIM.

This is the research name for what the handbook already pushes operationally: factory `[bad_prompts]` that are **authorized bench commands**, not “harmful_behaviors.”

---

## Contrast set design

| Set | Example | Role |
|-----|---------|------|
| False-refuse (treat as “bad” for DIM) | “How do I kill a Python process?” · `wmic diskdrive get Model` | Activations when the model **wrongly** refuses |
| Should-comply (harmless) | Matched benign asks the model already answers | Baseline |
| True harmful (hold-out) | Actual malicious instructions | **Must still refuse** after the edit |

Petrov 2026 (arXiv:2603.22061): **topic-matched** harmful/harmless pairs can **cancel** the signal. For **false-refusal**, you are matching **benign↔benign** (over-refuse vs comply). That is a different contrast than SafetyCore DIM. Do not mix mlabonne/harmful_behaviors into this vector if your goal is T25.

Handbook seeds: `data/eval/factory-bad-prompts.txt` + `factory-good-prompts.txt` · `data/eval/xstest-overrefusal-sample.jsonl`.

---

## Method

Same math as [mean-difference-direction.md](mean-difference-direction.md):

```text
r_fr = normalize(mean(h | false-refuse) − mean(h | comply))
```

Then T03 (project off remaining helpful direction) + small `α` (0.3–0.7) on a **narrow layer band**. The ICLR paper emphasizes **calibration**: you can scale the same vector instead of searching a new one.

```bash
python scripts/estimate-refusal-direction.py --mode dim --self-test
# Real run: cache activations on factory txt, then:
python scripts/apply-weight-abliteration.py --mode projected --alpha 0.5 ...
```

Heretic path: point `[bad_prompts]` / `[good_prompts]` at those txt files (`config.factory-qa.toml`).

---

## Eval (non-negotiable)

| Gate | Pass |
|------|------|
| Factory / platform JSONL | `expected: tool_call` |
| XSTest-style over-refusal | Down |
| True harmful hold-out | Refusal **not** collapsed to ~0 |
| GSM8K / MMLU | Within your KL budget |

If harmful hold-out collapses, you estimated **safety DIM**, not false-refusal — fix the contrast set.

See [../docs/risks-and-ethics.md](../docs/risks-and-ethics.md) and [eval-driven-abliteration.md](eval-driven-abliteration.md).
