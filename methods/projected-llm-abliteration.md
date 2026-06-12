# Projected & norm-preserving pipeline (llm-abliteration)

Manual implementation of **Jim Lai** refinements via [jim-plus/llm-abliteration](https://github.com/jim-plus/llm-abliteration).

## Full command chain

```bash
git clone https://github.com/jim-plus/llm-abliteration.git tools/llm-abliteration
cd tools/llm-abliteration
pip install -r requirements.txt bitsandbytes
```

### 1. Measure (optionally 4-bit)

```bash
python measure.py -m <model_path> -o directions.pt \
  --data-harmful ./data/harmful.txt \
  --data-harmless ./data/harmless.txt \
  --quant 4bit \
  --projected
```

`--projected` computes refusal direction orthogonal to harmless centroid per layer.

### 2. Analyze layer geometry

```bash
python analyze.py directions.pt -c
```

Select layers where refusal signal peaks (typically 45%–75% depth).

### 3. Configure ablation YAML

Edit repo example — set:

- `layers: [L_start, ..., L_end]`
- `alpha: 0.5` starting partial strength
- `targets: [down_proj, o_proj]` as supported

### 4. Sharded ablate

```bash
python sharded_ablate.py abliteration_config.yaml \
  --projected --normpreserve
```

`--normpreserve` keeps row norms of each weight matrix.

### 5. Compare

```bash
python compare.py -a <base> -b <abliterated>
python chat.py -m <abliterated>
```

## When vs Heretic

| Criterion | llm-abliteration manual | Heretic |
|-----------|-------------------------|---------|
| Optuna kernel search | Manual layer/α | Automatic |
| MoE experts | Manual loop | Built-in |
| Reproducibility | Full YAML control | config.toml |
| Speed to checkpoint | Slower | Faster |

Use manual pipeline when Heretic unsupported architecture or you need **paper-exact** projected+normpreserve without Optuna.

→ [../techniques/projected-norm-preserving-abliteration.md](../techniques/projected-norm-preserving-abliteration.md)