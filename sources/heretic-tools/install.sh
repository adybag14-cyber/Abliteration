#!/usr/bin/env bash
# Install Heretic for abliteration handbook workflows
# Upstream: https://github.com/p-e-w/heretic
set -euo pipefail

pip install --upgrade pip
pip install -U heretic-llm bitsandbytes accelerate huggingface_hub

echo ""
echo "Verify:"
heretic --help
python "$(dirname "$0")/../../scripts/check_env.py"
echo ""
echo "Config profiles in: $(dirname "$0")"
echo "  cp sources/heretic-tools/config.low-vram.toml config.toml   # 8 GB GPU"
echo "  cp sources/heretic-tools/config.production.toml config.toml # 12+ GB"