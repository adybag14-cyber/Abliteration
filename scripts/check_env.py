#!/usr/bin/env python3
"""Smoke-test environment before Heretic. Run: python scripts/check_env.py"""

import sys

print("Python:", sys.version.split()[0])

try:
    import torch

    print("PyTorch:", torch.__version__)
    print("CUDA available:", torch.cuda.is_available())
    if torch.cuda.is_available():
        print("GPU:", torch.cuda.get_device_name(0))
        props = torch.cuda.get_device_properties(0)
        print("VRAM GB:", round(props.total_memory / 1e9, 1))
except ImportError:
    print("PyTorch: NOT INSTALLED")
    print("  pip install torch --index-url https://download.pytorch.org/whl/cu124")

try:
    import bitsandbytes  # noqa: F401

    print("bitsandbytes: OK")
except ImportError:
    print("bitsandbytes: missing (needed for Heretic bnb_4bit)")
    print("  pip install bitsandbytes")

try:
    import accelerate  # noqa: F401

    print("accelerate: OK")
except ImportError:
    print("accelerate: missing — pip install accelerate")

try:
    import heretic  # noqa: F401

    print("heretic-llm: OK")
except ImportError:
    print("heretic-llm: missing — pip install -U heretic-llm")

print()
print("Next: instructions/beginner-local-model-guide.md")