# Install Heretic for abliteration handbook workflows (Windows PowerShell)
# Upstream: https://github.com/p-e-w/heretic

$ErrorActionPreference = "Stop"

Write-Host "Installing heretic-llm + deps (PyPI)..."
python -m pip install --upgrade pip
python -m pip install -U heretic-llm bitsandbytes accelerate huggingface_hub

Write-Host ""
Write-Host "Verify:"
heretic --help
python "$PSScriptRoot\..\..\scripts\check_env.py"
Write-Host ""
Write-Host "Config profiles in: $PSScriptRoot"
Write-Host "  config.low-vram.toml     -> copy to config.toml (8 GB GPU)"
Write-Host "  config.production.toml   -> copy to config.toml (12+ GB)"
Write-Host "  config.default.toml      -> upstream pin (refresh: node scripts/fetch-heretic-tools.mjs)"