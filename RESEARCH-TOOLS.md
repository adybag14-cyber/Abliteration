# Selective research toolkit 1.2.0

This toolkit includes the pinned MiniCPM5-1B experiment, selective checkpoint
writer, numerical operators, aggregate evidence, and research references. Model
weights are downloaded separately at an immutable revision; none are bundled.

```bash
python -m venv .venv
# Linux/macOS: source .venv/bin/activate
# Windows PowerShell: .venv\Scripts\Activate.ps1
python -m pip install -r requirements-research.txt
python scripts/test-selective-tools.py
python scripts/download-research-model.py --output models/minicpm5-1b
python scripts/run-research-experiment.py --model models/minicpm5-1b \
  --output runs/my-study --methods global-projection,selective-projection,norm-preserving,selective-sft
```

Start with [the measured walkthrough](docs/minicpm5-selective-study.md) and
[the selection guide](docs/selective-methods-2026.md). The online
[complete handbook](https://github.com/adybag14-cyber/Abliteration) includes the
older methods and all surrounding chapters. Links to chapters not bundled here
can be opened in that repository.

The included runtime pins match the measured run. For CUDA, install the
appropriate official PyTorch wheel for the machine first, retaining the pinned
Torch version, then install the remaining requirements. The example was run in
WSL2 on an RTX 4090; other backends are not performance-certified by that result.
Use a new output directory for every run. Calibration, training, and test splits
are disjoint. Read the limitations before interpreting refusal-marker counts.

`PACKAGE-MANIFEST.json` records the source commit and hashes for every bundled
file. Verify the release archive with `SHA256SUMS` and its GitHub attestation.
