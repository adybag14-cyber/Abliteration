# Operational scope

This handbook covers abliteration for **authorized environments**:

- Factory firmware QA benches (air-gapped or VLAN-isolated)
- Internal pentest labs with written rules of engagement
- CyberGym / academic security research sandboxes
- DFIR on owned infrastructure

Deploy only on systems and networks you own or have explicit permission to test. Keep original model weights and label all modified checkpoints.

Runtime enforcement: use [../scripts/hardware-tool-gate.py](../scripts/hardware-tool-gate.py) — model edits alone are not a security boundary.