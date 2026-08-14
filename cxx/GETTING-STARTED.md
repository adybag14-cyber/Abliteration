# Getting started in 10 minutes

You do **not** need a GPU, Hugging Face, or Python for this first loop.
Download a nightly binary or build, then run the commands in order.

Pick one archive from [cxx-nightly](https://github.com/adybag14-cyber/Abliteration/releases/tag/cxx-nightly) (names do not collide):

| OS | File |
|----|------|
| Windows x64 | `abliterate-cxx-windows-x64-msvc.zip` |
| Linux x64 | `abliterate-cxx-linux-x64-gcc15.tar.gz` |
| macOS Apple Silicon | `abliterate-cxx-macos-arm64-llvm.tar.gz` |

Verify `SHA256SUMS`. After unpack, run `guide` → `doctor` → `self-check` → `demo`.

**Windows unpack:** after flatten, the exe sits at the zip root.

```powershell
Expand-Archive abliterate-cxx-windows-x64-msvc.zip -DestinationPath .
.\abliterate-cxx.exe guide
.\abliterate-cxx.exe doctor
.\abliterate-cxx.exe self-check
.\abliterate-cxx.exe demo
```

## 0. Prove the binary

```text
abliterate-cxx guide
abliterate-cxx doctor
abliterate-cxx self-check
abliterate-cxx demo
```

`guide` prints this hour-0 order.
`doctor` checks ISO C++26 (`cplusplus=202400`) and whether example files are visible.
`self-check` plants a direction, wipes it, hooks it, and scores three sentences.
`demo` runs estimate → apply → hook → eval on the shipped toys (the same loop as sections 1–4).

If `doctor` cannot see examples, either `cd` into the extracted folder or:

```text
set ABLITERATE_EXAMPLES=path/to/examples     # Windows
export ABLITERATE_EXAMPLES=path/to/examples  # Unix
```

## 1. Estimate a refusal direction (Arditi 2024 DIM)

Shipped toy activations: rows = prompts, columns = residual dim.

```text
abliterate-cxx estimate --mode dim --bad examples/tiny-bad.txt --good examples/tiny-good.txt --out r.txt
```

| `--mode` | Paper / idea | When |
|----------|----------------|------|
| `dim` | Arditi et al. 2024 — mean(bad) − mean(good) | first run |
| `projected` | Lai 2025 — remove harmless component of `r` | KL / capability drop |
| `cosmic` | Siu ACL 2025 — cosine separation score + DIM `r` | no “I cannot” template |
| `svd` | multi-direction / OBLITERATUS-style subspace | leftovers after rank-1 |

```text
abliterate-cxx why projected
```

## 2. Bake into a tiny weight matrix

```text
abliterate-cxx apply --mode orba-directional --weight examples/tiny-W.txt --direction r.txt --out W2.txt
```

| `--mode` | Meaning |
|----------|---------|
| `arditi` / `orba-directional` | `W ← (I − α r rᵀ) W`  (stable default) |
| `orba-householder` | reflection `α = 2` — research A/B, can flip semantics |
| `subspace` | wipe a `[k × d]` basis from `estimate --mode svd` |

Start `α = 1`. If a real model later sounds broken, lower `--alpha 0.5`.

## 3. Reversible hook (no weight write)

```text
abliterate-cxx hook --h examples/tiny-h.txt --direction r.txt
```

## 4. Score refusals on generations you already have

```text
abliterate-cxx eval --jsonl examples/generations.jsonl
```

If the JSONL is empty or every row is mute/filler, `eval` exits **2**. That is **not** a safety hit and **not** a successful abliteration.

`false_refusal` = model said no on a `tool_call`/`comply` row.
`true_refusal_hits` = model said no on a `refuse`/`harmful` row.

Factory work wants **low false_refusal** without driving true refusals to zero.

## 5. Hour-0 demo (already run after unpack)

```text
abliterate-cxx demo
```

This is the hour-0 capstone from the intro — not a later extra step. Re-run it anytime to replay sections 1–4 on the toys.

## What this CLI is not

It does **not** download Qwen, run Optuna, or edit GGUF. After the math is clear:

1. Measure real activations with Heretic / llm-abliteration (GPU).
2. Export last-token residuals as `rows cols` text (or keep using this CLI on dumped matrices).
3. Generate answers first. Handbook `data/eval/*.jsonl` is prompts only — not `eval --jsonl` input. Score the generation dump; deploy gates live in `docs/evaluation.md`.

```text
abliterate-cxx recipes
abliterate-cxx guide
```

Ethics: authorized factory / lab / research only. See handbook `docs/risks-and-ethics.md`.
