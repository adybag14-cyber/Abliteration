# Experiment provenance and artifact integrity

An abliteration result is reproducible only when the exact base revision,
contrast inputs, chat template, configuration, method parameters, evaluation
outputs, and saved artifacts are bound together. Model names and screenshots
are not sufficient.

## Create a manifest

Run this after the candidate checkpoint and evaluation report exist:

```bash
python scripts/experiment-manifest.py create \
  --output runs/qwen-exp-07/manifest.json \
  --base-model Qwen/example-model \
  --revision 0123456789abcdef0123456789abcdef01234567 \
  --method projected-subspace \
  --config runs/qwen-exp-07/config.toml \
  --input runs/qwen-exp-07/contrast-manifest.json \
  --input runs/qwen-exp-07/base-eval.jsonl \
  --artifact runs/qwen-exp-07/candidate-eval.jsonl \
  --artifact runs/qwen-exp-07/comparison.json \
  --artifact runs/qwen-exp-07/checkpoint \
  --parameter alpha=0.75 \
  --parameter direction_rank=2 \
  --parameter layers='[14,15,16,17]'
```

The tool hashes files in streaming chunks. Directory hashes bind a sorted list
of every relative file path, size, and SHA-256, so adding, removing, renaming,
or changing a shard changes the directory digest. Symlinks are rejected rather
than followed ambiguously.

The manifest records:

- immutable model revision and method parameters;
- SHA-256 and byte counts for config, inputs, and artifacts;
- repository commit, branch, and exact dirty entries;
- Python/platform and installed model-toolchain package versions;
- optional experiment notes.

Paths beneath `--root` are stored relative to that root so a run directory can
move with the repository. External paths remain absolute.

## Verify bytes later

```bash
python scripts/experiment-manifest.py verify runs/qwen-exp-07/manifest.json

# Also require the same repository commit and dirty-path list:
python scripts/experiment-manifest.py verify runs/qwen-exp-07/manifest.json --check-git
```

Verification returns exit 0 when all recorded bytes match, exit 1 on drift, and
exit 2 for invalid input or unsupported schema. Use it before evaluation,
conversion, upload, and release.

## Provenance boundaries

SHA-256 detects accidental or deliberate byte changes after the manifest was
created. It does **not** authenticate who created the manifest. For a published
release, sign the final manifest with the project's normal release-signing
mechanism and publish the signature separately.

Do not hash only the merged checkpoint while omitting the tokenizer, chat
template, generation config, adapter config, or shard index. Treat those as one
artifact directory or list them individually.

## Minimal experiment layout

```text
runs/<experiment-id>/
  config.toml
  contrast-manifest.json
  base-eval.jsonl
  candidate-eval.jsonl
  comparison.json
  checkpoint/
  manifest.json
```

Create the contrast split with [contrast-set-design.md](../methods/contrast-set-design.md),
compare paired outputs with [evaluation.md](evaluation.md), and verify the
manifest before following [toolchain-safetensors-gguf-lora.md](toolchain-safetensors-gguf-lora.md).
