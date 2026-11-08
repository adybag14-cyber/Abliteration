# Abliteration Studio: native Rust research tools

This alpha toolkit pairs a native **Iced + iced-shadcn GUI** with a **Rust CLI and library**. It verifies the instruction-tuned LiquidAI/LFM3-1.7B checkpoint, inspects tensor metadata, prepares frozen benign cohorts, runs inference through mistral.rs, and records reproducible evaluation evidence. The runtime does not invoke Python. Original checkpoint files stay unchanged; experimental Q8 quantization changes the in-memory representation.

Download the archive for your platform from [GitHub Releases](https://github.com/adybag14-cyber/Abliteration/releases). Verify its `.sha256` file and GitHub attestation before extraction. Each package includes `SOURCE.json`, per-file digests, the Cargo dependency lock, configurations, source pins and dependency notices. Model weights are downloaded separately and retain their own license.

| Package | Runtime requirement | Qualification scope |
| --- | --- | --- |
| Windows x64 | Windows with the standard Microsoft C runtime | Native build, contracts and package entry-point checks |
| Linux x64 | Linux with glibc 2.35 or later and desktop libraries for the GUI | Native build, contracts, archive checks and Docker GUI rendering |
| Linux x64 CUDA 13 SM89 | NVIDIA CUDA 13 runtime and a compatible SM89 GPU, such as RTX 4090 | Experimental CUDA build; hardware evidence is reported separately from hosted CI |

The inference engine is pinned to development revision `addea2961deaafe59ab3d8894303a9ff2eca1204`. The older published mistral.rs crate does not include this LFM3 architecture. Treat the backend and optional precision/device configurations as experimental. A successful build is not a benchmark result or a deployment certification.

## Start with the GUI

Run `abliteration-studio.exe` on Windows or `./abliteration-studio` on Linux. Keep the companion CLI beside it. Use **Verify files**, **Prepare benign cohorts**, and **Run evaluation** in that order. Paths are entered inline; the application does not open browser authentication or file-picker popups. Existing output directories are never overwritten.

The interface supports light and dark appearance and adapts down to 900×600. The four editable budgets are visible before a run. More parameters are available in the exported TOML configuration. Cancellation targets only the child process launched for that action and retains partial evidence.

## Run from a terminal

From the extracted package directory, in a Linux or WSL shell:

```bash
export LFM3_WORKSPACE="$HOME/abliteration-lab"
./abliteration-cli doctor
./abliteration-cli download-model "$LFM3_WORKSPACE/models/lfm3-1.7b"
./abliteration-cli prepare-protocol "$LFM3_WORKSPACE/protocol"
RAYON_NUM_THREADS=6 ./abliteration-cli run \
  --model "$LFM3_WORKSPACE/models/lfm3-1.7b" \
  --protocol "$LFM3_WORKSPACE/protocol/protocol.jsonl" \
  --output "$LFM3_WORKSPACE/runs/smoke-001" \
  --config configs/lfm3-smoke.toml
./abliteration-cli verify-report \
  --run "$LFM3_WORKSPACE/runs/smoke-001" \
  --protocol "$LFM3_WORKSPACE/protocol/protocol.jsonl"
```

PowerShell uses the same subcommands with `./abliteration-cli.exe` and normal Windows paths. Set `$env:RAYON_NUM_THREADS='6'` to bound CPU worker parallelism. A model directory already verified at the pinned revision can be reused instead of downloaded again.

The smoke preset uses two calibration prompts and one test prompt per benign dataset, under both profiles: **eight responses**. Its output cap is 2,048 tokens. The full preset uses all 16 calibration prompts and all 350 held-out prompts under both profiles: **732 responses**. Full CPU runs can take much longer; their timeout is explicit in the configuration.

The measured quantity is a **lexical refusal-marker screen**, not a semantic refusal rate. `needs_review` and exit code 2 retain invalid or censored generations and set affected rates to `null`. Do not discard those cases to manufacture a low rate. A zero observed marker count still has statistical uncertainty. The report verifier checks coverage, ordering, response hashes, recalculated screens and calibration-only profile selection; it does not perform semantic judging.

## Research configurations and limits

- [Benign smoke](configs/lfm3-smoke.toml): a bounded engineering check, not a leaderboard score.
- [Complete benign cohorts](configs/lfm3-full.toml): the full frozen XSTest-safe and JBB-benign selections.
- [Q8 experiment](configs/lfm3-q8-experimental.toml): lower-precision in-memory weights can change coherence, knowledge and safety behaviour. Preserve a matching original-precision comparison.
- [CUDA experiment](configs/lfm3-cuda-experimental.toml): requires the CUDA build and compatible libraries/hardware. Watch memory pressure and competing applications; there is no silent CPU-only fallback.
- [RefusalBench reference](configs/refusalbench-research.toml): included for researchers, **not run and not validated**. The native automated runner does not execute it.

RefusalBench contains biological research prompts across different risk tiers. Generated material can require qualified review and controlled handling. The inspected public positive-control manifest is empty, so it cannot establish a safety-calibration floor. Judge disagreement, dataset contamination, truncated output and runtime changes can distort conclusions. Researchers are responsible for their study design, access controls and applicable institutional requirements. Missing outcomes remain unmeasured, never default-zero scores.

Huihui HarmBench and StrongREJECT source identities are recorded in the benchmark catalog. Source verification is separate from model execution and judging. No harmful-compliance score, safeguard-removal procedure, or guarantee of minimum refusal is supplied by this toolkit.

The [full tutorial](https://adybag14-cyber.github.io/Abliteration/handbook/docs/lfm3-reproducible-evaluation/) explains the model and protocol pins, CPU/GPU differences, build/release provenance, and how Python is retained only as a historical reference for this LFM3 workflow.

## Build from source

Use Rust 1.99.1 and the committed Cargo lock:

```bash
cargo +1.99.1 test --locked --workspace --features gui
cargo +1.99.1 build --locked --release --features gui
```

The `cuda` feature builds the experimental CUDA inference path. The pinned CUDA Dockerfile provides the matching compiler environment. The GUI Dockerfile supports both a clean source build and testing the exact packaged Linux binaries in an isolated Xvfb display. Refer to the repository workflow for system-library installation and the release matrix.
