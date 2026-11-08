# LFM3-1.7B: reproducible benign refusal and capability evaluation

This walkthrough investigates unnecessary refusal on benign requests using the **instruction-tuned `LiquidAI/LFM3-1.7B`** checkpoint. It compares an unchanged baseline with one predeclared context-aware system prompt. It reuses the handbook's experimental discipline: immutable inputs, separate calibration and held-out data, an unchanged reference, complete output accounting, and uncertainty. It does not perform weight surgery or train the model to comply with harmful requests.

The objective is a lower **benign false-refusal** rate with useful answers. There is no defensible guarantee of a global minimum refusal rate. A model that says nothing, emits nonsense, or answers harmful requests has not satisfied that objective. The executable screen below counts lexical markers; a semantic refusal rate requires separate adjudication.

## What is pinned

| Component | Identity |
| --- | --- |
| Instruction-tuned model | `LiquidAI/LFM3-1.7B` |
| Model revision | `0dc4268b561499c648c7ba7c9466bf3d8d01517a` |
| Parameters | 1,728,801,536 |
| Weights | One BF16 safetensors shard; 3,457,635,448 bytes |
| Weight SHA-256 | `135922caef64e81e52af88ede8b7c3ddaa9d6da220a9737fb3065275dbfb4330` |
| Architecture | `Lfm3ForCausalLM`; 24 layers: 13 convolution, 5 sliding attention, 6 full attention |
| Runtime | Python 3.12; PyTorch 2.13.0 with CUDA 13.0; Transformers 5.22.2 |
| Model runtime files | Eleven files, including all three custom Python files, tokenizer, template, generation configuration and license |
| Capability evaluator | `lm_eval` 0.4.13, upstream commit `ddd67220430a2470529f25fd5c05a576ca1057a0` |

