# Method cookbook — commands for every abliteration stack

Copy-paste setups. Theory lives in [../docs/complete-curriculum.md](../docs/complete-curriculum.md). Hardware: [../docs/setup-encyclopedia.md](../docs/setup-encyclopedia.md). Ethics: [../docs/risks-and-ethics.md](../docs/risks-and-ethics.md).

---

## 0. This repo (no extra clone)

```bash
python scripts/check_env.py
npm run abliterate:estimate -- --self-test
npm run abliterate:apply -- --self-test
npm run abliterate:hook -- --self-test
npm run abliterate:eval -- --self-test
```

| Job | Command |
|-----|---------|
| Estimate `r` from caches | `python scripts/estimate-refusal-direction.py --mode projected --bad bad.pt --good good.pt --out r.pt` |
| SVD subspace | `python scripts/estimate-refusal-direction.py --mode svd --rank 4 --bad bad.pt --good good.pt --out R.pt` |
| Bake safetensors | `python scripts/apply-weight-abliteration.py --mode projected --weights ./base --direction r.pt --out ./abliterated` |
| Householder A/B | `--mode orba-householder` |
| Hook only | `python scripts/inference-hook-ablation.py --model ./base --direction r.pt --prompt "..."` |
| Score generations | `python scripts/eval-refusal-rate.py --responses-jsonl outs.jsonl` |
| ΔW → LoRA | `python scripts/export-abliteration-lora.py --base ./base --abliterated ./out --out ./adapter --rank 16` |

---

## 1. Heretic (production default)

```bash
pip install -U heretic-llm bitsandbytes accelerate
cp sources/heretic-tools/config.production.toml config.toml
# 8 GB: cp sources/heretic-tools/config.low-vram.toml config.toml
heretic Qwen/Qwen3-4B-Instruct-2507
heretic <model> --print-residual-geometry   # needs heretic-llm[research]
```

Thinking / factory / noslop: `config.thinking-model.toml`, `config.factory-qa.toml`, `config.noslop.toml`. Full flags: [../docs/advanced-techniques-catalog.md](../docs/advanced-techniques-catalog.md).

---

## 2. llm-abliteration (low VRAM / manual)

```bash
git clone https://github.com/jim-plus/llm-abliteration.git
cd llm-abliteration && pip install -r requirements.txt
python measure.py -m <model> -o directions.pt --quant 4bit --projected
python measure.py -m <model> -o directions.pt --quant 4bit --deccp   # multilingual
python sharded_ablate.py config.yaml --projected --normpreserve
```

Nous fork: [NousResearch/llm-abliteration](https://github.com/NousResearch/llm-abliteration). DECCP topics: [AUGMXNT/deccp](https://github.com/AUGMXNT/deccp).

---

## 3. Abliterix

```bash
git clone https://github.com/wuwangzhang1216/abliterix.git
cd abliterix && pip install -e .
abliterix run --config configs/<model-family>.yaml
```

AGPL-3.0. Presets cover MoE / VL / SSM / ORBA / SAE. Pair with HonestAbliterationBench **and** `data/eval/*.jsonl`.

---

## 4. ErisForge (layer band)

```bash
git clone https://github.com/Tsadoq/ErisForge.git
cd ErisForge && pip install -e .
```

Use after `heretic --print-residual-geometry` picks `L_peak ± 4`. See [../techniques/layer-selective-abliteration.md](../techniques/layer-selective-abliteration.md).

---

## 5. OBLITERATUS (SVD presets)

```bash
pip install "obliteratus[full]"
obliteratus obliterate <model> --method advanced --output-dir ./out
# reasoning / MoE: --method surgical
```

[../techniques/svd-whitened-obliteratus.md](../techniques/svd-whitened-obliteratus.md). Confirm `--help` on your installed version.

---

## 6. COSMIC (direction ID)

```bash
git clone https://github.com/wang-research-lab/COSMIC.git
# follow upstream README for ACL reproduction
python scripts/estimate-refusal-direction.py --mode cosmic --bad bad.pt --good good.pt --out r.pt
```

[../methods/cosmic-direction-id.md](../methods/cosmic-direction-id.md).

---

## 7. FailSpy / TransformerLens (hooks)

```bash
git clone https://github.com/FailSpy/abliterator.git
# notebooks: cache resid, try hook, then bake winner
```

---

## 8. Arditi paper code

```bash
git clone https://github.com/andyrdt/refusal_direction.git
```

---

## 9. False-refusal ICLR 2025

```bash
git clone https://github.com/mainlp/False-Refusal-Mitigation.git
# or Heretic with data/eval/factory-bad-prompts.txt as [bad_prompts]
```

---

## 10. Harm vs refusal (Zhao 2025)

```bash
git clone https://github.com/CHATS-lab/LLMs_Encode_Harmfulness_Refusal_Separately.git
```

Analysis / Latent Guard — not a factory uncensor script. [../techniques/harm-vs-refusal-directions.md](../techniques/harm-vs-refusal-directions.md).

---

## 11. Niche 2026 CLIs

| Tool | Install |
|------|---------|
| ablate-llm | `pip install ablate-llm` |
| Blasphemer (macOS Heretic fork) | `git clone https://github.com/sunkencity999/blasphemer` |
| J-Wash | `git clone https://github.com/Extraltodeus/J-Wash` |
| vauban (MLX) | `git clone https://github.com/teilomillet/vauban` |
| senbonzakura (multi-D) | `git clone https://github.com/elementmerc/senbonzakura` |

None of these replace Stage 3 eval gates.

---

## 12. GGUF / Ollama after any baker

```bash
python llama.cpp/convert_hf_to_gguf.py ./abliterated --outfile model.gguf --outtype q4_k_m
# LoRA sidecar
python llama.cpp/convert_lora_to_gguf.py --outfile lora.gguf --base-model-id <id> --lora-path ./adapter
```

[../docs/toolchain-safetensors-gguf-lora.md](../docs/toolchain-safetensors-gguf-lora.md) · [run-locally-ollama-lmstudio.md](run-locally-ollama-lmstudio.md).

---

## Eval after every command above

```bash
npm run eval:stats
python scripts/eval-refusal-rate.py --responses-jsonl <your-generations.jsonl>
```

Corpora: [../docs/evaluation.md](../docs/evaluation.md).
