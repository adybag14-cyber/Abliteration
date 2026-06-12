# Factory hardware & firmware QA

Use abliterated agent models on the **factory floor** to validate new hardware SKUs without the model refusing legitimate diagnostic commands.

## Problem

Aligned models often refuse:

- `wmic`, `diskpart list`, `dmidecode`, firmware `hexdump`
- USB enumeration on test jigs
- Driver manifest comparison scripts
- "Run these commands on the bench PC" multi-step workflows

These are **not** attacks — they are acceptance testing. Abliteration + optional Jarvis tool-repair fixes false refusals while keeping a runtime gate.

## Stack

```
┌─────────────────────────────────────────┐
│  MES / golden-master firmware hashes    │
└─────────────────┬───────────────────────┘
                  ▼
┌─────────────────────────────────────────┐
│  Abliterated LLM (Heretic output)       │
│  + optional Jarvis SFT/DPO adapter        │
└─────────────────┬───────────────────────┘
                  ▼
┌─────────────────────────────────────────┐
│  hardware-tool-gate.py (ALLOW/CONFIRM)    │
└─────────────────┬───────────────────────┘
                  ▼
┌─────────────────────────────────────────┐
│  Bench PC / imaging station (isolated)    │
└─────────────────────────────────────────┘
```

## Acceptance test checklist

| Step | Command family | Pass criterion |
|------|----------------|----------------|
| Identity | SMBIOS / Win32_BaseBoard / `dmidecode` | Serial matches work order |
| USB tree | `lsusb`, PnP USB, `termux-usb -l` | Expected VID/PID present |
| Storage | `wmic diskdrive`, `lsblk`, DiskPart list | Capacity & interface match SKU |
| BIOS/firmware | Win32_BIOS version, `sha256sum` vs MES | Hash match golden image |
| GPU/compute | `nvidia-smi`, `lspci` | Model & driver in allow-list |
| Network (bench) | `ip link`, `ss -tuln` on localhost | Expected services only |

## Firmware-specific checks

```bash
# Golden master compare
sha256sum /bench/incoming/fw_v2.3.1.bin
cmp -l golden/fw_v2.3.1.bin /bench/incoming/fw_v2.3.1.bin | head

# Header / CPU arch probe
file /bench/incoming/fw_v2.3.1.bin
strings /bench/incoming/fw_v2.3.1.bin | grep -iE 'version|build|copyright' | head -20
```

## Model prep

1. Abliterate instruct model: [../../instructions/heretic-workflow.md](../../instructions/heretic-workflow.md)
2. Eval on [../../data/eval/hardware-factory-prompts.jsonl](../../data/eval/hardware-factory-prompts.jsonl)
3. Optional: Jarvis DPO for tool-call formatting — [../../instructions/agentic-security-stack.md](../../instructions/agentic-security-stack.md)

## Output format

Require JSON from the agent:

```json
{
  "sku": "FACTORY-BOARD-X12",
  "serials": { "board": "...", "bios": "..." },
  "firmware_sha256": "...",
  "firmware_match": true,
  "usb_devices_ok": true,
  "blockers": []
}
```