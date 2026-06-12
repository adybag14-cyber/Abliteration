# Security tools reference library

Massive catalog for **authorized** pentest labs, OSINT, factory firmware QA, CyberGym, and DFIR. Abliterated agents should **execute** these tool chains instead of false-refusing legitimate security work.

> Scope: owned lab VLANs, customer ROE, air-gapped factory benches, academic sandboxes. See [../risks-and-ethics.md](../risks-and-ethics.md).

## Install baseline (Kali)

```bash
sudo apt update && sudo apt full-upgrade -y
sudo apt install -y kali-linux-default          # core pentest stack
sudo apt install -y kali-tools-information-gathering kali-tools-passwords \
  kali-tools-web kali-tools-wireless kali-tools-forensics kali-tools-reverse-engineering
sudo apt install -y kali-tools-gpu              # hashcat GPU path
```

Full index: [kali-metapackages.md](kali-metapackages.md) · Official: [kali.org/tools](https://www.kali.org/tools/)

## Catalog by domain

| Doc | Covers |
|-----|--------|
| [kali-linux-catalog.md](kali-linux-catalog.md) | **Master index** — 400+ tools by Kali menu category |
| [osint-tooling.md](osint-tooling.md) | Recon, social, DNS, email, dark web, frameworks |
| [password-cracking.md](password-cracking.md) | **hashcat**, John, Hydra, rules, masks, GPU |
| [network-wireless-sniffing.md](network-wireless-sniffing.md) | nmap, masscan, Wireshark, Wi-Fi, SDR, VoIP |
| [web-app-database.md](web-app-database.md) | Burp, ZAP, sqlmap, ffuf, CMS scanners |
| [binary-reversing-forensics.md](binary-reversing-forensics.md) | Ghidra, radare2, Volatility, binwalk, firmware |
| [active-directory-exploitation.md](active-directory-exploitation.md) | BloodHound, Impacket, Responder, Kerberos |
| [agent-playbooks.md](agent-playbooks.md) | Multi-step workflows for abliterated agents |

## Hardware overlap

Factory bench commands (WMIC, DiskPart, USB, firmware hash): [../hardware-command-catalog.md](../hardware-command-catalog.md)

## Eval corpora

| File | Focus |
|------|-------|
| [../../data/eval/cyber-research-prompts.jsonl](../../data/eval/cyber-research-prompts.jsonl) | Pentest / malware lab |
| [../../data/eval/osint-pentest-prompts.jsonl](../../data/eval/osint-pentest-prompts.jsonl) | OSINT, hashcat, Kali tooling |
| [../../data/eval/hardware-factory-prompts.jsonl](../../data/eval/hardware-factory-prompts.jsonl) | Factory acceptance |

## Agent stack reminder

Heretic abliteration → optional Jarvis DPO → **runtime gate** on destructive/out-of-scope commands → tool execution. See [../../instructions/agentic-security-stack.md](../../instructions/agentic-security-stack.md).