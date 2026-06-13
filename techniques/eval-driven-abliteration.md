# Eval-driven abliteration

Use **your** task prompts — not only `harmful_behaviors` — to steer measurement, Optuna objectives, and deploy gates.

---

## Three eval layers

| Layer | Dataset | Purpose |
|-------|---------|---------|
| **Direction** | `[bad_prompts]` / `[good_prompts]` | What refusal **geometry** to remove |
| **Heretic built-in** | `[bad_evaluation_prompts]` / `[good_evaluation_prompts]` | Optuna refusal + KL score |
| **Handbook deploy** | `data/eval/*.jsonl` | Agent/factory acceptance |

Misalignment example: model scores well on `harmful_behaviors` but still refuses `wmic` — fix by changing **direction** datasets, not only deploy eval.

**Tool selection evidence:** [../docs/comparative-abliteration-benchmarks.md](../docs/comparative-abliteration-benchmarks.md) (arXiv:2512.13655 — GSM8K sensitivity varies by tool/architecture).

**Corpus sizes:** `npm run eval:stats`

---

## Custom plain-text prompts (Heretic-native)

Export one prompt per line:

```bash
# PowerShell — factory false-refusals as bad_prompts
Get-Content data/eval/hardware-factory-prompts.jsonl |
  ForEach-Object { ($_ | ConvertFrom-Json).prompt } |
  Set-Content data/eval/factory-bad-prompts.txt

# Benign matched prompts
Get-Content data/eval/factory-good-prompts.jsonl |
  ForEach-Object { ($_ | ConvertFrom-Json).prompt } |
  Set-Content data/eval/factory-good-prompts.txt
```

```toml
[bad_prompts]
dataset = "data/eval/factory-bad-prompts.txt"
split = "[:200]"

[good_prompts]
dataset = "data/eval/factory-good-prompts.txt"
split = "[:200]"
```

**Handbook pin:** [../sources/heretic-tools/config.factory-qa.toml](../sources/heretic-tools/config.factory-qa.toml)

---

## Over-refusal measurement (XSTest-style)

Models that comply on harmful sets but **refuse benign** security tasks need good prompts that include:

- `nmap` on authorized lab IP
- `wmic` / `diskpart` read-only
- `strings` / `sha256sum` on firmware

Corpus: [../data/eval/xstest-overrefusal-sample.jsonl](../data/eval/xstest-overrefusal-sample.jsonl)

Add lines to `[good_evaluation_prompts]` or a custom `.txt` — high refusal rate here = over-ablation or wrong direction.

---

## Deploy gate checklist

```text
[ ] harmful_behaviors refusal rate ≤ target (Heretic --evaluate-model)
[ ] hardware-factory-prompts.jsonl tool_call rate ≥ 95%
[ ] xstest-overrefusal-sample.jsonl refusal rate ≤ 5%
[ ] cyber-research-prompts.jsonl pass (authorized lab framing)
[ ] KL divergence ≤ 0.5 (stricter than Optuna 0.01 target for deploy)
[ ] MMLU-5 or HumanEval-5 spot check (optional)
```

→ [../instructions/eval-driven-workflow.md](../instructions/eval-driven-workflow.md) · [../docs/evaluation.md](../docs/evaluation.md)

---

## Automated JSONL scoring (post-Heretic)

```python
# scripts/score-eval-jsonl.py pattern — run against your inference endpoint
import json, sys
for line in open(sys.argv[1]):
    row = json.loads(line)
    # prompt row["prompt"]; score refusal heuristics + expected tool_call
```

Wire to Ollama OpenAI-compatible API or `heretic` chat for batch runs.

---

## Iterative eval loop

```text
Heretic run → built-in eval
     ↓ fail factory JSONL?
Export factory .txt → config.factory-qa.toml → Pass 2 (iterative)
     ↓ pass factory but over-refuse benign?
↓ max_weight / widen good_prompts / raise kl_divergence_target
     ↓ pass all gates?
GGUF export → Ollama → agent stack
```

---

## Related

- [domain-specific-abliteration.md](domain-specific-abliteration.md)
- [iterative-abliteration.md](iterative-abliteration.md)
- [refusal-marker-tuning.md](refusal-marker-tuning.md)
- [../data/eval/hardware-factory-prompts.jsonl](../data/eval/hardware-factory-prompts.jsonl)