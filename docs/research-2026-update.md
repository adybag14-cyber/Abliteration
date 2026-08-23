# 2026 research update — 50 primary papers

**Snapshot:** 23 August 2026 · **Authority:** arXiv primary records · **Machine catalog:** [catalog-2026.json](../sources/research/catalog-2026.json)

This update adds 50 papers beyond the handbook core. It is intentionally broader than abliteration alone: refusal-direction surgery is only interpretable when read alongside representation geometry, activation steering, over-refusal, safety recovery, attack surfaces, and evaluation design.

## How to use this update

- **Mechanism** asks where refusal and harmful intent are encoded and whether the representation is causal.
- **Intervention** covers steering, controlled relaxation, unlearning, and representation edits.
- **Defense** covers rebuilding, anchoring, or routing safety after representation-level attacks.
- **Evaluation** measures side effects, false refusal, utility, quantization drift, or benchmark validity.
- **Attack** studies how representation controls fail. These entries are included for defensive evaluation, not as deployment recipes.

Inclusion in this catalog means **relevant primary source**, not independent replication or endorsement. Freeze an exact paper version before reproducing a claim, and keep the handbook deployment gates in [evaluation.md](evaluation.md).

## Mechanism

| Published | Paper | First author | arXiv |
|-----------|-------|--------------|-------|
| 2026-08-12 | Localizing Safety Alignment: MLP Layers and Mid-Network Blocks Encode Refusal Behavior in Large Language Models | Mingyu Zong | [2608.11583](https://arxiv.org/abs/2608.11583) |
| 2026-08-06 | Detecting Safety Training Modification in Language Models via Activation Analysis | Glen Messenger | [2608.05578](https://arxiv.org/abs/2608.05578) |
| 2026-07-19 | Abliteration Is Not a Scalpel: Off-Target Effects of Refusal Removal on Decision Disposition Across Model Families | Aleksander Fafuła | [2607.17427](https://arxiv.org/abs/2607.17427) |
| 2026-07-11 | When Are Sparse Feature Interventions Actually Localized? Matched Evaluation for SAE-Based Safety Control | Daming Luo | [2607.10226](https://arxiv.org/abs/2607.10226) |
| 2026-07-06 | Faithfulness to Refusal: A Causal Audit of Neuron Selectors | Ananth Eswar | [2607.05355](https://arxiv.org/abs/2607.05355) |
| 2026-07-02 | Has This Checkpoint Been Abliterated? A Two-Signal Audit and Its Failure Map | Gabriel Hurtado | [2607.01854](https://arxiv.org/abs/2607.01854) |
| 2026-06-24 | Refusal Lives Downstream of Persona in Chat Models | Viola Zhong | [2606.26161](https://arxiv.org/abs/2606.26161) |
| 2026-06-23 | Perfect Detection, Failed Control: The Geometry of Knowing vs. Steering in Language Models | Cosimo Galeone | [2606.24952](https://arxiv.org/abs/2606.24952) |
| 2026-06-21 | The Geometry of Refusal: Linear Instability in Safety-Aligned LLMs | Shivam Ratnakar | [2606.22686](https://arxiv.org/abs/2606.22686) |
| 2026-06-21 | Skin-Deep: A Geometric Diagnostic for Alignment Fragility in Large Language Model Representations | Dongyub Jude Lee | [2606.22676](https://arxiv.org/abs/2606.22676) |
| 2026-05-28 | BioRefusalAudit: Auditing Biosecurity Refusal Depth Using General and Domain-Fine-Tuned Sparse Autoencoders | Caleb DeLeeuw | [2605.30162](https://arxiv.org/abs/2605.30162) |
| 2026-05-23 | Measuring Alignment-Induced Activation Shifts Correctly: A Template-Controlled Difference-in-Differences Protocol | Yuki Nakamura | [2605.24583](https://arxiv.org/abs/2605.24583) |
| 2026-04-29 | Dynamic Adversarial Fine-Tuning Reorganizes Refusal Geometry | Wenhao Lan | [2604.27019](https://arxiv.org/abs/2604.27019) |
| 2026-04-25 | From Concept-Aligned Tokens to Vulnerable Features: Mechanistic Localization of Jailbreaks | Nilanjana Das | [2604.23130](https://arxiv.org/abs/2604.23130) |
| 2026-04-21 | Harmful Intent as a Geometrically Recoverable Feature of LLM Residual Streams | Isaac Llorente-Saguer | [2604.18901](https://arxiv.org/abs/2604.18901) |

## Intervention

| Published | Paper | First author | arXiv |
|-----------|-------|--------------|-------|
| 2026-08-17 | BabelSteering: Multilingual Safety Alignment via English Steering Vectors | Emma V. Stein | [2608.16577](https://arxiv.org/abs/2608.16577) |
| 2026-08-13 | HiRoute: Hierarchical Routed Prompt Tuning for Safety Alignment of Large Language Models | Fangzhou Chen | [2608.12821](https://arxiv.org/abs/2608.12821) |
| 2026-07-22 | OPIUM: Mitigating Steering Externalities and Over-Refusal via Dual Objective Latent Optimization | Kavin Aravindan | [2607.19806](https://arxiv.org/abs/2607.19806) |
| 2026-07-10 | Present but Rescaled: Chat-to-Agent Transfer of Additive Activation Steering | Lucas Pinto | [2607.09156](https://arxiv.org/abs/2607.09156) |
| 2026-07-01 | HARC: Coupling Harmfulness and Refusal Directions for Robust Safety Alignment | Shei Pern Chua | [2607.00572](https://arxiv.org/abs/2607.00572) |
| 2026-06-30 | Addressing Over-Refusal in LLMs with Competing Rewards | Taeyoun Kim | [2606.31748](https://arxiv.org/abs/2606.31748) |
| 2026-06-07 | Beyond Linear Activation Steering: Invertible Latent Transformations for Controlling LLM Behavior | Tuc Nguyen | [2606.08454](https://arxiv.org/abs/2606.08454) |
| 2026-06-01 | SafeSteer: Localized On-Policy Distillation for Efficient Safety Alignment | Hao Li | [2606.02530](https://arxiv.org/abs/2606.02530) |
| 2026-05-22 | Palette: A Modular, Controllable, and Efficient Framework for On-demand Authorized Safety Alignment Relaxation in LLMs | Qitao Tan | [2605.24154](https://arxiv.org/abs/2605.24154) |
| 2026-05-15 | ASRU: Activation Steering Meets Reinforcement Unlearning for Multimodal Large Language Models | Jiahui Guang | [2605.15687](https://arxiv.org/abs/2605.15687) |
| 2026-05-12 | Inference-Time Machine Unlearning via Gated Activation Redirection | Vinícius Conte Turani | [2605.12765](https://arxiv.org/abs/2605.12765) |

## Defense

| Published | Paper | First author | arXiv |
|-----------|-------|--------------|-------|
| 2026-08-18 | Fool's Gold: Defensive Deception Against Safety-Removal Attacks on Open-Weight Models | Mark Russinovich | [2608.17202](https://arxiv.org/abs/2608.17202) |
| 2026-08-13 | Refusing Intent, Not Form: Wrapper-Based Intent-Group Supervision for LLM Safety | Ping Wu | [2608.13304](https://arxiv.org/abs/2608.13304) |
| 2026-07-31 | A Constitution-Grid Instrument for Data-Efficient RL Alignment (C-Guard) | Xianling Zhang | [2608.00180](https://arxiv.org/abs/2608.00180) |
| 2026-07-30 | A Cross-Architecture Audit of Direction-Based Inference-Time Defences in Vision-Language Models | Xiangyu Yin | [2607.27910](https://arxiv.org/abs/2607.27910) |
| 2026-06-30 | Harnessing Textual Refusal Directions for Multimodal Safety | Moreno D'Incà | [2606.31876](https://arxiv.org/abs/2606.31876) |
| 2026-06-16 | AnchorKV: Safety-Aware KV Cache Compression via Soft Penalty with a Refusal Anchor | Ning Ni | [2606.17872](https://arxiv.org/abs/2606.17872) |
| 2026-06-09 | Training LLMs to Enforce Multi-Level Instruction Hierarchies via Gravity-Weighted Direct Preference Optimization | Lena S. Bolliger | [2606.10860](https://arxiv.org/abs/2606.10860) |
| 2026-06-09 | Stop Early, Spend Less: Hidden-State Probes as a Practical Recipe for Streaming Moderation of LLM Outputs | Huizhen Shu | [2606.10487](https://arxiv.org/abs/2606.10487) |
| 2026-06-07 | Abliteration Mitigation via Refusal Aliases | Nathan Truong | [2608.18093](https://arxiv.org/abs/2608.18093) |
| 2026-06-03 | Inference-Time Vulnerability Beyond Shallow Safety: Alignment Along Generation Trajectories | Kyungmin Park | [2606.04778](https://arxiv.org/abs/2606.04778) |
| 2026-05-04 | Revisiting JBShield: Breaking and Rebuilding Representation-Level Jailbreak Defenses | Kemal Derya | [2605.03095](https://arxiv.org/abs/2605.03095) |

## Evaluation

| Published | Paper | First author | arXiv |
|-----------|-------|--------------|-------|
| 2026-07-28 | Forecasting Side Effects of Activation Steering | Chong Yong Ong | [2608.11227](https://arxiv.org/abs/2608.11227) |
| 2026-07-27 | When LLM Defenses Backfire: Characterizing Safety, Performance, and Cost Trade-offs | Tong Zhang | [2607.24392](https://arxiv.org/abs/2607.24392) |
| 2026-07-17 | Refusal is Not Safety! Benchmarking Latent Safety Risks of LLM-Driven Content Humorization | Yu Cui | [2607.15977](https://arxiv.org/abs/2607.15977) |
| 2026-07-07 | Beyond Refusal: A Same-Lineage Study of Aligned and Abliterated LLMs for Vulnerability Analysis | Mingchen Li | [2607.05842](https://arxiv.org/abs/2607.05842) |
| 2026-07-02 | Not All Refusals Are Equal: How Safety Alignment Fails Cybersecurity at Scale | Vadym Hadetskyi | [2607.02714](https://arxiv.org/abs/2607.02714) |
| 2026-06-08 | Quality Is Not a Safety Proxy Under Quantization | Sahil Kadadekar | [2606.10154](https://arxiv.org/abs/2606.10154) |
| 2026-06-07 | Activation Steering Induces Emergent Misalignment: A More Comprehensive Evaluation | Qi Cao | [2606.08682](https://arxiv.org/abs/2606.08682) |
| 2026-05-28 | Beyond Attack Success Rate: Temporal Logit Observability for LLM Safety Failures | Junyoung Park | [2605.29629](https://arxiv.org/abs/2605.29629) |
| 2026-05-07 | Beyond Fixed Benchmarks and Worst-Case Attacks: Dynamic Boundary Evaluation for Language Models | Haoxiang Wang | [2605.06213](https://arxiv.org/abs/2605.06213) |

## Attack

| Published | Paper | First author | arXiv |
|-----------|-------|--------------|-------|
| 2026-07-09 | Optimizing Against Safety Representations: Activation-Guided Adversarial Suffixes and the Geometry of Refusal | Ege Çakar | [2607.08883](https://arxiv.org/abs/2607.08883) |
| 2026-06-04 | Steering Vectors are an Adversarial Attack Surface | Abzal Aidakhmetov | [2606.05958](https://arxiv.org/abs/2606.05958) |
| 2026-05-20 | Latent-space Attacks for Refusal Evasion in Language Models | Giorgio Piras | [2605.21706](https://arxiv.org/abs/2605.21706) |
| 2026-05-17 | Ablating Safety: Mechanisms for Removing Alignment in Language Models for Security Applications | Isaac David | [2605.17413](https://arxiv.org/abs/2605.17413) |

## Reproducible snapshot contract

The machine-readable catalog is the canonical list. npm run validate enforces the declared count, unique arXiv IDs, HTTPS primary links, dates, areas, titles, and authors. The catalog deliberately links to arXiv instead of committing another large batch of PDFs; pin a PDF only when an experiment depends on its exact bytes.
