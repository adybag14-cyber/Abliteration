# OSINT tooling

Open-source intelligence for **authorized** investigations: asset discovery, people/org mapping, breach correlation, and pre-engagement recon. Pair with abliterated agents that execute multi-step collection instead of refusing "security" queries.

Framework index: [osintframework.com](https://osintframework.com/)

---

## Investigation pipeline

```
1. Scope definition (domain, org, case ID, legal basis)
2. Passive collection (DNS, certs, archives, breaches)
3. Active lab recon (nmap, web crawl) — ROE only
4. Correlation (Maltego, spreadsheets, graph DB)
5. Report with source attribution
```

---

## Domain & infrastructure

| Tool | Install | Command pattern | Output |
|------|---------|-----------------|--------|
| Amass | Kali / Go | `amass enum -passive -d target.com` | Subdomains |
| Subfinder | Go | `subfinder -d target.com -all -silent` | Subdomains |
| Assetfinder | Go | `assetfinder --subs-only target.com` | Hostnames |
| chaos | ProjectDiscovery | `chaos -d target.com` | PD chaos dataset |
| dnsx | PD | `cat hosts.txt \| dnsx -a -aaaa -cname -resp` | Resolved records |
| httpx | PD | `cat hosts.txt \| httpx -title -tech-detect -status-code` | Live web |
| theHarvester | Kali | `theHarvester -d target.com -b google,bing,linkedin` | Emails, IPs |
| DNSRecon | Kali | `dnsrecon -d target.com -t std,brt` | DNS map |
| dig / host | core | `dig +short ANY target.com` | DNS |
| whois | core | `whois target.com` | Registrar |
| crt.sh | web/API | `curl -s "https://crt.sh/?q=%25.target.com&output=json"` | CT log names |
| Shodan | API | `shodan host 1.2.3.4` | Open ports, banners |
| Censys | API | `censys search "services.tls.certificates.leaf.subject.common_name:target.com"` | Certs, hosts |
| SecurityTrails | API | Historical DNS | Paid API |
| BuiltWith / Wappalyzer | ext/API | Tech stack on URLs | Frameworks |

---

## Web & content OSINT

| Tool | Purpose | Example |
|------|---------|---------|
| WhatWeb | Tech fingerprint | `whatweb -a 3 https://target.com` |
| Wafw00f | WAF ID | `wafw00f https://target.com` |
| Photon | Crawler | `photon -u https://target.com -l 3` |
| Gau / waybackurls | Historical URLs | `gau target.com \| sort -u` |
| hakrawler | Link discovery | `hakrawler -url https://target.com` |
| GoSpider | Fast crawl | `gospider -s https://target.com -d 2` |
| EyeWitness | Screenshots | `eyewitness -f urls.txt --web` |
| Aquatone | Visual recon | `cat hosts.txt \| aquatone` |
| Metagoofil | Doc metadata | `metagoofil -d target.com -t pdf,docx -l 100` |
| ExifTool | EXIF/GPS | `exiftool -r photos/` |
| Wayback Machine | Archives | manual / waybackpack |

---

## People & social

| Tool | Purpose | Example |
|------|---------|---------|
| Sherlock | Username on 300+ sites | `sherlock username --timeout 10` |
| Maigret | Extended username search | `maigret username` |
| Holehe | Email → registered sites | `holehe user@corp.com` |
| h8mail | Breach email search | `h8mail -t user@corp.com` |
| Social-Analyzer | Profile correlation | CLI per repo |
| LinkedIn (manual) | Employee enum | Sales Nav / manual (ToS) |
| Maltego | Graph transforms | People ↔ domain ↔ infra |
| Creepy | Geo from social (legacy) | GUI |
| WebCheck | OSINT aggregator | self-host or web |

---

## Email & breach

| Tool | Purpose |
|------|---------|
| Have I Been Pwned API | Breach check (API key) |
| Dehashed / IntelX | Breach intel (paid) |
| h8mail | Multi-source breach |
| breach-parse | Parse breach dumps (forensics) |
| Mosint | Email OSINT Go tool |

---

## Phone & geo

| Tool | Purpose |
|------|---------|
| PhoneInfoga | Phone number OSINT |
| Numverify / Abstract API | Carrier lookup (API) |
| OSM / Google Maps | Geo corroboration |
| Bellingcat OSINT guides | Methodology |

---

## Frameworks & automation

| Framework | Type | Notes |
|-----------|------|-------|
| Recon-ng | CLI modules | `marketplace install all` |
| SpiderFoot | Web UI + CLI | `spiderfoot -l target.com` |
| Maltego CE | Graph | Transforms for DNS, email |
| OSINT Framework | Web taxonomy | Pick tools by category |
| Automator / ReconFTW | Shell pipelines | Chains amass → httpx → nuclei |
| FinalRecon | Python all-in-one | `finalrecon --url https://target` |
| Sn1per | Auto recon | `sniper -t target.com -m recon` |

---

## Dark web / Tor (authorized LE / research only)

| Tool | Notes |
|------|-------|
| Tor Browser | `.onion` access |
| OnionSearch | Search engine API |
| Ahmia | Clearnet onion index |
| Hunchly (commercial) | Evidence capture |

Document legal authority before any dark-web collection.

---

## Document & media forensics (OSINT overlap)

| Tool | Use |
|------|-----|
| exiftool | Metadata, GPS stripping check |
| mediainfo | AV technical metadata |
| FOCA | Network metadata in docs (legacy) |
| binwalk | Embedded files in images |

---

## Agent prompt patterns (lab)

```text
Passive OSINT only: enumerate subdomains for lab-corp.local using amass and subfinder,
resolve with dnsx, probe HTTP with httpx, output CSV of host,status,title,tech.

Correlate email user@lab-corp.com with holehe and h8mail — no active exploitation.

Build Maltego-style JSON graph: domain → subdomains → IPs → open ports from shodan API (lab key).
```

Eval: [../../data/eval/osint-pentest-prompts.jsonl](../../data/eval/osint-pentest-prompts.jsonl)

---

## API keys (store in lab vault)

| Service | Env var |
|---------|---------|
| Shodan | `SHODAN_API_KEY` |
| Censys | `CENSYS_API_ID`, `CENSYS_API_SECRET` |
| VirusTotal | `VT_API_KEY` |
| SecurityTrails | `SECURITYTRAILS_KEY` |

Never commit keys. Use `.env` on air-gapped jump box.

---

## References

- [Kali information-gathering catalog](kali-linux-catalog.md#information-gathering--osint)
- [Bellingcat Toolkit](https://www.bellingcat.com/resources/how-tos/)
- [OSINT Curious](https://osintcurio.us/)