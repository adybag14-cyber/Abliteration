# Research corpus (offline)

Pinned PDFs, text extracts, and GitHub README snapshots for handbook citations.

**Refresh:** `npm run fetch:research-papers`

**Naming:** PDFs here use dot IDs (`arxiv-2602.02132.pdf`). `sources/fetched/` page snapshots from `fetch:docs` may use hyphen IDs (`arxiv-2602-02132.txt`) — cite **`papers/`** for offline PDFs.

**Beginner guide:** [../../docs/refusal-research-beginners-guide.md](../../docs/refusal-research-beginners-guide.md)

---

## Papers (`papers/`)

| arXiv | Title | PDF | Text extract |
|-------|-------|-----|--------------|
| [2406.11717](https://arxiv.org/abs/2406.11717) | Refusal in LLMs Is Mediated by a Single Direction (Arditi, NeurIPS 2024) | [arxiv-2406.11717.pdf](papers/arxiv-2406.11717.pdf) | [arxiv-2406.11717.txt](papers/arxiv-2406.11717.txt) |
| [2502.17420](https://arxiv.org/abs/2502.17420) | Geometry of Refusal — Concept Cones (TUM) | [arxiv-2502.17420.pdf](papers/arxiv-2502.17420.pdf) | [arxiv-2502.17420.txt](papers/arxiv-2502.17420.txt) |
| [2505.19056](https://arxiv.org/abs/2505.19056) | Embarrassingly Simple Defense Against Abliteration | [arxiv-2505.19056.pdf](papers/arxiv-2505.19056.pdf) | [arxiv-2505.19056.txt](papers/arxiv-2505.19056.txt) |
| [2506.00085](https://arxiv.org/abs/2506.00085) | COSMIC — Generalized Refusal Direction ID | [arxiv-2506.00085.pdf](papers/arxiv-2506.00085.pdf) | [arxiv-2506.00085.txt](papers/arxiv-2506.00085.txt) |
| [2510.02768](https://arxiv.org/abs/2510.02768) | Safety Pretraining under Abliteration | [arxiv-2510.02768.pdf](papers/arxiv-2510.02768.pdf) | [arxiv-2510.02768.txt](papers/arxiv-2510.02768.txt) |
| [2512.13655](https://arxiv.org/abs/2512.13655) | Comparative Abliteration Methods (Young) | [arxiv-2512.13655.pdf](papers/arxiv-2512.13655.pdf) | [arxiv-2512.13655.txt](papers/arxiv-2512.13655.txt) |
| [2602.02132](https://arxiv.org/abs/2602.02132) | More to Refusal than Single Direction (QCRI) | [arxiv-2602.02132.pdf](papers/arxiv-2602.02132.pdf) | [arxiv-2602.02132.txt](papers/arxiv-2602.02132.txt) |
| [2603.22061](https://arxiv.org/abs/2603.22061) | Failure of Topic-Matched Contrast Baselines | [arxiv-2603.22061.pdf](papers/arxiv-2603.22061.pdf) | [arxiv-2603.22061.txt](papers/arxiv-2603.22061.txt) |
| [2605.26526](https://arxiv.org/abs/2605.26526) | Open-Weight Defenses vs Abliteration + Prefilling | [arxiv-2605.26526.pdf](papers/arxiv-2605.26526.pdf) | [arxiv-2605.26526.txt](papers/arxiv-2605.26526.txt) |
| [2606.05396](https://arxiv.org/abs/2606.05396) | Code LLMs — Refusal vs Capability | [arxiv-2606.05396.pdf](papers/arxiv-2606.05396.pdf) | [arxiv-2606.05396.txt](papers/arxiv-2606.05396.txt) |
| [2410.03415](https://arxiv.org/abs/2410.03415) | False-refusal single vector (ICLR 2025) | [arxiv-2410.03415.pdf](papers/arxiv-2410.03415.pdf) | [arxiv-2410.03415.txt](papers/arxiv-2410.03415.txt) |
| [2507.11878](https://arxiv.org/abs/2507.11878) | Harmfulness ≠ refusal (Zhao) | [arxiv-2507.11878.pdf](papers/arxiv-2507.11878.pdf) | [arxiv-2507.11878.txt](papers/arxiv-2507.11878.txt) |
| [2511.08379](https://arxiv.org/abs/2511.08379) | SOM multi-direction (AAAI 2026) | [arxiv-2511.08379.pdf](papers/arxiv-2511.08379.pdf) | [arxiv-2511.08379.txt](papers/arxiv-2511.08379.txt) |
| [2603.27518](https://arxiv.org/abs/2603.27518) | Task-conditioned refusal | [arxiv-2603.27518.pdf](papers/arxiv-2603.27518.pdf) | [arxiv-2603.27518.txt](papers/arxiv-2603.27518.txt) |

Machine manifest: [manifest.json](manifest.json)

---

## GitHub READMEs (`readmes/`)

| Repo | Snapshot |
|------|----------|
| [andyrdt/refusal_direction](https://github.com/andyrdt/refusal_direction) | [refusal-direction-readme.md](readmes/refusal-direction-readme.md) |
| [wang-research-lab/COSMIC](https://github.com/wang-research-lab/COSMIC) | [cosmic-readme.md](readmes/cosmic-readme.md) |
| [ricyoung/abliteration-comparison](https://github.com/ricyoung/abliteration-comparison) | [abliteration-comparison-readme.md](readmes/abliteration-comparison-readme.md) |
| [shashankskagnihotri/safety_pretraining](https://github.com/shashankskagnihotri/safety_pretraining) | [safety-pretraining-readme.md](readmes/safety-pretraining-readme.md) |

---

## Community blogs (live URLs)

Listed in `scripts/fetch-docs.mjs`. Offline files `sources/fetched/grimjim-projected-blog.txt` and `grimjim-normpreserve-blog.txt` are **not** in this tree until a successful `npm run fetch:docs` writes them.

| Topic | URL |
|-------|-----|
| Projected abliteration | [grimjim/projected-abliteration](https://huggingface.co/blog/grimjim/projected-abliteration) |
| Norm-preserving biprojected | [grimjim/norm-preserving-biprojected-abliteration](https://huggingface.co/blog/grimjim/norm-preserving-biprojected-abliteration) |

## Listed in `fetch-research-papers.mjs` (not in `papers/` until a successful fetch)

| arXiv | Title |
|-------|-------|
| [2509.15202](https://arxiv.org/abs/2509.15202) | DeepRefusal (defense — train-time probabilistic ablation) |
| [2511.06852](https://arxiv.org/abs/2511.06852) | Differentiated Directional Intervention (Zhang) |
| [2603.04355](https://arxiv.org/abs/2603.04355) | Efficient refusal ablation via optimal transport |
| [2607.02396](https://arxiv.org/abs/2607.02396) | Fast multi-dimensional refusal subspaces (RFM-AGOP) |