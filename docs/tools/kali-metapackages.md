# Kali Linux metapackages

Kali groups **600+ tools** into [metapackages](https://www.kali.org/docs/general-use/metapackages/) — install only what your lab needs.

## System images

| Metapackage | Contents |
|-------------|----------|
| `kali-linux-core` | Base system (always present) |
| `kali-linux-headless` | No GUI — servers, CI agents, Docker |
| `kali-linux-default` | Default desktop tool set |
| `kali-linux-large` | Previous “full” default |
| `kali-linux-everything` | All metapackages (~large disk) |
| `kali-linux-arm` | ARM-suitable tools |
| `kali-linux-nethunter` | Mobile / NetHunter |

```bash
sudo apt install -y kali-linux-default
sudo apt install -y kali-linux-everything   # full lab only
```

## Tool metapackages (menu-aligned)

| Metapackage | Domain | Key tools |
|-------------|--------|-----------|
| `kali-tools-information-gathering` | OSINT / recon | nmap, amass, theHarvester, maltego, recon-ng |
| `kali-tools-vulnerability` | Vuln scan | nikto, legion, openvas helpers |
| `kali-tools-web` | Web app | burpsuite, zaproxy, sqlmap, wpscan, ffuf |
| `kali-tools-database` | DB attacks | sqlmap, oscanner, jsql-injection |
| `kali-tools-passwords` | Cracking | **hashcat**, john, hydra, cewl, crunch |
| `kali-tools-wireless` | 802.11/BT/RFID | aircrack-ng, wifite, kismet, bettercap |
| `kali-tools-sniffing-spoofing` | MITM / sniff | wireshark, ettercap, responder, mitmproxy |
| `kali-tools-exploitation` | Exploits | metasploit-framework, searchsploit |
| `kali-tools-social-engineering` | Phishing / SE | setoolkit, beef-xss |
| `kali-tools-post-exploitation` | Post-ex | powersploit, weevely |
| `kali-tools-forensics` | DFIR | autopsy, volatility, binwalk, sleuthkit |
| `kali-tools-reverse-engineering` | RE | ghidra, radare2, gdb, binwalk |
| `kali-tools-reporting` | Reports | dradis, faraday, pipal |

## Specialty metapackages

| Metapackage | Domain |
|-------------|--------|
| `kali-tools-gpu` | hashcat, pyrit — needs NVIDIA drivers |
| `kali-tools-hardware` | Bus Pirate, flashrom, openocd |
| `kali-tools-crypto-stego` | steghide, outguess, fcrackzip |
| `kali-tools-fuzzing` | wfuzz, spiped, radamsa |
| `kali-tools-802-11` | Full Wi-Fi stack |
| `kali-tools-bluetooth` | bluez, spooftooph |
| `kali-tools-rfid` | mfoc, mfcuk, libnfc |
| `kali-tools-sdr` | gnuradio, gqrx, rtl_433 |
| `kali-tools-voip` | sipvicious, voiphopper |
| `kali-tools-windows-resources` | mimikatz, powershell empire helpers |
| `kali-linux-labs` | Practice environments |

## GPU setup (hashcat)

```bash
sudo apt install -y kali-tools-gpu
# NVIDIA on Kali: https://www.kali.org/docs/general-use/install-nvidia-drivers-on-kali-linux/
hashcat -I                    # list backends
hashcat -b -m 1000            # benchmark NTLM
```

## GUI tool picker

```bash
kali-tweaks   # Metapackages tab → select groups → Apply
```

## Refresh tool docs

```bash
node scripts/fetch-docs.mjs   # pulls hashcat README, Kali pages
```

Master tool list: [kali-linux-catalog.md](kali-linux-catalog.md)