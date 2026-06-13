# Vision & multimodal abliteration

VLMs (Gemma 3 4B/12B vision, Qwen2.5-VL, LLaVA-class) carry refusal in the **language trunk** — abliteration targets are still primarily `down_proj` / `o_proj` on the text transformer.

---

## What Heretic measures today

Default Heretic runs use **text prompts** from `[bad_prompts]` / `[good_prompts]`. For VLMs:

| Mode | Effect |
|------|--------|
| Text-only measure | Removes text-channel refusal; **most common path** |
| Image+text measure | Not default — needs custom prompt files with image paths if supported |

For factory agents that only process **text tool output**, text-only abliteration is usually sufficient.

---

## Vision-specific false refusals

| Refusal type | Weight surgery helps? |
|--------------|----------------------|
| "I cannot view images" | Partially — may need image-in-the-loop eval |
| Refuses `wmic` with text-only prompt | ✅ Standard abliteration |
| Refuses describing image content | ✅ If prompts include images in measure set |

Community VL abliterated: `huihui-ai/Qwen2.5-VL-7B-Instruct-abliterated` (see registry).

---

## Recommended workflow

| Step | Action |
|------|--------|
| 1 | Abliterate on **text-only** harmful/harmless sets first |
| 2 | Eval text tool prompts: `hardware-factory-prompts.jsonl` |
| 3 | If image QA still refuses, add 20–50 image-caption pairs to custom `[bad_prompts]` |
| 4 | Lower `max_weight` — VLMs are more sensitive to KL drift |

```toml
winsorization_quantile = 0.95
kl_divergence_target = 0.008
full_normalization_lora_rank = 8
```

---

## Module map (Gemma 3 VL)

| Component | Abliterate? |
|-----------|-------------|
| Language `down_proj` | ✅ Primary |
| Vision encoder | ❌ Usually leave untouched |
| Multimodal projector | ⚠️ Research only — high capability risk |

Heretic upstream `model.py` maps supported VL architectures — verify before manual edits.

---

## GGUF / Ollama for VL

Vision models need **mmproj** + vision template in Modelfile. After abliteration:

1. Export full HF folder (vision + language weights).
2. Convert with llama.cpp vision scripts for your model family.
3. Test **text-only** and **image+text** in Ollama separately.

→ [../instructions/run-locally-ollama-lmstudio.md](../instructions/run-locally-ollama-lmstudio.md)

---

## Related

- [model-family-playbook.md](model-family-playbook.md)
- [eval-driven-abliteration.md](eval-driven-abliteration.md)
- [../docs/tools/heretic-models-registry.md](../docs/tools/heretic-models-registry.md)