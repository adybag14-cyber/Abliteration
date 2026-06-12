# Automated Heretic-style search

**Heretic** (community tool) automates:

1. Direction estimation
2. Layer / strength search
3. Weight application
4. Checkpoint export

## Typical workflow

```bash
# Example — exact CLI flags vary by fork; read tool README
pip install heretic  # or clone GitHub repo

heretic run \
  --model meta-llama/Llama-3.1-8B-Instruct \
  --output ./out/Llama-3.1-8B-abliterated \
  --device cuda
```

## What it searches

- Layer subset to modify
- α strength per layer
- Sometimes MLP vs attn toggles

## Outputs

- Modified `model.safetensors` + config
- Log of refusal rate on internal eval set
- Optional GGUF conversion script

## Tips

- Use GPU with ≥24 GB for 8B FP16
- Pin `transformers` + `torch` versions to tool requirements
- Keep original HF revision hash in your notes

→ Full checklist: [../instructions/heretic-workflow.md](../instructions/heretic-workflow.md)