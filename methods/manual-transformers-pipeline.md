# Manual Transformers pipeline

Clone reference implementations from GitHub instead of copying snippets from blogs.

## Recommended repos to study

| Repo | Pattern |
|------|---------|
| [andyrdt/refusal_direction](https://github.com/andyrdt/refusal_direction) | Full paper pipeline |
| [Sumandora/remove-refusals-with-transformers](https://github.com/Sumandora/remove-refusals-with-transformers) | Minimal Transformers-only |
| [jim-plus/llm-abliteration](https://github.com/jim-plus/llm-abliteration) | measure + sharded ablate |

## Dependencies

```bash
git clone https://github.com/andyrdt/refusal_direction.git tools/refusal_direction
cd tools/refusal_direction && source setup.sh
```

Or standalone:

```bash
pip install torch transformers accelerate einops
pip install git+https://github.com/TransformerLensOrg/TransformerLens.git
```

## Load model

```python
from transformers import AutoModelForCausalLM, AutoTokenizer
import torch

model_id = "./models/Meta-Llama-3-8B-Instruct"  # local clone preferred
tok = AutoTokenizer.from_pretrained(model_id)
model = AutoModelForCausalLM.from_pretrained(
    model_id, torch_dtype=torch.float16, device_map="auto"
)
```

## Paper reproduction one-liner

From [refusal_direction README](https://github.com/andyrdt/refusal_direction):

```bash
python3 -m pipeline.run_pipeline --model_path meta-llama/Meta-Llama-3-8B-Instruct
```

Artifacts: `pipeline/runs/<alias>/direction.pt`

## Save abliterated checkpoint

```python
model.save_pretrained("./out/abliterated", safe_serialization=True)
tok.save_pretrained("./out/abliterated")
```

## Context7

Query `transformer_lens` hook names before writing custom hooks — [../docs/context7.md](../docs/context7.md).