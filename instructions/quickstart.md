# Quickstart

Fastest path to **understanding** the pipeline — uses inference hooks (no permanent edit).

## 1. Environment

```bash
cd ~/abliteration
python -m venv .venv
.venv\Scripts\activate        # Windows
pip install torch
pip install git+https://github.com/TransformerLensOrg/TransformerLens.git
```

## 2. Load a small model (smoke test)

Use a public 1–3B model if VRAM is tight:

```python
from transformer_lens import HookedTransformer
model = HookedTransformer.from_pretrained("Qwen/Qwen2.5-1.5B-Instruct")
```

## 3. Collect paired prompts (minimal)

Create `data/paired.jsonl` with 32 lines:

```json
{"harmful": "prompt that gets refused", "harmless": "similar benign prompt"}
```

Run base model; label which prompts refused; keep pairs.

## 4. Estimate one direction (single layer)

Pick layer `L = n_layers // 2`. Hook `blocks.L.hook_resid_post`; mean-diff harmful vs harmless → `r`.

## 5. Ablate at inference

Add hook from [../methods/residual-hook-ablation.md](../methods/residual-hook-ablation.md).

## 6. Compare

Same prompt, hook on vs off. Log outputs.

## Next

- Permanent checkpoint → [heretic-workflow.md](heretic-workflow.md)
- Factory / pentest / CyberGym agent → [agentic-security-stack.md](agentic-security-stack.md)
- Full manual control → [manual-full-pipeline.md](manual-full-pipeline.md)