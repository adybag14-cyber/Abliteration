Native Rust research studio preview with Iced and iced-shadcn components, a companion Rust CLI, pinned LFM3-1.7B model verification, benign protocol preparation, inference, complete-response accounting and report-integrity checks.

Packages are built in GitHub Actions. The Windows and Linux packages include the GUI and CLI; the experimental CUDA 13 SM89 package pairs the CUDA CLI with the tested Linux GUI. SHA-256 files, per-file source manifests, dependency notices and GitHub build attestations accompany the archives. Model weights are separate.

Experimental status is explicit. The LFM3 backend uses a pinned development revision of mistral.rs. Q8 and CUDA settings can change numerical behaviour and resource use; build tests are separate from model and benchmark evidence. No full benchmark or deployment-safety certification is implied.

RefusalBench is included as a reference configuration, **not run and not validated**, and excluded from automated execution. Its biological-content, judging and missing-control risks are documented. Missing results are not represented as zero. Huihui and StrongREJECT source provenance is recorded separately from any model score.

Python is reference material for the LFM3 methodology and is not required by the native runtime. Start with the packaged README and the [reproducible tutorial](https://adybag14-cyber.github.io/Abliteration/handbook/docs/lfm3-reproducible-evaluation/).
