# llm-abliteration workflow

Manual measure → analyze → ablate pipeline from [jim-plus/llm-abliteration](https://github.com/jim-plus/llm-abliteration).

## Clone

```bash
git clone https://github.com/jim-plus/llm-abliteration.git tools/llm-abliteration
cd tools/llm-abliteration
pip install -r requirements.txt
```

## 1. Measure directions

```bash
python measure.py -m <path_to_model> -o directions.pt
```

Custom datasets (local `.txt`, `.jsonl`, `.parquet`):

```bash
python measure.py -m <model> -o directions.pt \
  --data-harmful ./data/harmful.txt \
  --data-harmless ./data/harmless.txt
```

### Advanced flags

| Flag | Effect |
|------|--------|
| `--quant 4bit` | On-the-fly bitsandbytes quant for measurement |
| `--projected` | Projected abliteration (orthogonalize vs harmless dir) |
| `--deccp` | Extra topics for Chinese models |

## 2. Analyze

```bash
python analyze.py directions.pt -c
```

Use charts to pick **middle-to-late** layers as refusal direction sources.

## 3. Ablate

Edit example YAML (see repo), then:

```bash
python sharded_ablate.py abliteration_config.yaml
```

| Flag | Effect |
|------|--------|
| `--projected` | Biprojected measurement |
| `--normpreserve` | Norm-preserving ablation |

## 4. Test

```bash
python chat.py -m <abliterated_model_path>
python compare.py -a <base> -b <abliterated>
```

## Refresh docs

```bash
node scripts/fetch-docs.mjs
# reads sources/fetched/llm-abliteration-readme.txt
```