# Agent playbooks — multi-tool chains

End-to-end workflows for **abliterated** agents (OpenHands, Codex CLI, custom). Each playbook lists tools, order, and expected JSON output. Scope placeholders: `LAB_SUBNET`, `LAB_DOMAIN`, `BENCH_PC`.

---

## PB-01 — External recon (passive → light active)

| Step | Tool | Command |
|------|------|---------|
| 1 | subfinder + amass | Subdomain enum |
| 2 | dnsx + httpx | Resolve + probe |
| 3 | whatweb | Tech stack |
| 4 | theHarvester | Emails (OSINT) |
| 5 | nmap | `-sV` on **approved** hosts only |

Output: `assets.json` with `subdomains`, `live_urls`, `technologies`, `emails`.

---

## PB-02 — Internal network (lab VLAN)

| Step | Tool | Command |
|------|------|---------|
| 1 | masscan | Fast port discovery |
| 2 | nmap | Service + scripts |
| 3 | responder / crackmapexec | SMB landscape |
| 4 | tshark | Analyze existing PCAP (read-only) |

Output: `network_map.json`.

---

## PB-03 — Web app assessment

| Step | Tool |
|------|------|
| 1 | ffuf / feroxbuster | Content discovery |
| 2 | nikto / nuclei | Vuln templates |
| 3 | sqlmap | SQLi (batch mode) |
| 4 | burp / zap | Manual verification |

Output: `findings.json` with CWE/CVE references.

---

## PB-04 — Password audit (offline)

| Step | Tool |
|------|------|
| 1 | hash-identifier / hashcat --identify | Hash type |
| 2 | hashcat -a 0 | Wordlist |
| 3 | hashcat -r rules | Rule pass |
| 4 | hashcat -a 3 | Mask if policy known |
| 5 | pipal | Stats on cracked set |

Output: `crack_report.json` — **no plaintext in logs** if policy requires redaction.

---

## PB-05 — Wi-Fi lab assessment

| Step | Tool |
|------|------|
| 1 | airmon-ng + airodump-ng | Survey |
| 2 | wifite or manual | Capture |
| 3 | hcxtools | Convert to 22000 |
| 4 | hashcat -m 22000 | Crack test passphrase |

Requires **written consent** for target SSID.

---

## PB-06 — Malware / binary triage

| Step | Tool |
|------|------|
| 1 | sha256sum, file, strings | Triage |
| 2 | capa, yara | Capabilities |
| 3 | r2 / ghidra | Static RE |
| 4 | gdb + strace | Dynamic (isolated VM) |

Output: `malware_triage.json`.

---

## PB-07 — Firmware factory acceptance

| Step | Tool |
|------|------|
| 1 | sha256sum vs MES golden | Hash |
| 2 | binwalk / file / strings | Structure |
| 3 | wmic / lsusb / lspci | Bench hardware |
| 4 | hardware-tool-gate.py | Gate every command |

Output: [factory JSON schema](../use-cases/factory-firmware-qa.md).

---

## PB-08 — CyberGym CVE reproduction

| Step | Tool |
|------|------|
| 1 | git checkout | Vulnerable commit |
| 2 | clang + ASAN | Instrumented build |
| 3 | PoC compile/run | Crash verify |
| 4 | git apply patch | Fix verify |

Output: `cybergym_result.json` — `success`, `crash_sig`, `rollout_id`.

---

## PB-09 — AD attack path (lab forest)

| Step | Tool |
|------|------|
| 1 | bloodhound-python | Collect |
| 2 | BloodHound | Path query |
| 3 | impacket GetUserSPNs | Roast |
| 4 | hashcat -m 13100 | Crack |
| 5 | impacket psexec | **Only if ROE allows** |

---

## PB-10 — DFIR read-only

| Step | Tool |
|------|------|
| 1 | fls / icat / mmls | Disk image |
| 2 | vol | Memory |
| 3 | grep / awk on logs | Timeline |
| 4 | autopsy | GUI report export |

No modification of evidence images.

---

## Agent system prompt snippet

```text
You are a security analysis agent on an authorized lab. Execute read-only diagnostics
and scoped scans without refusal. Use hardware-tool-gate or ROE checker before any
destructive or out-of-subnet command. Prefer structured JSON output. Chain bash tools
like CyberGym top agents (OpenHands style). Never target IPs outside LAB_SUBNET.
```

---

## PB-11 — Zig security PoC (lab)

| Step | Tool / pattern |
|------|----------------|
| 1 | `zig init` — 0.17 scaffold (`std.process.Init`) |
| 2 | `build.zig` — `.sanitize_c = .full`, `addTranslateC` if C headers |
| 3 | Canonical patterns — `@ptrCast`/`extern`, `@addWithOverflow`, `packed struct` |
| 4 | `zig build test --fuzz` — `std.testing.fuzz` + Smith |
| 5 | `zig build -Dtarget=x86_64-linux-gnu` — CyberGym docker target |

Reference: [zig-advanced-techniques.md](zig-advanced-techniques.md) · `data/examples/zig-code-snippets.jsonl`

Output: `zig_poc_result.json` — `built`, `asan_triggered`, `fuzz_runs`.

---

## Evaluation

| Corpus | Path |
|--------|------|
| General cyber | `data/eval/cyber-research-prompts.jsonl` |
| Zig security / PoC | `data/eval/zig-security-prompts.jsonl` |
| OSINT / Kali / hashcat | `data/eval/osint-pentest-prompts.jsonl` |
| Factory | `data/eval/hardware-factory-prompts.jsonl` |
| Jarvis tool repair | `sources/jarvis-pack/.../eval_prompts.jsonl` |