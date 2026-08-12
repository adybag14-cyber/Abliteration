# Bleeding-edge abliteration (2025–2026)

What is **new** beyond Arditi mean-diff + Heretic defaults. Production still starts at [projected + norm-preserving](../techniques/projected-norm-preserving-abliteration.md). Use this page when that is not enough, or when you are reading papers.

Curriculum placement: [complete-curriculum.md](complete-curriculum.md) Stage 9. Paper PDFs: [../sources/research/README.md](../sources/research/README.md).

---

## Frontier map

| ID | Idea | Year | Handbook | Production? |
|----|------|------|----------|-------------|
| T03 | Projected + row-norm restore | 2025 Lai | [projected-norm-preserving](../techniques/projected-norm-preserving-abliteration.md) | **Default** |
| T34 | ORBA — Householder vs directional rank-1 | 2026 Lai | [orba-orthogonal-reflection](../techniques/orba-orthogonal-reflection.md) | Research / Abliterix flag |
| T36 | COSMIC — cosine direction ID, no output templates | 2025 ACL | [cosmic-refusal-direction](../techniques/cosmic-refusal-direction.md) | When markers fail |
| T35 | SOM multi-direction (AAAI 2026) | 2025/26 | [som-multi-directional-refusal](../techniques/som-multi-directional-refusal.md) | After single-`r` leftovers |
| T37 | SVD / whitened SVD subspace (OBLITERATUS) | 2026 | [svd-whitened-obliteratus](../techniques/svd-whitened-obliteratus.md) | CoT / MoE precision |
| T38 | False-refusal vector only (ICLR 2025) | 2024/25 | [false-refusal-vector-ablation](../techniques/false-refusal-vector-ablation.md) | Factory over-refusal |
| T39 | Harmfulness ⊥ refusal (Zhao et al.) | 2025 | [harm-vs-refusal-directions](../techniques/harm-vs-refusal-directions.md) | Analysis + Latent Guard |
| T05–T07 | Concept cones, RDO, SAE | 2025–26 | [beyond-single-direction](../techniques/beyond-single-direction.md) | Research |
| — | QCRI 11-category + shared knob | 2026 | [multi-category-refusal-beginners-guide](../techniques/multi-category-refusal-beginners-guide.md) | Prompt-set design |
| — | Cross-lingual refusal transfer | 2025 | [research-landscape.md](research-landscape.md) | Multilingual measure |
| — | Task-conditioned over-refusal vs global harm | 2026 | arXiv:2603.27518 | Eval design |
| — | J-Wash Jacobian lens | 2026 | [tools/abliteration-tooling.md](tools/abliteration-tooling.md) | Manual alignment |
| — | Abliterix ORBA/SAE/LoRA/MoE | 2026 | [extended-abliteration-toolkit](../techniques/extended-abliteration-toolkit.md) | When presets exist |
| — | ablate-llm, Blasphemer, vauban | 2026 | [setup-encyclopedia.md](setup-encyclopedia.md) | Niche OS / CLI |

---

## Geometric stack (Lai 2025–2026)

Three successive refinements of the same rank-1 edit:

1. **Arditi** — subtract `r` from outputs of `W`.
2. **Projected + MPOA / norm-preserving** — `r ← r − (r·g)g`, then restore `‖W_row‖`.
3. **ORBA** — treat “map harmless → forbidden” as a Householder / geodesic problem; **directional ablation (`α = 0`)** is the stable weight primitive. Full reflection (`H = I − 2uuᵀ`) is isometric but **amplifies angular error** (sign-flip / semantic drift). Prefer directional ablation unless you are reproducing the v3 Householder models.

Math and flags: [../methods/orba-pipeline.md](../methods/orba-pipeline.md).

Unifying PEFT view (Lai / Sun 2026):

```text
W ← W + b ⊗ a
abliteration: a = s, b = −W s          (α = 0)
steering:     a = s, b = (α−1) W s
rank-1 LoRA:  same structure, learned a, b
```

---

## Direction identification (not the same as baking)

| Estimator | Needs model outputs? | Strength |
|-----------|----------------------|----------|
| Mean-difference | No (activations only) | Fast default |
| Projected DIM | No | Lower KL |
| Geometric median + winsorize | No | Massive activations (Gemma) |
| **COSMIC** cosine inversion | **No** | Weakly aligned / no “I cannot” |
| Gradient RDO | Yes (losses on generations) | Best `r` if you can afford it |
| SOM on harmful residuals | No | Multi-D manifold |
| SVD / whitened SVD | No | Subspace, OBLITERATUS |
| SAE latent ranking | No (needs trained SAE) | Interpretable core+tail |

Handbook implementation of DIM / projected / Householder / subspace: `scripts/abliteration_math.py`.

---

## Multi-direction reality check

- **QCRI 2026:** 11 refusal *styles*, one **volume** knob — ablating any category direction mostly scales the same refuse↔comply trade-off.
- **TUM cones:** you still need **representational independence**, not just `r₁ ⊥ r₂`.
- **SOM (AAAI 2026):** SOMs generalize DIM; ablating several SOM neurons beat single-direction **and** some jailbreak baselines in their setup.
- **Zhao 2025:** **harmfulness** and **refusal** are distinct axes. Abliterating refusal can leave the model still *judging* harm (or vice versa). Factory work should prefer the **false-refusal** axis (T38) when the goal is `wmic`/`nmap` compliance without flattening harm detection.

---

## Tools that appeared after “just use Heretic”

| Tool | Why it is on this page |
|------|------------------------|
| **Abliterix** | Optuna multi-objective; ORBA/SAE/LoRA/MoE; HonestAbliterationBench; AGPL-3.0 |
| **OBLITERATUS** | `basic` / `advanced` / `surgical` / `aggressive`; SVD + SAE + head surgery |
| **ablate-llm** | `pip install ablate-llm` — KL search + Hub push |
| **J-Wash** | Anthropic Jacobian lens; exportable manual alignment |
| **Blasphemer** | Heretic fork aimed at macOS + LM Studio |
| **vauban** | MLX-native steering / abliteration research |
| **senbonzakura** | Multi-direction refusal CLI |
| **heretic-grimoire** | Reproducibility archive for Heretic runs |

Compatibility and GSM8K still come from [comparative-abliteration-benchmarks.md](comparative-abliteration-benchmarks.md) (Heretic / DECCP / ErisForge / FailSpy). Newer CLIs are **not** in that matrix — treat their README numbers as unverified until you run `data/eval/*.jsonl`.

---

## Defenses (why a “bleeding-edge” attack does nothing)

[defenses-against-abliteration.md](defenses-against-abliteration.md)

- Extended-refusal SFT (arXiv:2505.19056) — refusal drop ≤10 pp
- Circuit breakers (training-time orthogonalization)
- ART (arXiv:2605.26526) — resists abliteration + prefilling better than TAR/SEAM

If KL is tiny and refusal barely moved, **stop raising `max_weight`**. Change the base checkpoint or the measure set.

---

## What we deliberately do not treat as abliteration

| Thing | Why it is out of scope |
|-------|------------------------|
| Prompt jailbreaks | Inference-only, not a checkpoint |
| Uncensored SFT / DPO from scratch | Training, not directional surgery |
| Zeroing random layers / embedding slabs | Not refusal-direction math |
| Downloading a mystery “uncensored GGUF” | Unknown pipeline, no eval |

Those can be **adjacent** (Jarvis QLoRA *after* surgery). They are not substitutes for Stages 2–3 of the curriculum.
