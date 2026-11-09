Native Rust research studio alpha 2 makes operation, readiness, cancellation, and durable run state explicit. Failed re-checks no longer retain stale verification badges, stale job callbacks cannot overwrite current work, draft edits clear old displayed results, and review-required evidence is distinct from success and failure.

The GUI can verify and reuse an existing protocol. The new read-only `verify-protocol` command supports the same preflight for agents. Cancellation waits for the owned child to stop. Atomic progress snapshots, terminal failure/cancellation states, and structured failure kinds make automation less dependent on human-readable log text. Existing report fields and CLI success/review exit codes remain compatible. The state-machine audit documents the native app and its handbook/delivery boundaries.

Packages are built in GitHub Actions. The Windows and Linux packages include the GUI and CLI; the experimental CUDA 13 SM89 package pairs the CUDA CLI with the tested Linux GUI. SHA-256 files, per-file source manifests, dependency notices and GitHub build attestations accompany the archives. Model weights are separate.

Experimental status is explicit. The LFM3 backend uses a pinned development revision of mistral.rs. Q8 and CUDA settings can change numerical behaviour and resource use; build tests are separate from model and benchmark evidence. No full benchmark or deployment-safety certification is implied.

RefusalBench is included as a reference configuration, **not run and not validated**, and excluded from automated execution. Its biological-content, judging and missing-control risks are documented. Missing results are not represented as zero. Huihui and StrongREJECT source provenance is recorded separately from any model score.

Python is reference material for the LFM3 methodology and is not required by the native runtime. Start with the packaged README and the [reproducible tutorial](https://adybag14-cyber.github.io/Abliteration/handbook/docs/lfm3-reproducible-evaluation/).
