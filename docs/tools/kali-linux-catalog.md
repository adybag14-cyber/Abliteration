# Kali Linux master tool catalog

Organized by [Kali menu metapackages](https://www.kali.org/docs/general-use/metapackages/). **600+** packages exist; this lists the tools security agents most often need. Official search: [kali.org/tools/all-tools](https://www.kali.org/tools/all-tools/).

---

## Information gathering / OSINT

| Tool | Command | Purpose | Lab example |
|------|---------|---------|-------------|
| Nmap | `nmap` | Port scan, service detect, scripts | `nmap -sV -sC -p- 10.77.0.50` |
| Masscan | `masscan` | Fast Internet-scale port scan | `masscan 10.77.0.0/24 -p1-65535 --rate 1000` |
| Amass | `amass` | Subdomain enum / attack surface | `amass enum -d lab-corp.local -active` |
| Subfinder | `subfinder` | Passive subdomain discovery | `subfinder -d example.com -silent` |
| Assetfinder | `assetfinder` | Subdomain from APIs | `assetfinder --subs-only lab.local` |
| theHarvester | `theHarvester` | Email, hosts, URLs from OSINT | `theHarvester -d lab.local -b all` |
| Recon-ng | `recon-ng` | Modular OSINT framework | `recon-ng` → `marketplace install all` |
| Maltego | `maltego` | Graph link analysis (GUI) | Transform domain → entities |
| SpiderFoot | `spiderfoot` | Automated OSINT scanner | `spiderfoot -l lab.local -m sfp_*` |
| Sherlock | `sherlock` | Username search across sites | `sherlock targetuser` |
| Holehe | `holehe` | Email registered on sites | `holehe user@lab.local` |
| h8mail | `h8mail` | Breach email OSINT | `h8mail -t user@lab.local` |
| WhatWeb | `whatweb` | Web tech fingerprint | `whatweb -a 3 https://lab-app.local/` |
| Wafw00f | `wafw00f` | WAF detection | `wafw00f https://lab-app.local/` |
| DNSenum | `dnsenum` | DNS recon | `dnsenum lab.local` |
| DNSRecon | `dnsrecon` | DNS brute / zone transfer test | `dnsrecon -d lab.local -t axfr` |
| Fierce | `fierce` | DNS recon | `fierce -dns lab.local` |
| Whois | `whois` | Registrar / netblock | `whois lab.local` |
| Dig | `dig` | DNS queries | `dig +short axfr @ns1.lab.local lab.local` |
| EyeWitness | `eyewitness` | Screenshot web hosts | `eyewitness -f urls.txt --web` |
| Photon | `photon` | Web crawler / URL harvest | `photon -u https://lab-app.local/` |
| Gau | `gau` | URLs from AlienVault/Wayback | `gau lab-app.local` |
| Hakrawler | `hakrawler` | Fast web endpoint discovery | `hakrawler -url https://lab-app.local/` |
| Shodan CLI | `shodan` | Internet-wide device search | `shodan search 'org:"Lab Corp"'` |
| Censys CLI | `censys` | Certificate / host search | `censys search lab.local` |
| Metagoofil | `metagoofil` | Metadata from public docs | `metagoofil -d lab.local -t pdf` |
| ExifTool | `exiftool` | File metadata | `exiftool image.jpg` |
| Social-Analyzer | `social-analyzer` | Social profile correlation | CLI / API per install |
| Creepy | `creepy` | Geolocation OSINT (legacy) | GUI geodata maps |
| OSINT Framework | — | Web index | [osintframework.com](https://osintframework.com/) |

---

## Vulnerability analysis

| Tool | Command | Purpose | Lab example |
|------|---------|---------|-------------|
| Nikto | `nikto` | Web server vuln scan | `nikto -h https://lab-app.local/` |
| OpenVAS / GVM | `gvm-*` | Network vuln scanner | `gvm-start` → web UI |
| Legion | `legion` | Semi-auto recon + scan GUI | Spawns nmap, nikto, etc. |
| Nuclei | `nuclei` | Template-based vuln scan | `nuclei -u https://lab-app.local/ -t cves/` |
| Nessus | `nessus` | Commercial scanner (if licensed) | Scoped subnet import |
| Lynis | `lynis` | Host hardening audit | `lynis audit system` |
| Unix-privesc-check | `unix-privesc-check` | Local privesc vectors | `unix-privesc-check standard` |
| Windows Exploit Suggester | `windows-exploit-suggester.py` | Missing patches vs KB list | Offline on systeminfo output |

---

## Web application

| Tool | Command | Purpose | Lab example |
|------|---------|---------|-------------|
| Burp Suite | `burpsuite` | Proxy, scanner, repeater | Intercept lab-app.local |
| OWASP ZAP | `zaproxy` | Open-source web proxy/scanner | `zap.sh -daemon -quickurl ...` |
| sqlmap | `sqlmap` | SQL injection automation | `sqlmap -u 'http://lab/sql?id=1' --batch` |
| WPScan | `wpscan` | WordPress vuln scan | `wpscan --url https://lab-wp.local/` |
| ffuf | `ffuf` | Fast web fuzzer | `ffuf -u https://lab/FUZZ -w dirs.txt` |
| Gobuster | `gobuster` | Dir/DNS/vhost brute | `gobuster dir -u https://lab/ -w big.txt` |
| Feroxbuster | `feroxbuster` | Recursive content discovery | `feroxbuster -u https://lab/` |
| Dirb | `dirb` | Classic directory brute | `dirb https://lab-app.local/` |
| DirBuster | `dirbuster` | GUI dir brute | Wordlist + threads |
| wfuzz | `wfuzz` | Web fuzzing framework | `wfuzz -c -z file,words.txt https://lab/FUZZ` |
| Commix | `commix` | Command injection | `commix -u 'http://lab/cmd?c=1'` |
| XSSer | `xsser` | XSS automation | `xsser -u 'http://lab/search?q=X'` |
| Joomscan | `joomscan` | Joomla scanner | `joomscan -u https://lab-joomla/` |
| Davtest | `davtest` | WebDAV method test | `davtest -url https://lab/` |
| Skipfish | `skipfish` | Active web recon | `skipfish -o out https://lab/` |
| Arjun | `arjun` | HTTP parameter discovery | `arjun -u https://lab/api` |
| ParamSpider | `paramspider` | Parameter mining from archives | `paramspider -d lab-app.local` |
| JWT Tool | `jwt_tool` | JWT analysis / attacks | `jwt_tool TOKEN -C -d wordlist.txt` |
| mitmproxy | `mitmproxy` | Interactive TLS MITM | `mitmproxy --mode reverse:https://lab` |
| BeEF | `beef-xss` | Browser exploitation framework | Hook lab browser only |

---

## Database assessment

| Tool | Command | Purpose | Lab example |
|------|---------|---------|-------------|
| sqlmap | `sqlmap` | SQLi (MySQL, PG, MSSQL, Oracle) | See web section |
| jsql-injection | `jsql` | Java SQLi GUI | Point at lab DB app |
| oscanner | `oscanner` | Oracle SID / password audit | `oscanner -s 10.77.0.20` |
| tnscmd10g | `tnscmd` | Oracle TNS listener | `tnscmd10g version -h 10.77.0.20` |
| odat | `odat` | Oracle database attack toolkit | `odat all -s 10.77.0.20` |
| mdb-tools | `mdb-export` | Access DB read (forensics) | `mdb-tables file.mdb` |

---

## Password attacks

| Tool | Command | Purpose | Lab example |
|------|---------|---------|-------------|
| **hashcat** | `hashcat` | GPU offline cracking | See [password-cracking.md](password-cracking.md) |
| John the Ripper | `john` | CPU/GPU cracking | `john --wordlist=rockyou.txt hashes.txt` |
| Hydra | `hydra` | Online protocol brute | `hydra -l admin -P pass.txt ssh://10.77.0.50` |
| Medusa | `medusa` | Parallel login brute | `medusa -h 10.77.0.50 -u admin -P pass.txt -M ssh` |
| Ncrack | `ncrack` | Network auth cracking | `ncrack -p 22 --user root -P pass.txt 10.77.0.50` |
| CeWL | `cewl` | Custom wordlist from site | `cewl -d 2 -m 5 https://lab-app.local/ -w cewl.txt` |
| Crunch | `crunch` | Pattern wordlist gen | `crunch 8 8 -t lab@@@@ -o wl.txt` |
| Pipal | `pipal` | Password stats / rules insight | `pipal cracked.txt` |
| Hash-identifier | `hash-identifier` | Guess hash type | Paste hash interactively |
| fcrackzip | `fcrackzip` | ZIP password crack | `fcrackzip -u -D -p rockyou.txt file.zip` |
| pdfcrack | `pdfcrack` | PDF password | `pdfcrack -f locked.pdf` |
| patator | `patator` | Multi-protocol brute | `patator ssh_login host=10.77.0.50 user=admin password=FILE0` |
| crowbar | `crowbar` | RDP/VNC/OpenVPN brute | `crowbar -b rdp -s 10.77.0.50/32 -u admin -C pass.txt` |

---

## Wireless attacks

| Tool | Command | Purpose | Lab example |
|------|---------|---------|-------------|
| aircrack-ng suite | `aircrack-ng`, `airodump-ng`, `aireplay-ng` | Wi-Fi capture / crack | Lab AP only — legal consent |
| airmon-ng | `airmon-ng` | Monitor mode | `airmon-ng start wlan0` |
| wifite | `wifite` | Automated Wi-Fi audit | `wifite --kill` |
| Kismet | `kismet` | Wireless IDS / survey | `kismet -c wlan0` |
| Reaver | `reaver` | WPS PIN attack | Lab WPS router |
| Bully | `bully` | WPS brute | `bully wlan0mon` |
| mdk4 | `mdk4` | Wi-Fi stress (lab only) | Deauth test AP |
| Fluxion | `fluxion` | Evil twin / captive portal | **Lab SSID only** |
| Bettercap | `bettercap` | Wi-Fi/BLE/MITM framework | `bettercap -iface wlan0` |
| hcxdumptool | `hcxdumptool` | PMKID capture | Convert for hashcat mode 22000 |
| hcxtools | `hcxpcapngtool` | Convert captures → hashcat | `hcxpcapngtool -o hash.22000 capture.pcapng` |
| WiFi Pumpkin | `wifipumpkin3` | Rogue AP framework | Isolated lab |
| Eaphammer | `eaphammer` | 802.1X attack lab | Enterprise Wi-Fi lab |

---

## Sniffing & spoofing

| Tool | Command | Purpose | Lab example |
|------|---------|---------|-------------|
| Wireshark | `wireshark`, `tshark` | PCAP analysis | `tshark -r cap.pcap -Y http` |
| tcpdump | `tcpdump` | CLI capture | `tcpdump -i eth0 -w cap.pcap host 10.77.0.50` |
| Ettercap | `ettercap` | ARP MITM | Lab LAN segment only |
| Responder | `responder` | LLMNR/NBT-NS poison | `responder -I eth0 -wd` |
| mitmproxy | `mitmproxy` | HTTP(S) proxy | Reverse to lab app |
| arpspoof | `arpspoof` | ARP redirect | `arpspoof -i eth0 -t victim gateway` |
| dnschef | `dnschef` | DNS proxy spoof | Point lab clients to chef |
| sslstrip | `sslstrip` | HTTPS downgrade (legacy) | With MITM on lab |
| Bettercap | `bettercap` | Modern MITM | `net.probe on; set arp.spoof.targets 10.77.0.5` |
| Scapy | `scapy` | Packet crafting (Python) | Interactive / scripts |
| hping3 | `hping3` | Crafted ICMP/TCP/UDP | `hping3 -S -p 80 10.77.0.50` |
| netsniff-ng | `netsniff-ng` | High-perf capture | `netsniff-ng -i eth0` |

---

## Exploitation tools

| Tool | Command | Purpose | Lab example |
|------|---------|---------|-------------|
| Metasploit | `msfconsole`, `msfvenom` | Exploit framework | `msfconsole` → `use exploit/...` |
| SearchSploit | `searchsploit` | Exploit-DB local search | `searchsploit openssl 1.0.1` |
| Exploit-DB | — | Public exploits | [exploit-db.com](https://www.exploit-db.com/) |
| Armitage | `armitage` | MSF GUI | Team server on lab |
| RouterSploit | `rsf.py` | Router/IoT exploits | `use scanners/autopwn` |
| Commix | `commix` | Web command injection | Lab web shell path |
| Linux Exploit Suggester | `linux-exploit-suggester.sh` | Kernel privesc hints | On lab VM snapshot |
| pwntools | Python lib | CTF / exploit dev | `from pwn import *` |
| ropper | `ropper` | ROP gadget finder | `ropper -f binary --search "pop rdi"` |
| one_gadget | `one_gadget` | libc one-shot RCE | `one_gadget libc.so.6` |

---

## Post exploitation

| Tool | Command | Purpose | Lab example |
|------|---------|---------|-------------|
| PowerSploit | modules | PowerShell post-ex | Import on lab DC clone |
| Evil-WinRM | `evil-winrm` | WinRM shell | `evil-winrm -i 10.77.0.10 -u admin -p pass` |
| Chisel | `chisel` | TCP/UDP tunnel | Pivot in lab range |
| Ligolo-ng | `ligolo-ng` | Tunnel / pivot | Agent on lab host |
| Proxychains | `proxychains4` | Force traffic via proxy | `proxychains4 nmap ...` |
| weevely | `weevely` | PHP web shell client | `weevely generate pass shell.php` |
| LaZagne | `lazagne` | Local cred recovery | On owned lab snapshot |
| mimikatz | `mimikatz` | Windows cred extraction | **Lab AD only** |
| BloodHound | `bloodhound` | AD attack paths | Ingest SharpHound JSON |
| CrackMapExec | `crackmapexec` | SMB/WinRM spray | `crackmapexec smb 10.77.0.0/24 -u u -p p` |
| Impacket | `impacket-*` | AD/SMB protocols | See [active-directory-exploitation.md](active-directory-exploitation.md) |

---

## Forensics

| Tool | Command | Purpose | Lab example |
|------|---------|---------|-------------|
| Autopsy | `autopsy` | GUI digital forensics | Add lab disk image |
| Sleuth Kit | `fls`, `icat`, `mmls` | Disk / FS analysis | `mmls disk.img` |
| Volatility 3 | `vol` | Memory forensics | `vol -f mem.raw windows.pslist` |
| binwalk | `binwalk` | Firmware / embedded extract | `binwalk -e firmware.bin` |
| foremost | `foremost` | File carving | `foremost -i disk.img -o out/` |
| scalpel | `scalpel` | Carving | `scalpel -c scalpel.conf -o out disk.img` |
| Guymager | `guymager` | Disk imaging | Write-blocked bench |
| dc3dd | `dc3dd` | Forensic dd | Hash-verified imaging |
| bulk_extractor | `bulk_extractor` | Bulk media features | `bulk_extractor -o out disk.img` |
| regripper | `rip.pl` | Registry analysis | `rip.pl -r SYSTEM -p compname` |
| chkrootkit | `chkrootkit` | Rootkit check | `chkrootkit` |
| rkhunter | `rkhunter` | Rootkit hunter | `rkhunter --check` |
| testdisk | `testdisk` | Partition / file recovery | Read-only on image |
| photorec | `photorec` | File recovery | Carve from image |
| exiftool | `exiftool` | Metadata | Timeline building |
| pdftools / peepdf | `peepdf` | Malicious PDF | `peepdf -f malicious.pdf` |
| oletools | `olevba` | Office macro analysis | `olevba suspicious.docm` |
| capa | `capa` | Malware capability ID | `capa -v sample.exe` |

---

## Reverse engineering

| Tool | Command | Purpose | Lab example |
|------|---------|---------|-------------|
| Ghidra | `ghidra` | NSA RE suite | Import lab malware sample |
| radare2 | `r2` | CLI RE framework | `r2 -A suspicious.bin` |
| Cutter | `cutter` | radare2 GUI | Graph / decompile |
| GDB | `gdb` | Debugger | `gdb -q ./vuln` |
| GDB-PEDA / GEF / pwndbg | — | GDB enhancements | Exploit dev on lab binary |
| objdump | `objdump` | Disassembly | `objdump -d -M intel vuln` |
| readelf | `readelf` | ELF headers | `readelf -a binary` |
| strings | `strings` | Extract strings | `strings -n 8 firmware.bin` |
| ltrace / strace | `ltrace`, `strace` | Library / syscall trace | `strace ./binary` |
| ldd | `ldd` | Shared libs | `ldd ./binary` |
| UPX | `upx` | Pack/unpack | `upx -d packed` |
| apktool | `apktool` | Android APK | `apktool d app.apk` |
| jadx | `jadx` | Android decompiler | `jadx -d out app.apk` |
| dnspy / ilspy | — | .NET (mono tools on Linux) | `monodis assembly.exe` |
| YARA | `yara` | Pattern matching | `yara rules.yar sample/` |
| DIE | `die` | Detect packer/compiler | GUI / `diec` |
| unicorn | Python | CPU emulation | PoC emulation |
| angr | Python | Symbolic execution | CTF / vuln research |
| Binary Ninja | `binaryninja` | Commercial RE (if installed) | — |
| IDA Free | `ida` | Disassembler (limited) | — |

---

## Social engineering

| Tool | Command | Purpose | Lab example |
|------|---------|---------|-------------|
| SET | `setoolkit` | Social Engineer Toolkit | Phishing clone **lab domain** |
| BeEF | `beef-xss` | Browser hook | Lab browsers only |
| Gophish | `gophish` | Phishing campaign manager | Internal training |
| King Phisher | `king_phisher` | Campaign server | Scoped recipients |
| Evilginx2 | `evilginx` | AiTM phishing | **Authorized red team lab** |

---

## Reporting

| Tool | Command | Purpose |
|------|---------|---------|
| Dradis | `dradis` | Collaborative reporting |
| Faraday | `faraday` | Pentest IDE / report |
| Pipal | `pipal` | Password analysis stats |
| Magictree | `magictree` | Data aggregation |
| KeepNote | `keepnote` | Note taking (legacy) |

---

## Hardware / radio / factory crossover

| Tool | Command | Purpose |
|------|---------|---------|
| flashrom | `flashrom` | SPI flash read/write (bench) |
| openocd | `openocd` | JTAG debug |
| Bus Pirate | `screen /dev/ttyUSB0` | UART/SPI/I2C |
| minicom | `minicom` | Serial console |
| screen | `screen` | Serial session |
| rtl_433 | `rtl_433` | SDR decode |
| GNU Radio | `gnuradio-companion` | SDR flows |
| gqrx | `gqrx` | SDR receiver |
| mfoc / mfcuk | `mfoc` | MIFARE Classic |
| spooftooph | `spooftooph` | Bluetooth spoof (lab) |

Factory WMIC/DiskPart/USB: [../hardware-command-catalog.md](../hardware-command-catalog.md)

---

## AI / agent helpers (2026 Kali additions)

| Tool | Command | Purpose |
|------|---------|---------|
| gemini-cli | `gemini` | CLI LLM (Kali package) |
| OpenHands | external | Agent framework for CyberGym |
| Custom abliterated endpoint | vLLM/Ollama | Local security agent backbone |

---

## Quick lookup by binary name

```bash
apt search kali-tools | wc -l          # metapackage-related
ls /usr/share/kali-menu/               # menu structure
dpkg -L kali-tools-web | grep bin      # binaries in a metapackage
```

See also: [osint-tooling.md](osint-tooling.md) · [password-cracking.md](password-cracking.md) · [agent-playbooks.md](agent-playbooks.md)