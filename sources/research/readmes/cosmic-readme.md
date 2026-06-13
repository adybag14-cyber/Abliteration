# fetched: 2026-06-13T23:44:14.843Z
# url: https://raw.githubusercontent.com/wang-research-lab/COSMIC/main/README.md

# COSMIC: Generalized Refusal Direction Identification in LLM Activations

> ⚠️ **Content Warning**: This repository contains text that may be offensive, harmful, or otherwise inappropriate in nature. Please proceed with caution.

This repository contains the codebase accompanying the paper:

**[COSMIC: Generalized Refusal Direction Identification in LLM Activations](https://arxiv.org/abs/2506.00085)**  
*Vincent Siu, Nicholas Crispino, Zihao Yu, Sam Pan, Zhun Wang, Yang Liu, Dawn Song, and Chenguang Wang*

We introduce **COSMIC**, a framework for identifying and steering internal refusal directions in large language models (LLMs). The repository supports experiments for both aligned and weakly aligned models.

Much of the repository structure and codebase builds on the open-sourced framework from [Arditi et al. (2024)](https://arxiv.org/abs/2404.18001). We are grateful for their contributions and build upon their substring-matching and direction selection infrastructure.

---

## 🔧 Running the Pipeline

To reproduce the main experiments, run:

```python
python3 -m pipeline.run_pipeline --model_path {model_path} --affine_steering {true, false}
```


Replace `{model_path}` with the HuggingFace model name or local path (e.g., `meta-llama/Meta-Llama-3-8B-Instruct`). Choose either true or false to run either ACE (Marshall et al. 2025) or LCE (Arditi et al. respectively).

The pipeline executes the following steps:

1. **Generate Candidate Refusal Directions**  
   - Saves artifacts to: `pipeline/runs/{model_alias}/generate_directions`

2. **Select the Most Effective Refusal Direction**  
   - Saves selection output to: `pipeline/runs/{model_alias}/select_direction`  
   - Final direction stored as: `pipeline/runs/{model_alias}/direction.pt`

3. **Evaluate on Harmful Prompts (Target ASR)**  
   - Completions and metrics saved to: `pipeline/runs/{model_alias}/completions`

4. **Evaluate on Harmless Prompts (False Refusal Rate)**  
   - Reuses the same completions directory for harmless prompts

---

## 🔀 Variant Pipelines

- `pipeline/run_pipeline_cosmic.py`: Main COSMIC pipeline (supports both ACE and LCE via `--affine_steering` flag)  
- `pipeline/run_pipeline_substring.py`: Implements substring-matching method from Arditi et al. (2024)  
- `run_pipeline_unaligned_ace.py`: Evaluates ACE steering on weakly aligned models (Section 6 of the paper)

---

## 📝 Citation

If you find this work helpful, please consider citing our paper:


If you find this work useful in your research, please consider citing our [paper](https://arxiv.org/abs/2506.00085):
```tex
@misc{siu2025cosmicgeneralizedrefusaldirection,
      title={COSMIC: Generalized Refusal Direction Identification in LLM Activations}, 
      author={Vincent Siu and Nicholas Crispino and Zihao Yu and Sam Pan and Zhun Wang and Yang Liu and Dawn Song and Chenguang Wang},
      year={2025},
      eprint={2506.00085},
      archivePrefix={arXiv},
      primaryClass={cs.CL},
      url={https://arxiv.org/abs/2506.00085}, 
}
```
