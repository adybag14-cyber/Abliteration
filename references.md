# References

## Primary papers

| Title | Authors / Year | Link | Notes |
|-------|----------------|------|-------|
| Refusal in LLMs is mediated by a single direction | Arditi et al., 2024 | [arXiv:2406.11717](https://arxiv.org/abs/2406.11717) | Foundational refusal-direction work |
| Abliteration: Ablating LLM Safety Mechanisms | (survey / follow-on) | [ACL Findings 2025](https://aclanthology.org/2025.findings-acl.1310/) | Broader framing of abliteration family |
| LessWrong summary | — | [LW post](https://www.lesswrong.com/posts/jGuXSZgv6qfdhMCuJ/refusal-in-llms-is-mediated-by-a-single-direction) | Accessible intuition |

## Tools & code

| Project | URL | Role |
|---------|-----|------|
| **Heretic** | Search GitHub for `heretic` + abliteration | Automated refusal-direction discovery & weight edit |
| **llm-abliteration** | Community repos on GitHub | Reference implementations |
| **TransformerLens** | [github.com/TransformerLensOrg/TransformerLens](https://github.com/TransformerLensOrg/TransformerLens) | Activation harvesting & interpretability |
| **Hugging Face Transformers** | [huggingface.co/docs/transformers](https://huggingface.co/docs/transformers) | Load/save modified weights |

## Blog posts & guides

| Title | URL |
|-------|-----|
| mlabonne — Abliteration guide | [huggingface.co/blog/mlabonne/abliteration](https://huggingface.co/blog/mlabonne/abliteration) |
| docs.abliteration.ai | [docs.abliteration.ai](https://docs.abliteration.ai/what-is-abliteration) |

## Related concepts

- **Activation steering** — intervene at inference time (no permanent weight change)
- **Directional ablation** — remove a direction from activations during forward pass
- **W2SV / rank-1 updates** — low-rank weight patches derived from activation statistics
- **Domain-specific abliteration** — target refusal only in narrow topic subspaces