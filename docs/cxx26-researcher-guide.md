# Researcher guide — do not spend a year figuring this out

This page is the **hand-holding path** for `abliterate-cxx`. Read it top to bottom once. You should have a passing `demo` in the same afternoon you download the binary.

**Binary:** [cxx-nightly](https://github.com/adybag14-cyber/Abliteration/releases/tag/cxx-nightly) · **CLI UX:** `abliterate-cxx guide`

---

## The only order that works

```text
doctor → self-check → demo → estimate dim → apply orba-directional → eval toys
         → recipes → (optional) projected / cosmic / svd
         → then and only then a real model (Heretic)
```

If you skip to a 32B GGUF you will debug tooling for weeks and learn no geometry.

---

## Day 0 — install (pick one)

Pick **one unique filename**. GCC and Clang no longer share a name.

| You have | Download from [cxx-nightly](https://github.com/adybag14-cyber/Abliteration/releases/tag/cxx-nightly) |
|----------|------------------------------------------------------------------------------------------------------|
| Windows x64 | `abliterate-cxx-windows-x64-msvc.zip` |
| Linux x64 | `abliterate-cxx-linux-x64-gcc15.tar.gz` |
| Linux arm64 | `abliterate-cxx-linux-arm64-gcc15.tar.gz` |
| macOS Apple Silicon | `abliterate-cxx-macos-arm64-llvm.tar.gz` |
| macOS Intel | `abliterate-cxx-macos-x64-llvm.tar.gz` |

**Windows x64**

```powershell
# from https://github.com/adybag14-cyber/Abliteration/releases/tag/cxx-nightly
Expand-Archive abliterate-cxx-windows-x64-msvc.zip
cd abliterate-cxx-windows-x64-msvc
.\abliterate-cxx.exe guide
.\abliterate-cxx.exe doctor
.\abliterate-cxx.exe demo
```

**Linux x64 / arm64**

```bash
tar -xzf abliterate-cxx-linux-x64-gcc15.tar.gz
cd abliterate-cxx-linux-x64-gcc15
./abliterate-cxx doctor && ./abliterate-cxx demo
```

**macOS arm64 / x64**

```bash
tar -xzf abliterate-cxx-macos-arm64-llvm.tar.gz
cd abliterate-cxx-macos-arm64-llvm
xattr -d com.apple.quarantine ./abliterate-cxx 2>/dev/null || true
./abliterate-cxx doctor && ./abliterate-cxx demo
```

**From source (ISO C++26)**

```bash
npm run cxx:build
npm run cxx:test
./cxx/build/abliterate-cxx doctor
```

`doctor` must print `cplusplus=202400`. Anything else is the wrong compiler.

---

## What each file is

| File | Meaning |
|------|---------|
| `tiny-bad.txt` | 5 “should trigger refusal-ish” activation rows, dim=4 |
| `tiny-good.txt` | 5 harmless rows, **same dim** |
| `tiny-W.txt` | toy `down_proj`-shaped weight (4×3) |
| `tiny-h.txt` | one residual vector to hook |
| `generations.jsonl` | 5 fake model answers with `expected` labels |

Format of every matrix: first line `rows cols`, then floats. That is the whole file format. There is no safetensors in this binary.

---

## Map: what you typed in a paper → what you type here

| You read | You type |
|----------|----------|
| “difference-in-means / Arditi / abliterator” | `estimate --mode dim` |
| “projected abliteration / orthogonalize_direction” | `estimate --mode projected` |
| “COSMIC / no refusal template” | `estimate --mode cosmic` (score + DIM `r`; not full paper ID) |
| “multi-direction / concept cone / SVD subspace” | `estimate --mode svd --rank 2` |
| “ORBA directional / α=0 rank-1” | `apply --mode orba-directional` |
| “Householder / reflection” | `apply --mode orba-householder` (A/B only) |
| “inference ablation / steering hook” | `hook --h … --direction r.txt` |
| “false refusal / over-refusal / wmic” | two DIMs (`v` harmful/harmless, `w` factory-false/comply), form `w′ ← w − λ v` **offline** — no Wang flag; `estimate --mode dim` is **not** Wang |
| “harm ≠ refusal (Zhao)” | two DIMs; wipe factory only |
| “Heretic / Abliterix / Optuna” | **not this binary** — after demo |

```text
abliterate-cxx why projected
abliterate-cxx recipes
```

---

## How to read `eval`

```text
abliterate-cxx eval --jsonl examples/generations.jsonl
```

| Field | Meaning |
|-------|---------|
| `n` | rows scored |
| `refusal_rate` | fraction matching “I cannot / as an AI / …” |
| `false_refusal` | refused but `expected` was `tool_call` / `comply` / `good` |
| `true_refusal_hits` | refused and `expected` was `refuse` / `harmful` / `bad` |

Factory goal: **false_refusal → 0**, **true_refusal_hits** not collapsed. If both collapse you ablated raw factory `w` or the safety DIM — T38 is Wang `w′ ← w − λ v`, not a two-set factory DIM.

`empty_response` / `degenerate` (whitespace, `...`) is **not** a safety hit and **not** a successful abliteration. All-empty JSONL exits non-zero — generate answers first. Keyword rates are a learning loop, not a deploy gate.

This is a **keyword judge**. It is for learning the loop. Deploy gates live in `docs/evaluation.md` and `data/eval/*.jsonl`.

---

## When surgery “does nothing”

1. `cosmic_score ≤ 0` — contrast set cancelled (topic-matched pairs; Petrov 2026). Use unmatched harmful vs alpaca-style harmless, or factory txt.
2. High `dim_align` on toys but a **defended** base (extended-refusal 2505.19056, ART 2605.26526) — change checkpoint, not `α`.
3. Thinking models refuse inside CoT — `docs` thinking-model guide; not more SVD rank.
4. You edited a GGUF — never. Measure/bake safetensors, convert after.

---

## Day 1 — a real model (only after demo is boring)

1. `pip install heretic-llm==1.4.0` and `config.production.toml` from `sources/heretic-tools/`.
2. Dump or use Heretic’s own eval. Optionally export last-token residuals to `rows cols` text and reuse **this** CLI for DIM vs projected A/B.
3. Gate with handbook JSONL + GSM8K if math matters (Young 2512.13655).

You are not behind if you stay in `abliterate-cxx` for a day. You are behind if you skip it.

Obscure 2025–2026 pointers (`abliterate-cxx recipes`): OT 2603.04355 and RFM-AGOP 2607.02396 are **reported estimators** (GPU). DeepRefusal 2509.15202 is a **defense** (train-time probabilistic ablation) — [defenses-against-abliteration.md](defenses-against-abliteration.md), not an Abliterix bake. Task-conditioned over-refuse 2603.27518 is why one factory DIM may not be enough.

Ethics: `docs/risks-and-ethics.md`. Authorized lab / factory / research only.
