# LFM3-1.7B with the native Rust research studio

This tutorial uses a **Rust runtime, Rust research library, Cargo builds, and a native Iced GUI with iced-shadcn components**. It investigates unnecessary refusal on benign requests using the instruction-tuned `LiquidAI/LFM3-1.7B` checkpoint. Python remains [historical reference material](lfm3-python-reference.md); the native workflow never invokes it.

The tools verify checkpoint bytes, inspect tensor metadata, prepare frozen inputs, compare an unchanged baseline with a context-aware prompt, and verify the resulting evidence. They do not perform checkpoint surgery or optimize harmful-request compliance. There is no defensible guarantee of a global minimum refusal rate. A useful answer, a lexical marker count, and calibrated safety are different outcomes.

## Choose an artifact or build with Cargo

The [GitHub release](https://github.com/adybag14-cyber/Abliteration/releases/tag/rust-v0.1.0-alpha.1) provides Windows x64, Linux x64, and an experimental Linux CUDA 13 SM89 edition. Extract the GUI and CLI together. Verify the archive's SHA-256 sidecar and GitHub attestation. `SOURCE.json` records the source commit and every packaged file digest; model weights are separate.

To build the same source revision:

```bash
git clone --branch rust-v0.1.0-alpha.1 --depth 1 https://github.com/adybag14-cyber/Abliteration.git
cd Abliteration
rustup toolchain install 1.99.1 --profile minimal --component rustfmt --component clippy
export ABLITERATION_BUILD_SHA="$(git rev-parse HEAD)"
cargo +1.99.1 test --locked --workspace --features gui
cargo +1.99.1 build --locked --release --features gui
```

Use the system-library installation steps in [the Rust workflow](../.github/workflows/rust-studio.yml) for a source build. The native inference engine is pinned to mistral.rs development commit [`addea2961deaafe59ab3d8894303a9ff2eca1204`](https://github.com/EricLBuehler/mistral.rs/tree/addea2961deaafe59ab3d8894303a9ff2eca1204), which includes LFM3. The inspected published crate and earlier release did not contain this model. The backend is therefore labelled experimental even when compilation and engineering smokes pass.

The GUI uses Iced 0.14.0 and iced-shadcn 0.5.1. These are native Rust components, not a webview executing the website. The existing web handbook remains a reader and download guide.

## Confirm the checkpoint identity

| Component | Pinned identity |
| --- | --- |
| Model | `LiquidAI/LFM3-1.7B`, instruction-tuned |
| Revision | `0dc4268b561499c648c7ba7c9466bf3d8d01517a` |
| Parameters | 1,728,801,536 |
| Tensors | 286 |
| Weights | One BF16 safetensors shard, 3,457,635,448 bytes |
| Weight SHA-256 | `135922caef64e81e52af88ede8b7c3ddaa9d6da220a9737fb3065275dbfb4330` |
| Architecture | 24 layers: 13 convolution, 5 sliding attention, 6 full attention |
| File manifest | Eleven pinned files, including tokenizer, chat template, generation configuration and license |

The [model lock](../data/models/lfm3-1.7b.json) supplies exact sizes and hashes. The [model card](https://huggingface.co/LiquidAI/LFM3-1.7B) and configuration establish its hybrid architecture. Dense MiniCPM layer selections from older chapters are not an LFM3 implementation.

The model repository contains Python reference files. The native downloader can retain and hash those files for complete provenance, but mistral.rs uses its Rust LFM3 implementation and does not execute them. Model licensing remains separate from the toolkit's license; the pinned model license is retained with the download.

## Use the graphical workflow

Run `abliteration-studio.exe` on Windows or `./abliteration-studio` on Linux. Keep `abliteration-cli` beside it. The GUI uses inline paths and status messages; it does not launch browser login or file-picker popups.

1. Enter the model directory and choose **Verify files**, or download the pinned checkpoint into a new directory.
2. Select the **Benign smoke** configuration. Inspect the token and sampling budgets before running.
3. Choose a protocol folder and use **Prepare benign cohorts**.
4. Choose a new run folder and start the evaluation. The GUI remains responsive; cancellation targets its owned child process.
5. Inspect the recorded results and complete command receipt. Invalid or censored output remains visible and cannot become a successful zero-refusal claim.

The layout adapts down to 900×600, with scrolling for longer forms and reference material. Light and dark appearance are available. Docker QA renders the actual compiled application in an isolated Xvfb display, checks screenshot dimensions and hashes, and retains process-exit evidence. The desktop display is not shared with those checks.

Inspect the [1280×860 workspace capture](../public/studio/workspace-1280x860.png) and [RefusalBench risks capture](../public/studio/reference-risks-1280x860.png). These show the development build in the isolated Docker display; release builds identify their Git commit in the footer.

## Prepare and run entirely in Rust

The examples below use a Linux or WSL shell from an extracted toolkit directory. PowerShell uses the same subcommands with the `.exe` suffix and Windows paths.

```bash
export LFM3_WORKSPACE="$HOME/abliteration-lab"
./abliteration-cli doctor
./abliteration-cli download-model "$LFM3_WORKSPACE/models/lfm3-1.7b"
./abliteration-cli verify-model "$LFM3_WORKSPACE/models/lfm3-1.7b"
./abliteration-cli prepare-protocol "$LFM3_WORKSPACE/protocol"
```

The verifier checks all file digests, architecture identity, safetensors extents and the total parameter count. It rejects changed files and unsafe file references. Preparation verifies the public source hashes and exact cohort sizes before writing an immutable protocol directory.

| Cohort | Available rows | Use |
| --- | ---: | --- |
| Repository calibration v1 | 16 | Hand-authored benign prompts, disjoint from held-out prompts |
| XSTest safe | 250 | Only the `safe` rows in the pinned 450-row source |
| JBB benign | 100 | Only the benign file's `Goal` column; no `Target` prefill or training answer |

The complete native protocol has **366 records** and SHA-256 `c36e3c99c8f1ad463c715589c994347b28b11c1e6fb82c32f83b0c8c6c37103f`. This is the Rust serialization hash, not the older Python serialization hash. Source revisions, selectors, licenses and file hashes are in the [dataset lock](../data/benchmarks/lfm3-benign.json). Line endings are fixed for reproducibility across Windows and Linux.

Start with a small engineering smoke:

```bash
RAYON_NUM_THREADS=6 ./abliteration-cli run \
  --model "$LFM3_WORKSPACE/models/lfm3-1.7b" \
  --protocol "$LFM3_WORKSPACE/protocol/protocol.jsonl" \
  --output "$LFM3_WORKSPACE/runs/smoke-001" \
  --config configs/lfm3-smoke.toml
./abliteration-cli verify-report \
  --run "$LFM3_WORKSPACE/runs/smoke-001" \
  --protocol "$LFM3_WORKSPACE/protocol/protocol.jsonl"
```

This preset generates **eight responses**: two calibration prompts and one held-out prompt from each benign dataset, under both profiles. It checks the software path and is much too small for a benchmark ranking. For all 16 calibration and 350 held-out prompts under both profiles, use `configs/lfm3-full.toml` and a new output directory; that produces **732 responses**. Full CPU runs may take substantially longer. The timeout is explicit in every configuration.

The baseline has no system message. The context profile asks the model to interpret harmless computing, figurative, academic and fictional requests in context while declining assistance that facilitates harm. Both profiles share the checkpoint and decoding settings. Selection occurs **before held-out generation**: exclude calibration profiles with unusable or censored output, choose the fewest calibration marker hits, and break ties in favour of the baseline. Held-out results cannot change that choice after the fact.

The default native decoding is greedy, with thinking disabled and repetition penalty 1.1 recorded explicitly. The smoke token cap is 2,048; the full preset uses 4,096. CPU inference requests F32; CUDA requests BF16. Q8 changes the in-memory representation. These differences can alter generated text, so do not equate the native run numerically with a Python, quantized, sampled or differently batched run.

## Read a result without manufacturing success

Each run records its configuration, model and protocol identity, executable digest, runtime revision, responses and selection receipt. The report verifier checks coverage and ordering, prompt/response hashes, recalculated lexical screens, cohort aggregates, and calibration-only selection. It also rejects pilot/full-suite relabelling and scores assigned to unrun reference benchmarks.

`needs_review` and exit code 2 mean generation finished but includes invalid or censored output. Affected rates and intervals are `null`. A failed, cancelled or timed-out process is not a completed benchmark. Keep its partial evidence and use a new directory for another attempt.

The reported rate is a **lexical refusal-marker screen**, not a semantic refusal judgment. A useful answer can contain one of the marker phrases, and a refusal can avoid them. `semantic_refusal_rate` therefore remains unmeasured. Human or separately validated judging needs a versioned rubric, blinded review, declared coverage and disagreement handling. Reviewing only marker hits cannot find false negatives.

Wilson intervals describe binomial uncertainty in the observed screen. The prompts are curated, not a random sample of every future request. Even zero markers among 250 examples has a nonzero upper bound of about 1.51%; it does not establish zero refusal everywhere. Empty, malformed or truncated output must not improve the score.

## Experimental researcher configurations

| Configuration | What changes | Risks and evidence limits |
| --- | --- | --- |
| [Q8](../rust/configs/lfm3-q8-experimental.toml) | In-memory numerical precision | Lower memory use can accompany changed coherence, knowledge and safety behaviour. Keep a matching original-precision baseline. Original files are not rewritten. |
| [CUDA](../rust/configs/lfm3-cuda-experimental.toml) | Device and activation precision | Requires the CUDA build, compatible driver/runtime and sufficient free GPU memory. Competing applications can affect performance or cause failure. CPU-only binaries reject a CUDA request. |
| [Full benign cohorts](../rust/configs/lfm3-full.toml) | Evaluation coverage and token budget | A long run can time out or censor answers. Completion, valid output and semantic quality are separate checks. |
| [RefusalBench reference](../rust/configs/refusalbench-research.toml) | Research configuration and provenance only | Included, **not run and not validated**. It is not an executable automated cohort in this release. |

Successful compilation, contract tests and an engineering smoke do not establish full benchmark performance. The [Rust workflow](../.github/workflows/rust-studio.yml) builds and packages the toolkits and tests the actual GUI binaries. Hosted CUDA compilation is reported separately from GPU hardware execution. Inspect the release's attached evidence and manifests for the exact qualification performed.

Researchers are responsible for their study design and how they handle outputs. Risks include misleading lexical scores, insufficient samples, data leakage, lost capability, numerical changes, unsafe generated material, memory exhaustion and dependency/API changes. Preserve the original checkpoint, freeze all inputs, keep failures, and avoid deployment claims unsupported by measured evidence.

## Huihui, StrongREJECT and RefusalBench provenance

The [November source registry](../sources/research/lfm3-benchmarks-2026-11.json) records what was inspected. Source verification is separate from running and judging a model.

| Reference | Verified source facts | Status in this toolkit |
| --- | --- | --- |
| [Huihui HarmBench behaviours](https://huggingface.co/datasets/huihui-ai/harmbench_behaviors) | 320 rows at revision `a8925e1fdd1dde099a1b84cb1b844e09445826ee`: 159 standard, 81 contextual, 80 copyright | Source verified; no model score. A dataset identity does not define one universal Huihui judge or procedure. |
| [JBB-Behaviors](https://huggingface.co/datasets/JailbreakBench/JBB-Behaviors) | Revision `886acc352a31533ffbcf4ef22c744658688086fc` has distinct benign and harmful subsets | Only the 100 benign goals are executable in the frozen native study. No harmful-subset score is claimed. |
| [StrongREJECT](https://huggingface.co/datasets/walledai/StrongREJECT) | Authorized access verified; all 313 prompt/category/source tuples in the pinned Parquet match the author CSV after renaming its prompt column | Source verified; no model generation or score. Gated prompt content and credentials are not bundled. |
| [RefusalBench](https://arxiv.org/abs/2605.21545) | 141 public prompts in 47 benign/borderline/dual-use triples; the paper describes 15 should-refuse controls | Included as an unrun reference configuration. No minimum-refusal, safety-floor or complete-protocol result is claimed. |

RefusalBench poses particular biological-content risks: model outputs can contain unsafe research guidance and require qualified review and controlled handling. Its paper argues that low overall refusal alone can misrank calibration. The inspected public tag [snapshot-2026-05-final](https://github.com/AppliedScientific/refusalbench/tree/fbdcff76160ae490b2a5ed87f9787de986365444) has a header-only positive-control manifest. Its published analyses can be inspected, but those files do not supply a new complete control evaluation. A skipped or unavailable test remains **not measured**, not a default zero.

The requested StrongREJECT mirror was accessed only after the account holder obtained access. Its Parquet SHA-256 is `603aa76bc6d546fc66da1dd5f170e775daa14cbba92ff32d56261987f1eb80e4`. Logical row equivalence to the pinned author CSV was verified; byte equality is not expected across Parquet and CSV formats.

The [capability source lock](../data/benchmarks/lfm3-capabilities.json) preserves references for ARC-Challenge, HellaSwag, WinoGrande, TruthfulQA MC2, GSM8K, IFEval and MMLU. Their earlier Python preparation is reference material, not native capability certification. Do not label a Rust benign smoke as a score on those suites.

## Reproduce the GUI checks without desktop popups

The GUI Dockerfile can build from source or consume the exact release binaries. CI uses the artifact stage so the screenshots correspond to the binaries being packaged.

```bash
docker build -f rust/Dockerfile.gui --target from-source -t abliteration-gui-qa .
docker create --name abliteration-gui-qa --network none abliteration-gui-qa
docker start -a abliteration-gui-qa
docker cp abliteration-gui-qa:/evidence ./gui-evidence
```

The private Xvfb display does not share the desktop. QA checks dimensions, nonempty rendering, image hashes and clean process exits. It validates the RefusalBench configuration structurally and never executes that benchmark or any model inference. Inspect the captured images as well as the machine-readable receipt; a checksum alone does not establish a usable layout.

The historical [MiniCPM study](minicpm5-selective-study.md), [evaluation guide](evaluation.md) and [provenance guide](experiment-provenance.md) remain methodological context. Their model-specific interventions and scores are separate from this native LFM3 toolkit.
