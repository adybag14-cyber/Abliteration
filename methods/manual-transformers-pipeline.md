# Manual Transformers pipeline

End-to-end without automated search — full control.

## Dependencies

```bash
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install torch transformers accelerate datasets einops
# optional: transformer_lens, safetensors
```

## Steps

### 1. Load model

```python
from transformers import AutoModelForCausalLM, AutoTokenizer
import torch

model_id = "meta-llama/Llama-3.1-8B-Instruct"
tok = AutoTokenizer.from_pretrained(model_id)
model = AutoModelForCausalLM.from_pretrained(
    model_id, torch_dtype=torch.float16, device_map="auto"
)
```

### 2. Harvest activations

Run harmful/harmless lists; register forward hooks on each layer's residual; stack activations → compute `r_ℓ`.

### 3. Edit weights

Loop layers; fetch `model.model.layers[L].mlp.down_proj.weight`; apply [mlp-down-proj-abliteration.md](mlp-down-proj-abliteration.md).

### 4. Save

```python
model.save_pretrained("./out/abliterated", safe_serialization=True)
tok.save_pretrained("./out/abliterated")
```

### 5. Evaluate

See [../docs/evaluation.md](../docs/evaluation.md).

## Directory convention

```
runs/
  2026-06-12_llama31-8b/
    directions.pt
    config.json      # layers, alphas, hook point
    eval_results.md
    model/           # saved checkpoint
```