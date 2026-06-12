# GGUF export notes

For **llama.cpp**, **Ollama**, **LM Studio** inference after abliteration.

## Path

1. Save abliterated model as safetensors (Transformers layout)
2. Clone llama.cpp from GitHub and convert:

```bash
git clone https://github.com/ggml-org/llama.cpp.git tools/llama.cpp
cd tools/llama.cpp
python convert_hf_to_gguf.py ../../out/abliterated --outfile ../../out/model-f16.gguf
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