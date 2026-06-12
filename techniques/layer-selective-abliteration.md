# Layer-selective abliteration

## Observation

Refusal signal is **not uniform** across depth. Middle layers often dominate; early layers carry syntax; late layers align to token "I cannot".

## Manual strategy

1. Compute `||r_ℓ||` or refusal-classification AUC per layer
2. Ablate top-K layers or contiguous band (e.g. 60–70% depth)
3. Re-evaluate; expand or shrink band

## Automated strategy (Heretic)

Search hyperparameters:

- `layer_start`, `layer_end`
- per-layer strength `α_ℓ`
- target modules (MLP vs attn)

Objective: minimize refusal on benign set subject to capability constraint.

## Heuristic starting points (Llama-class 8B)

| Model depth | Starting band (rule of thumb) |
|-------------|-------------------------------|
| 32 layers | 14–22 |
| 40 layers | 18–28 |
| 80 layers | 40–60 |

Always re-tune — architecture and chat template matter.