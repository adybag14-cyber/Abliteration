# fetched: 2026-06-13T23:44:14.843Z
# url: https://raw.githubusercontent.com/ricyoung/abliteration-comparison/main/README.md

# Comparative Analysis of LLM Abliteration Methods

This repository contains reproducibility materials for the paper:

**"Comparative Analysis of LLM Abliteration Methods: A Cross-Architecture Evaluation"**

Richard J. Young
University of Nevada Las Vegas, Department of Neuroscience

## Abstract

Safety alignment mechanisms in large language models prevent responses to harmful queries through learned refusal behavior, yet these same mechanisms impede legitimate research applications including cognitive modeling, adversarial testing, and security analysis. This study evaluates four abliteration tools (Heretic, DECCP, ErisForge, FailSpy) across sixteen instruction-tuned models (7B–14B parameters), reporting tool compatibility and quantitative metrics on capability preservation and refusal suppression.

## Repository Contents

```
├── paper/
│   ├── paper01_abliteration_comparison.tex   # LaTeX source
│   ├── paper01_abliteration_comparison.pdf   # Compiled paper
│   └── figures/                              # Paper figures
├── results/
│   ├── abliteration_info/                    # Per-model abliteration configs & metrics
│   └── benchmarks/                           # Benchmark evaluation results
└── README.md
```

## Models Evaluated

| Model | Parameters | Architecture | Alignment |
|-------|------------|--------------|-----------|
| Llama-3.1-8B-Instruct | 8.03B | GQA, RoPE | SFT + RLHF + DPO |
| Mistral-7B-Instruct-v0.3 | 7.25B | SWA, GQA | SFT + DPO |
| Qwen2.5-7B-Instruct | 7.62B | GQA, RoPE | SFT + RLHF |
| Qwen3-8B | 8.19B | GQA, RoPE | SFT + RLHF |
| Qwen3-14B | 14.8B | GQA, RoPE | SFT + RLHF |
| Yi-1.5-9B-Chat | 9.05B | GQA | SFT + RLHF |
| Zephyr-7B-beta | 7.24B | SWA, GQA | DPO-only |
| deepseek-llm-7b-chat | 7.33B | GQA | SFT + RLHF |
| StableLM-2-12B-chat | 12.1B | GQA | SFT + DPO |
| Gemma-2-9B-it | 9.24B | GQA, RoPE | SFT |
| Gemma-7B-it | 8.54B | MHA | SFT |
| InternLM2.5-7B-chat | 7.74B | GQA | SFT + RLHF |
| OpenChat-3.5-0106 | 7.24B | GQA | C-RLFT |
| Phi-3-small-8k-instruct | 7.39B | GQA | SFT |
| Vicuna-7B-v1.5 | 6.74B | MHA | SFT |
| Falcon-Mamba-7B-instruct | 7.27B | Mamba SSM | SFT |

## Tools Evaluated

- **[Heretic](https://github.com/p-e-w/heretic)**: Bayesian-optimized abliteration with TPE sampling
- **[DECCP/llm-abliteration](https://github.com/jim-plus/llm-abliteration)**: Memory-efficient sharded processing
- **[ErisForge](https://github.com/Tsadoq/ErisForge)**: Decoder layer transformation approach
- **[FailSpy/abliterator](https://github.com/FailSpy/abliterator)**: TransformerLens-based activation caching

## Model Weights

Select abliterated model weights for permissively-licensed base models are available in our [Hugging Face collection](https://huggingface.co/collections/richardyoung/uncensored-and-abliterated-llms-69267b2d66ae2cc21c4b0e99).

Abliterated weights for models with restrictive licenses are available upon request to verified researchers for reproducibility purposes.

## Key Findings

1. **Capability preservation varies by tool**: ErisForge and DECCP showed lowest benchmark degradation (avg GSM8K Δ: -0.28 pp and -0.13 pp respectively)
2. **Mathematical reasoning is most sensitive**: GSM8K scores ranged from +1.51 pp to -18.81 pp depending on tool and model
3. **DPO-only alignment is most susceptible**: Zephyr-7B-beta achieved 98% ASR with minimal distribution shift (KL: 0.076)
4. **Tool compatibility varies**: Heretic 16/16, DECCP 11/16, ErisForge 9/16, FailSpy 5/16

## Citation

```bibtex
@article{young2024abliteration,
  title={Comparative Analysis of LLM Abliteration Methods: A Cross-Architecture Evaluation},
  author={Young, Richard J.},
  year={2024},
  institution={University of Nevada Las Vegas}
}
```

## License

This repository is provided for academic research purposes. See individual model licenses for redistribution terms.

## Contact

For questions or requests for restricted model weights, contact: ryoung@unlv.edu
