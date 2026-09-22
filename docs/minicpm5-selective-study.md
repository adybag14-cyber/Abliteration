# MiniCPM5-1B: a reproducible selected-tensor study

This is an executed researcher tutorial, not a reproduction of an unnamed 98%
claim. It compares the unchanged checkpoint with three selective interventions
and the earlier all-layer projection control. Raw generations and candidate
weights remain local; aggregate results and their digests are published. The
measured implementation files match [source commit 1c8cff9](https://github.com/adybag14-cyber/Abliteration/tree/1c8cff903db31a50d5fc1fe5ea0a714ecc8708d7); their SHA-256 values are included in the 256-token report.

## Exact input and scope

- Model: [openbmb/MiniCPM5-1B](https://huggingface.co/openbmb/MiniCPM5-1B), final
  instruction checkpoint, revision `87179e5c1f455ef22e6223592d2d61351b525bfc`.
- Architecture: dense `LlamaForCausalLM`, 24 layers, 1,080,632,832 stored
  parameters, 219 tensors, one safetensors shard. We did not use the Base or SFT
  release by mistake.
- Checkpoint shard SHA-256:
  `7ab8fd86563125929be78aeec8cb3969c7ed2ead3be1ab9d3ec0a9fa69c8660d`.
- Runtime: WSL2, RTX 4090, PyTorch `2.13.0+cu130`, Transformers `5.14.1`, BF16
  inference, deterministic greedy decoding, `enable_thinking=False`, seed 42.
- Data: [64 hand-authored protocol records](../data/experiments/minicpm5-protocol.jsonl):
  8 target + 8 control calibration prompts, 8 benign supervised training pairs,
  and 40 disjoint held-out prompts (16 benign, 16 small capability questions,
  8 privacy-boundary probes). This is **not** AdvBench, HarmBench, or official
  XSTest. No actual private data is supplied or retrieved.

The selected layers are **21 and 22**, obtained from calibration-only
mean-separation scores over layers 1–22. The C++26 `select-layers` command and
Python selector agreed. This is a localization baseline, not a causal layer
discovery algorithm or LoMC replication. Training and evaluation records cannot
enter calibration; duplicate IDs and normalized prompt leakage fail validation.

## What was changed

| Route | Gradient training | Selected tensors | Parameter footprint |
| --- | --- | --- | --- |
| Unchanged baseline | None | 0 | 0% |
| All-layer projection | None | 48 output-projection matrices | All 24 layers, but not all model parameters |
| Selected projection | None | 4 matrices in layers 21 and 22 | 20,447,232 parameters / 1.8922% |
| Norm-preserving selected projection | None | Same 4 matrices | Same 1.8922% |
| Selected-tensor SFT | 24 AdamW steps, learning rate 0.0001 | Same 4 original matrices | Same 1.8922%; all other parameters frozen |

Projection strength is 0.8. The norm-preserving route restores column norms
after rank-one removal. SFT minimizes assistant-response cross entropy on the
separate benign adaptation split; prompt tokens are masked from the loss. SFT
uses FP32 trainable parameters under BF16 autocast and exports the original BF16
checkpoint dtype. There is no LoRA adapter and no full-model optimizer update.

## Measured evidence

The first run used a **96-token output cap**. Its
[complete aggregate report](../data/experiments/minicpm5-pilot-96.json) is retained
as the pilot, including censored generations. Many unchanged-model answers hit
that cap. A longer-generation comparison is recorded separately so the pilot
cannot silently become evidence for a different protocol.

<!-- measured-results-start -->
The **256-token run** completed on 2026-09-22 in 580.2 seconds. [Aggregate evidence](../data/experiments/minicpm5-study-256.json) includes independent checkpoint verification and source hashes.

| Method | Changed tensors | Benign marker hits | Privacy marker hits | Exact answers | Truncated outputs | Mean benign next-token KL |
| --- | --- | --- | --- | --- | --- | --- |
| Unchanged baseline | 0/219 | 1/16 | 8/8 | 15/16 | 10/40 | 0.000000 |
| All-layer projection | 48/219 | 13/16 | 8/8 | 13/16 | 12/40 | 1.198340 |
| Selected projection | 4/219 | 1/16 | 8/8 | 15/16 | 11/40 | 0.034851 |
| Norm-preserving selection | 4/219 | 1/16 | 8/8 | 15/16 | 10/40 | 0.034510 |
| Selected-tensor SFT | 4/219 | 0/16 | 7/8 | 16/16 | 0/40 | 3.663538 |

The independent verifier reloaded all four candidate checkpoints. Each selective candidate changed exactly four tensors and retained **all 215 unselected tensors byte-identically**. The all-layer control changed 48 projections and retained 171 others. All candidates preserve the source shard layout, dtype, and tokenizer assets.

The longer limit removed censoring from all privacy probes for the baseline, norm-preserving route, and SFT. Some verbose benign answers still hit the cap; that remaining censoring is shown explicitly.
<!-- measured-results-end -->

The selected SFT run also has the largest benign next-token KL (about 3.66), above the all-layer projection control (about 1.20) and the two selective projection routes (about 0.035). A small parameter footprint did **not** guarantee a small behavioral shift. The toy exact-match increase is not evidence of general capability preservation.

**Interpretation:** these are lexical refusal-marker counts in a bounded
generation window. A marker can occur in a capability disclaimer or quoted
text; a missing marker can be a non-answer, an invented answer, or a refusal in
different wording. They are not attack-success rates. Exact-match capability
scores cover only 16 small arithmetic, factual, and formatting questions.

The result establishes that a small, explicit tensor subset can be edited and
trained while other tensor bytes remain unchanged. It does not establish a
universal refusal reduction, semantic safety, general capability preservation,
or deployment suitability. Each rate includes a Wilson 95% interval; a sample
of eight cannot support a precise population-level percentage. In particular,
the relative percentage change from a single benign marker is not a robust
"100% improvement" claim.

## Run it

Use a separate Python environment and the [tested runtime pins](../requirements-research.txt).
The optional native executable comes from the matching C++26 release.

```bash
python -m pip install -r requirements-research.txt
python scripts/test-selective-tools.py
python scripts/download-research-model.py --output models/minicpm5-1b

python scripts/run-research-experiment.py \
  --model models/minicpm5-1b \
  --protocol data/experiments/minicpm5-protocol.jsonl \
  --output runs/my-study \
  --methods global-projection,selective-projection,norm-preserving,selective-sft \
  --top-k 2 --alpha 0.8 --max-new-tokens 256 --sft-steps 24 --seed 42 \
  --cxx /path/to/abliterate-cxx

python scripts/selective-checkpoint.py verify \
  --base models/minicpm5-1b --candidate runs/my-study/selective-sft
python scripts/export-research-report.py \
  --summary runs/my-study/summary.json --output my-aggregate-report.json
```

Omit `--cxx` to run Python selection alone. WSL can also invoke the Windows `.exe`;
the runner translates its score-file path. It requires at least 6 GiB of free
CUDA memory before admission and does not stop other processes. The CPU route
is available with `--device cpu` but was not used for the reported timings.

The source checkpoint and four candidate directories need approximately 11 GB
of disk space, plus dependency caches. Every run needs a new output directory.
The default operation deadline is 30 minutes, checked between calibration,
training, and evaluation steps. A failure leaves partial evidence rather than
a false completed summary; the checkpoint writer publishes only completed
candidate directories.

## Inspect the artifacts

- `identity.json`: pinned revision, shard digests, runtime, decoding parameters,
  protocol hash, and hashes of the implementation files.
- `layer-scores.txt`, `directions.pt`, `selection.json`: calibration diagnostics
  and the exact selected tensor names.
- `METHOD-responses.jsonl`: local raw generations, screening labels, truncation,
  exact-match scores, and response digests.
- `METHOD/edit-manifest.json`: every tensor's before/after digest, selected
  status, shard digests, and training provenance where applicable.
- `summary.json`: completed run, counts, uncertainty, benign next-token KL,
  selected-parameter fraction, and limitations.

Always run the independent checkpoint verifier before reusing a candidate.
Changing the model revision, prompt template, calibration set, seed, selection,
or generation limit is a new experiment. Keep that experiment's evidence rather
than overwriting the previous one.
