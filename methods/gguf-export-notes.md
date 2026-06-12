# GGUF export notes

For **llama.cpp**, **Ollama**, **LM Studio** inference after HF abliteration.

## Path

1. Save abliterated model in HF format (safetensors)
2. Convert:

```bash
# llama.cpp convert script (names change — use your checkout's README)
python convert_hf_to_gguf.py ./out/abliterated --outfile ./out/model-f16.gguf
```

3. Quantize (optional):

```bash
./llama-quantize ./out/model-f16.gguf ./out/model-q4_k_m.gguf Q4_K_M
```

## Caveats

- Chat template / special tokens must match base model
- Quantization can amplify abliteration side effects — always test Q4 vs F16
- Some merged GGUF tools expect original architecture flags unchanged

## Ollama Modelfile sketch

```
FROM ./model-q4_k_m.gguf
TEMPLATE """{{ .System }}..."""
PARAMETER temperature 0.7
```