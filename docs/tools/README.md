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
| [windows-tooling.md](windows-tooling.md) | **915** WMIC/PowerShell/DiskPart examples |
| [macos-tooling.md](macos-tooling.md) | **607** system_profiler/ioreg/security examples |
| [zig-tooling.md](zig-tooling.md) | Cross-compile & build matrix |
| [zig-canonical-syntax.md](zig-canonical-syntax.md) | **0.17 syntax** — [adybag14-cyber/zig](https://github.com/adybag14-cyber/zig) `master` |
| [zig-advanced-techniques.md](zig-advanced-techniques.md) | **RE/exploit patterns** from canonical `test/behavior/*` |
| [abliteration-tooling.md](abliteration-tooling.md) | **Heretic, PEFT, SAE, RepE, GGUF, vLLM** — full ML stack; [agent + tool-calling picker](abliteration-tooling.md#agent--tool-calling-tool-picker-nous-huihui-obliteratus-supergemma) |
| [heretic-tools-reference.md](heretic-tools-reference.md) | **Pinned Heretic configs** + refresh scripts |
| [heretic-models-registry.md](heretic-models-registry.md) | **Open-weight HF** models tagged heretic/abliterated |
| [../toolchain-safetensors-gguf-lora.md](../toolchain-safetensors-gguf-lora.md) | **Safetensors → GGUF → LoRA** master toolchain (Jun 2026) |

## Generated example corpora

| File | Scale |
|------|-------|
| [../../data/examples/platform-commands-all.jsonl](../../data/examples/platform-commands-all.jsonl) | **2,492** commands |
| [../../data/examples/platform-prompts-all.jsonl](../../data/examples/platform-prompts-all.jsonl) | Agent prompts (regen for count) |
| [../../data/examples/zig-code-snippets.jsonl](../../data/examples/zig-code-snippets.jsonl) | **64** canonical Zig code snippets |
| Regenerate | `python scripts/generate-platform-examples.py` |

## Hardware overlap

Factory bench commands (WMIC, DiskPart, USB, firmware hash): [../hardware-command-catalog.md](../hardware-command-catalog.md)

## Eval & Ralph npm scripts

| Command | Script | Purpose |
|---------|--------|---------|
| `npm run eval:stats` | `scripts/count-eval-prompts.mjs` | Line counts for all `data/eval/*.jsonl` and `data/examples/*.jsonl` |
| `npm run eval:jarvis-safe` | `scripts/filter-jarvis-eval.py` | Export / refresh `data/eval/jarvis-safe-eval.jsonl` |
| `npm run eval:cybergym` | `scripts/cybergym-eval-stub.py` | CyberGym eval flow (`--print-flow`) and subset generator |
| `npm run ralph:regress` | `scripts/ralph-regress.mjs` | Pre-commit gate: validate + ralph-ci + eval scripts + py_compile |

Full eval matrices: [../evaluation.md](../evaluation.md) · Deploy workflow: [../../instructions/eval-driven-workflow.md](../../instructions/eval-driven-workflow.md)

## Eval corpora

| File | Focus |
|------|-------|
| [../../data/eval/cyber-research-prompts.jsonl](../../data/eval/cyber-research-prompts.jsonl) | Pentest / malware lab |
| [../../data/eval/osint-pentest-prompts.jsonl](../../data/eval/osint-pentest-prompts.jsonl) | OSINT, hashcat, Kali tooling |
| [../../data/eval/hardware-factory-prompts.jsonl](../../data/eval/hardware-factory-prompts.jsonl) | Factory acceptance |
| [../../data/eval/platform-eval-sample.jsonl](../../data/eval/platform-eval-sample.jsonl) | Windows/macOS/Zig sample (120) |
| [../../data/eval/zig-security-prompts.jsonl](../../data/eval/zig-security-prompts.jsonl) | Zig 0.17 PoC / RE / fuzz (79) |
| [../../data/eval/xstest-overrefusal-sample.jsonl](../../data/eval/xstest-overrefusal-sample.jsonl) | Over-refusal check (15) |
| [../../data/eval/factory-good-prompts.jsonl](../../data/eval/factory-good-prompts.jsonl) | Factory good pairs (20) |
| [../../data/eval/cybergym-subset-sample.jsonl](../../data/eval/cybergym-subset-sample.jsonl) | CyberGym local proxy (8) |
| [../../data/eval/jarvis-safe-eval.jsonl](../../data/eval/jarvis-safe-eval.jsonl) | Jarvis safe tool prompts (2,509) |

## Abliteration research docs

| Doc | Covers |
|-----|--------|
| [../research-landscape.md](../research-landscape.md) | Papers, method taxonomy, decision tree |
| [../advanced-techniques-catalog.md](../advanced-techniques-catalog.md) | Heretic params, projection math, module map |
| [../../instructions/advanced-abliteration-workflow.md](../../instructions/advanced-abliteration-workflow.md) | Production / RDO / MoE tracks |
| [../../techniques/README.md](../../techniques/README.md) | 17 technique entries |

## Agent stack reminder

Heretic abliteration → optional Jarvis DPO → **runtime gate** on destructive/out-of-scope commands → tool execution. See [../../instructions/agentic-security-stack.md](../../instructions/agentic-security-stack.md).