# Password cracking — hashcat & ecosystem

Deep reference for **offline** hash recovery (hashcat, John) and **online** login testing (Hydra) in authorized labs — e.g. recovered AD dumps, firmware password hashes, CTF, credential audit.

Official: [hashcat.net](https://hashcat.net/hashcat/) · Wiki: [hashcat.net/wiki](https://hashcat.net/wiki/) · GitHub: [github.com/hashcat/hashcat](https://github.com/hashcat/hashcat)

Current stable: **7.0.0** (2025+). Kali: `apt install hashcat hashcat-data`.

---

## hashcat attack modes (`-a`)

| Mode | Name | Use |
|------|------|-----|
| 0 | Straight | Wordlist |
| 1 | Combination | word1 + word2 |
| 3 | Brute-force | Mask `?l?l?l?d?d?d?d` |
| 6 | Hybrid wordlist + mask | `word?d?d?d` |
| 7 | Hybrid mask + wordlist | `?d?d?dword` |
| 9 | Association | Per-hash wordlist (file:hash) |
| 10–13 | Deprecated hybrids | Legacy |
| 14 | Rule-based | Wordlist + rules (replaces -j/-k in modern) |

---

## Mask charset

| Token | Charset |
|-------|---------|
| `?l` | `a-z` |
| `?u` | `A-Z` |
| `?d` | `0-9` |
| `?h` | Hex lowercase |
| `?H` | Hex uppercase |
| `?s` | Special ` !"#$%...` |
| `?a` | All printable |
| `?b` | `0x00-0xff` |
| `?1-?8` | Custom (`-1 ?l?d`) |

---

## Common hash modes (`-m`)

| -m | Algorithm | Typical source |
|----|-----------|----------------|
| 0 | MD5 raw | Web apps, CTF |
| 100 | SHA1 | Legacy |
| 1000 | NTLM | Windows AD / SAM |
| 1400 | SHA2-256 | Various |
| 1700 | SHA2-512 | Various |
| 1800 | sha512crypt | Linux `/etc/shadow` |
| 3200 | bcrypt | Web apps |
| 5500 | NetNTLMv1 | SMB capture |
| 5600 | NetNTLMv2 | Responder / SMB |
| 13100 | Kerberos 5 TGS-REP | Kerberoasting |
| 18200 | Kerberos 5 AS-REP | AS-REP roast |
| 22000 | WPA-PBKDF2-PMKID+EAPOL | Wi-Fi (hcxtools convert) |
| 3000 | LM | Legacy Windows |
| 10800 | sha384 | — |
| 11300 | Bitcoin/Litecoin wallet | — |
| 13400 | KeePass 1 | — |
| 29700 | KeePass 4 | — |
| 34000 | Argon2id | Modern KDF |

Identify unknown: `hashcat --identify hash.txt`

Full list: `hashcat -hh` or [hashcat.net/wiki/doku.php?id=hashcat](https://hashcat.net/wiki/doku.php?id=hashcat)

---

## Essential commands

```bash
# Backends (CUDA/OpenCL/Metal)
hashcat -I

# Benchmark NTLM on all GPUs
hashcat -b -m 1000

# Wordlist attack
hashcat -m 1000 -a 0 hashes.txt /usr/share/wordlists/rockyou.txt

# Rules (best64)
hashcat -m 1000 -a 0 hashes.txt rockyou.txt -r /usr/share/hashcat/rules/best64.rule

# Mask brute (8 lower + 2 digit)
hashcat -m 1000 -a 3 hashes.txt '?l?l?l?l?l?l?d?d'

# Show cracked
hashcat -m 1000 hashes.txt --show

# Resume session
hashcat --session lab_ntlm -m 1000 -a 0 hashes.txt rockyou.txt
hashcat --restore --session lab_ntlm

# WPA PMKID (after hcxtools)
hcxpcapngtool -o capture.22000 wlan.pcapng
hashcat -m 22000 capture.22000 rockyou.txt

# Distributed brain server (multi-GPU rack)
hashcat --brain-server
hashcat -z --brain-client --brain-host 10.77.0.5 -m 1000 hashes.txt rockyou.txt
```

---

## Workload tuning

| Flag | Effect |
|------|--------|
| `-w 1` | Low GPU utilization (desktop use) |
| `-w 3` | High performance |
| `-w 4` | Nightmare — max power |
| `-O` | Optimized kernels (shorter max password) |
| `--hwmon-temp-abort=85` | Thermal safety |

Factory QA / rack: use `-w 3` or `-w 4` on dedicated cracking station (RTX 4090 class).

---

## hashcat-utils & companions

| Tool | Repo | Purpose |
|------|------|---------|
| hashcat-utils | [hashcat/hashcat-utils](https://github.com/hashcat/hashcat-utils) | `combinator`, `cutb`, `len` |
| princeprocessor | [hashcat/princeprocessor](https://github.com/hashcat/princeprocessor) | PRINCE wordlist gen |
| maskprocessor | [hashcat/maskprocessor](https://github.com/hashcat/maskprocessor) | Mask wordlist gen |
| kwprocessor | keyboard walks | `kwprocessor` |
| statsprocessor | Markov | `statsprocessor` |

```bash
# Combinator attack prep
combinator wordlist1.txt wordlist2.txt > combined.txt
hashcat -m 1000 -a 1 hashes.txt wordlist1.txt wordlist2.txt
```

---

## John the Ripper

```bash
# Auto-detect format
john hashes.txt

# Explicit format
john --format=nt hashes.txt --wordlist=rockyou.txt

# Show cracked
john --show hashes.txt

# Rules
john --wordlist=rockyou.txt --rules=Jumbo hashes.txt
```

Formats: `john --list=formats | grep -i ntlm`

---

## Online cracking (lab targets only)

```bash
# SSH
hydra -l admin -P pass.txt ssh://10.77.0.50 -t 4

# RDP
hydra -l administrator -P pass.txt rdp://10.77.0.10

# SMB
hydra -L users.txt -P pass.txt smb://10.77.0.0/24

# HTTP POST form
hydra -l admin -P pass.txt 10.77.0.50 http-post-form "/login:user=^USER^&pass=^PASS^:F=invalid"

# Medusa parallel
medusa -h 10.77.0.50 -U users.txt -P pass.txt -M ssh -t 10
```

**ROE required** for any online attempt. Prefer offline hashcat when hashes are available.

---

## Wordlist generation

```bash
# Crawl site vocabulary
cewl -d 3 -m 6 https://lab-app.local/ -w cewl.txt

# Crunch pattern
crunch 10 10 -t Lab@@@@@@ -o lab_patterns.txt

# Extract from rockyou for rules testing
head -n 100000 /usr/share/wordlists/rockyou.txt > rockyou_100k.txt
```

Kali wordlists: `/usr/share/wordlists/`, `/usr/share/seclists/`

---

## Firmware / factory crossover

| Scenario | Approach |
|----------|----------|
| BIOS setup password hash | Vendor-specific; often custom `-m` or John |
| ZIP firmware package | `fcrackzip` or hashcat `-m 17200` etc. |
| PDF test report lock | `pdfcrack` / hashcat PDF modes |
| Embedded `/etc/shadow` from UART dump | `hashcat -m 1800` or `-m 500` md5crypt |

Always image firmware before crack attempts on bench hardware.

---

## Agent workflows

```text
1. Identify hash type: hash-identifier or hashcat --identify
2. Select -m and attack: wordlist → rules → mask
3. Run hashcat -w 3 --session CASE001 ...
4. Output --show results to JSON for MES ticket
```

```json
{
  "hash_type": "NTLM",
  "mode": 1000,
  "cracked": 3,
  "total": 10,
  "method": "rockyou + best64.rule"
}
```

---

## Eval prompts

See [../../data/eval/osint-pentest-prompts.jsonl](../../data/eval/osint-pentest-prompts.jsonl) — hashcat / hydra / john tasks.

---

## Fetched upstream

Regenerate: `node scripts/fetch-docs.mjs` → `sources/fetched/hashcat-readme.txt`