The [model lock](../data/models/lfm3-1.7b.json) contains every file size and SHA-256. The [model card](https://huggingface.co/LiquidAI/LFM3-1.7B), [Liquid AI deployment documentation](https://docs.liquid.ai/deployment/gpu-inference/transformers), and pinned configuration establish the checkpoint identity. This is a hybrid architecture: the older dense MiniCPM tensor selections in this repository are not an LFM3 implementation.

The inspected checkpoint requires custom model code. The downloader verifies that code before inference, and the runner uses only the verified local files with Hub access disabled. Its optional Hub kernels are disabled. Transformers 5.14.1, used by the earlier MiniCPM study, failed to import this checkpoint's `use_kernel_func_from_hub_with_fallback` integration. The separate [LFM3 requirements](../requirements-lfm3.txt) preserve the older study environment and pin the working LFM3 runtime.

## Prepare a native WSL workspace

Use the source revision associated with the published report or research toolkit's `PACKAGE-MANIFEST.json`. Keep a record of it. These commands run in a **WSL Linux shell**, from the repository root; the environment, weights and generated responses live on the native Linux filesystem.

```bash
export LFM3_ROOT="$HOME/lfm3-study-20261108"
mkdir -p "$LFM3_ROOT"
git rev-parse HEAD > "$LFM3_ROOT/source-commit.txt"
python3.12 -m venv "$LFM3_ROOT/.venv"
source "$LFM3_ROOT/.venv/bin/activate"
python -m pip install --upgrade pip
python -m pip install torch==2.13.0 --index-url https://download.pytorch.org/whl/cu130
python -m pip install -r requirements-lfm3.txt -c requirements-lfm3-linux-cu130.lock.txt
python -m pip check
python -m pip freeze > "$LFM3_ROOT/environment.txt"
python scripts/test-lfm3-evaluation.py
```

Use an NVIDIA driver supporting the selected CUDA wheel. The measured device is an RTX 4090. The GPU runner checks for at least 8 GiB currently free, caps its PyTorch allocation at 40% of device memory, and uses six CPU threads. That allocation cap is not a total-system GPU limit; other applications and CUDA libraries have their own allocations. Run the two model-evaluation commands sequentially. The script will fail rather than stop unrelated processes to make room.

Download and prepare the frozen inputs:

```bash
python scripts/download-research-model.py \
  --lock data/models/lfm3-1.7b.json \
  --output "$LFM3_ROOT/model"
python scripts/prepare-lfm3-evaluation.py \
  --output "$LFM3_ROOT/protocol"
```

The downloader verifies all eleven files and writes `source-lock.json`. Preparation verifies source byte hashes and row counts, then writes `protocol.jsonl` and `protocol-lock.json`. The frozen protocol has **366 rows**: 16 calibration prompts and 350 held-out prompts. Its SHA-256 is `baad7fadee4b77cee30c4c5c4d38bc1a8057b1fd17bdab2e984378a6e69b432e`.

| Cohort | Rows | Treatment |
| --- | ---: | --- |
| Repository calibration v1 | 16 | Hand-authored benign prompts, disjoint from test prompts; both profiles evaluated before selection |
| XSTest safe | 250 | Only records labelled `safe` from the 450-record source |
| JailbreakBench benign | 100 | Only `Goal` from `data/benign-behaviors.csv`; `Target` is never an assistant prefill or training answer |

Source revisions, licenses, selectors and file hashes are in the [benign dataset lock](../data/benchmarks/lfm3-benign.json). The [XSTest authors](https://github.com/paul-rottger/xstest) provide safe prompts designed to expose exaggerated safety behaviour. The [JailbreakBench dataset](https://huggingface.co/datasets/JailbreakBench/JBB-Behaviors) contains distinct benign and harmful subsets; evaluating the benign subset does not produce a jailbreak score.

## Run a pilot, then the full benign study

```bash
timeout 1800 python scripts/run-lfm3-evaluation.py \
  --model "$LFM3_ROOT/model" \
  --protocol "$LFM3_ROOT/protocol/protocol.jsonl" \
  --output "$LFM3_ROOT/pilot" \
  --test-limit 2 --batch-size 4 --timeout-seconds 1500
```

The pilot generates 40 responses: both profiles on all 16 calibration prompts and two test prompts per dataset. It verifies loading and the evidence path. Its tiny test subsets do not estimate full benchmark performance. Check its terminal `status.json` and `summary.json` before launching the full run.

```bash
timeout 7500 python scripts/run-lfm3-evaluation.py \
  --model "$LFM3_ROOT/model" \
  --protocol "$LFM3_ROOT/protocol/protocol.jsonl" \
  --output "$LFM3_ROOT/study" \
  --batch-size 4 --timeout-seconds 7200
python scripts/export-lfm3-report.py \
  --run "$LFM3_ROOT/study" \
  --protocol "$LFM3_ROOT/protocol/protocol.jsonl" \
  --model "$LFM3_ROOT/model" \
  --output "$LFM3_ROOT/benign-report.json"
```

Every output directory must be new. Do not combine partial files from interrupted runs or overwrite a prior measurement. The full run produces **732 responses**: 32 calibration plus 700 held-out generations. The external `timeout` bounds the process; an interrupted process is not a completed benchmark. Exit 2 with `needs-review` means the run finished but contains invalid or censored output. The exporter can retain such a result honestly, with affected rates set to `null`; it rejects incomplete runs. For a Windows-created Git worktree accessed from WSL, add `--git-executable git.exe` to the export command so source-revision verification uses the same Git implementation that created the worktree. Native Linux clones use the default `git`.

Both profiles use BF16, SDPA attention, seed 42, greedy decoding, repetition penalty 1.1, a maximum of 2,048 new tokens, a 4,096-token input cap, batch size four, left padding, and `enable_thinking=False`. Prompts exceeding the input limit fail instead of being silently truncated. Tokens after the first EOS are removed before deciding whether a batched response was censored. Keep batch size fixed when comparing reproductions: deterministic settings do not imply identical text across hardware, kernels, library versions or batch shapes.

The baseline has no system message. The context profile asks the assistant to interpret benign computing, figurative, academic and fictional requests in context, while still declining requests that facilitate harm. The exact text is in [the evaluation contract](../scripts/lfm3_evaluation.py) and exported report. There are no jailbreak suffixes, harmful answer targets, projection vectors or learned adapters in this study.

The choice is locked **before held-out generation**: exclude calibration profiles containing invalid/censored output, then choose the fewest calibration marker hits, breaking ties in favour of the baseline. Both profiles are still reported on held-out data. A better-looking test result must not retroactively change that choice.

## Read the evidence correctly

`identity.json` records the actual runtime, decoding, model/protocol locks and hashes of the four measurement source files. `selection-before-test.json` records the calibration decision. Raw benign responses remain in the local `responses.jsonl` file. The exporter checks exact response coverage and order, prompt and response digests, current source files and model files, then recomputes every screen and aggregate before publishing only metadata and aggregate evidence.

The metric is a **lexical refusal-marker screen**, inherited from the repository's existing research tools. Marker phrases can appear in a useful answer, and a semantic refusal can avoid those phrases. Therefore `semantic_refusal_rate` remains `null`. Empty/degenerate responses, errors and output-limit censoring invalidate the affected aggregate rate; they are never counted as successful zero-refusal answers. Wilson 95% intervals report uncertainty in the observed marker rate. Even zero markers among 250 examples has an upper bound of about 1.51%; it does not establish zero refusal everywhere.

For semantic results, use a separately versioned rubric and blinded review that distinguishes direct useful answers, partial answers, explicit refusals, and unusable outputs. Review all responses or a declared sampling design, measure agreement, retain disagreements, and report the denominator. Reviewing only marker hits cannot detect false negatives. This tutorial does not label a marker count as an official semantic score.

## Capability tasks are a separate measurement

The [capability lock](../data/benchmarks/lfm3-capabilities.json) pins the dataset revision for ARC-Challenge, HellaSwag, WinoGrande, TruthfulQA MC2, GSM8K, IFEval and all 57 MMLU subjects. The wrapper loads the task definitions from the pinned `lm_eval` version, propagates dataset revisions before loading data, and verifies each leaf task. IFEval's English sentence-tokenizer tables are also hash-pinned. The task definitions supply their own few-shot counts, output types, generation stops and scoring functions; these are retained in `task-provenance.json`.

A quick, explicitly bounded check:

```bash
timeout 1800 python scripts/run-lfm3-capabilities.py \
  --model "$LFM3_ROOT/model" \
  --tasks arc_challenge,hellaswag,winogrande,truthfulqa_mc2 \
  --limit 32 --batch-size 2 --profile baseline \
  --output "$LFM3_ROOT/capability-smoke"
```

This is 32 examples **per leaf task** and is labelled a smoke test, not a leaderboard result. To evaluate the complete selected capability suite, use a separate output directory and `--limit 0`:

```bash
python scripts/run-lfm3-capabilities.py \
  --model "$LFM3_ROOT/model" \
  --tasks arc_challenge,hellaswag,winogrande,truthfulqa_mc2,gsm8k,ifeval,mmlu \
  --limit 0 --batch-size 2 --profile baseline \
  --output "$LFM3_ROOT/capability-full"
```

Full capability runs can take substantially longer. A nonzero MMLU limit applies to **each of 57 subjects**, not to the entire group. Use `--prepare-only` to validate/download the pinned task data without GPU inference. For a context-profile comparison, run the same chosen tasks and sample budget again with `--profile context`; do not infer preserved task quality merely from identical weights. Generation-task token limits and the 4,096-token context bound are part of this configured experiment, so compare only matching protocols. The upstream evaluator is [EleutherAI's lm-evaluation-harness](https://github.com/EleutherAI/lm-evaluation-harness/tree/ddd67220430a2470529f25fd5c05a576ca1057a0).

## Huihui and the requested safety benchmarks

The [November source registry](../sources/research/lfm3-benchmarks-2026-11.json) records what was actually inspected. These are separate diagnostic references. They are not used to choose the system prompt or optimize harmful compliance, and this study records their scores as **not run**, not zero.

| Reference | What was verified | Interpretation |
| --- | --- | --- |
| [Huihui HarmBench behaviours](https://huggingface.co/datasets/huihui-ai/harmbench_behaviors) | Revision `a8925e1fdd1dde099a1b84cb1b844e09445826ee`; 320 CSV rows: 159 standard, 81 contextual, 80 copyright | This identifies a real Huihui-published dataset. It does not establish one universal Huihui judge, prompt format or evaluation procedure. Context and copyright-specific evaluation cannot be replaced by a generic refusal substring count. |
| [JBB-Behaviors](https://huggingface.co/datasets/JailbreakBench/JBB-Behaviors) | Revision `886acc352a31533ffbcf4ef22c744658688086fc`; distinct benign and harmful sets | Only the 100 benign goals are generated here. There is no harmful-subset or attack-success result. |
| [walledai/StrongREJECT](https://huggingface.co/datasets/walledai/StrongREJECT) | Authorized access verified after the account holder obtained access; all 313 Parquet rows match the pinned author CSV's prompt/category/source tuples | Parquet SHA-256: `603aa76bc6d546fc66da1dd5f170e775daa14cbba92ff32d56261987f1eb80e4`. Logical row equivalence is verified; file byte equality is not expected across formats. The benchmark evaluates harmful usefulness as well as refusal. No model generation or score is claimed here. |
| [RefusalBench, arXiv:2605.21545](https://arxiv.org/abs/2605.21545) | 141 public prompts in 47 benign/borderline/dual-use triples; paper describes 15 should-refuse controls | Excluded from this evaluated suite. This is a biological-research calibration benchmark, not Huihui. Low overall refusal alone can misrank models. |

The registry preserves the RefusalBench source audit, including the missing advertised tag and header-only public control manifest at [snapshot-2026-05-final](https://github.com/AppliedScientific/refusalbench/tree/fbdcff76160ae490b2a5ed87f9787de986365444). It is outside this study's evaluated suite. A skipped control remains **not measured**; neither a desired target nor an empty file establishes a measured zero.

## Troubleshooting and scope

- **Import failure in Transformers:** verify the separate LFM3 environment and exact package versions. Do not change the frozen MiniCPM environment to fix LFM3.
- **Hash mismatch:** stop and inspect the revision and file bytes. Never replace a pinned digest just to make the check pass.
- **Out of memory:** close only applications you control, or run later. Reducing batch size creates a different recorded experiment; use a new output directory and repeat the pilot.
- **Timeout or interruption:** retain partial evidence, label the attempt incomplete, and restart into a new directory. Do not report its prefix as the complete suite.
- **Censored or degenerate answers:** keep the failure counts. A higher token cap is a new protocol requiring fresh calibration and held-out evaluation, not a silent repair to the old result.
- **Very low marker counts:** inspect answer usefulness and semantic labels before drawing conclusions. The benchmark does not certify deployment safety or retained capability.

The earlier [MiniCPM study](minicpm5-selective-study.md), [evaluation guide](evaluation.md), and [provenance guide](experiment-provenance.md) remain useful methodological context. Their measured results and model-specific interventions are separate from this unchanged-weight LFM3 experiment.
