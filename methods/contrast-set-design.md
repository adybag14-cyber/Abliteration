# Contrast-set design and confound control

The direction estimate is only as meaningful as the contrast that produced it.
Use an explicit dataset contract, deterministic splits, and competing baseline
designs before interpreting activation geometry.

## Input contract

Store one JSON object per line:

```json
{"id":"safety-001","prompt":"...","label":"bad","category":"safety","source":"dataset@revision","group_id":"template-07"}
{"id":"control-001","prompt":"...","label":"good","category":"general","source":"dataset@revision","group_id":"template-12"}
```

Here `bad` means the pool expected to elicit the target refusal behavior and
`good` means the control pool. The labels describe the measurement contrast;
they are not a claim that every prompt is morally good or bad.

Required fields are `prompt` and `label`. Add stable IDs, category, source
revision, and a paraphrase/template `group_id` whenever available.

## Baseline designs to compare

| Design | Benefit | Main confound |
|--------|---------|---------------|
| General harmless controls | Usually yields a strong direction | Topic and style differ between pools |
| Category-stratified controls | Tests category generalization | Sparse cells can be unstable |
| Topic-matched controls | Attempts to cancel topic | Can cancel the usable refusal component itself |
| Template counterfactuals | Controls surface form | Template artifacts may dominate |
| Output-conditioned labels | Tracks observed model behavior | Labels change with model/revision/decoding |

Do not choose by intuition alone. Extract candidates from at least a general
and a controlled design, then compare held-out causal interventions using
[direction-diagnostics-and-localization.md](direction-diagnostics-and-localization.md).
The pinned 2026 topic-matching study is a useful failure case, not a universal
ban: on its tested model, matching reduced the direction below the intervention
threshold.

## Leakage and balance audit

Before activation collection:

1. Normalize Unicode and whitespace for duplicate detection.
2. Reject the same normalized prompt under both labels.
3. Keep paraphrases and shared templates in one split using `group_id`.
4. Report label/category counts and sources.
5. Freeze the tokenizer, chat template, truncation, and final-token rule.
6. Keep the final test split untouched until the recipe is frozen.

Exact label balance is not automatically optimal, but severe imbalance makes a
plain mean difference noisy. Report reweighting or subsampling rather than
silently changing it.

## Repository tool

Prepare deterministic Heretic text inputs and a validation JSONL:

```bash
python scripts/prepare-contrast-set.py data/examples/contrast-set.sample.jsonl \
  --output-dir runs/contrast-v1 \
  --validation-fraction 0.25 \
  --seed model-family-and-revision
```

Outputs:

- `train-bad.txt` and `train-good.txt` for measurement;
- `validation.jsonl` retaining labels/categories for held-out scoring;
- `contrast-manifest.json` with input/output SHA-256 hashes, parameters, counts,
  duplicate audit, and warnings.

Use `--baseline-design topic-matched` only to record an intentional experiment;
the tool warns but does not rewrite prompts or manufacture counterfactuals.

## Advanced controls

- **Length control:** report token-count distributions and repeat the direction
  estimate on a length-overlap subset.
- **Template control:** use grouped splits; never let template siblings cross
  train and validation.
- **Source control:** hold out an entire dataset source to measure transfer.
- **Behavior control:** re-label a copy from frozen baseline generations to
  separate intended categories from actual refusals.
- **Sign stability:** bootstrap prompt rows and report how often direction sign
  flips at each layer.
- **Negative control:** shuffle labels and verify separation and intervention
  effects collapse.

## Evidence

- [Arditi et al., 2024](https://arxiv.org/abs/2406.11717)
- [COSMIC, 2025](https://arxiv.org/abs/2506.00085)
- [Failure of Topic-Matched Contrast Baselines, 2026](https://arxiv.org/abs/2603.22061)
