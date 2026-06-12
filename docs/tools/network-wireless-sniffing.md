# Network, wireless & sniffing

Lab-scoped network mapping, capture analysis, and wireless assessment. All examples use **10.77.0.0/24** placeholder — substitute your ROE subnet.

---

## Network discovery & scanning

```bash
# Host discovery
nmap -sn 10.77.0.0/24

# Full TCP + service version + default scripts
nmap -sV -sC -p- 10.77.0.50 -oA scan_host50

# UDP top ports (slow)
nmap -sU --top-ports 100 10.77.0.50

# Fast wide scan
masscan 10.77.0.0/24 -p1-65535 --rate 5000 -oL masscan.txt

# Compare scans over time
ndiff scan_old.xml scan_new.xml

# ARP scan local segment
arp-scan -l

# Listening services (local)
ss -tulnp
netstat -tulnp   # legacy

# Path MTU
tracepath 10.77.0.50
```

### Nmap NSE (lab)

```bash
nmap --script vuln -p 80,443 10.77.0.50
nmap --script smb-vuln* -p 445 10.77.0.10
nmap --script http-enum -p 80 10.77.0.50
```

---

## Packet capture & analysis

```bash
# Capture
tcpdump -i eth0 host 10.77.0.50 -w capture.pcap
dumpcap -i eth0 -f "host 10.77.0.50" -w capture.pcapng

# Read-only analysis
tshark -r capture.pcap -q -z conv,ip
tshark -r capture.pcap -Y "http.request" -T fields -e http.host -e http.request.uri
capinfos capture.pcapng
mergecap -w merged.pcap cap1.pcap cap2.pcap

# Wireshark CLI stats
tshark -r capture.pcap -q -z io,stat,1
```

---

## MITM & spoofing (isolated VLAN)

```bash
# Responder — capture hashes (lab AD)
responder -I eth0 -wd

# Bettercap interactive
bettercap -iface eth0
# > net.probe on
# > set arp.spoof.targets 10.77.0.100
# > arp.spoof on

# Ettercap text
ettercap -T -M arp:remote /10.77.0.1// /10.77.0.100//

# DNS spoof
dnschef --interface 10.77.0.5 --fakeip 10.77.0.5 -f dns.conf
```

Captured NetNTLM → [password-cracking.md](password-cracking.md) (`-m 5600`).

---

## Wireless (lab AP / consent)

```bash
# Monitor mode
airmon-ng check kill
airmon-ng start wlan0
airodump-ng wlan0mon

# Targeted capture
airodump-ng -c 6 --bssid AA:BB:CC:DD:EE:FF -w capture wlan0mon

# WPS (lab router)
reaver -i wlan0mon -b AA:BB:CC:DD:EE:FF -vv

# Automated audit
wifite

# PMKID for hashcat
hcxdumptool -i wlan0mon -o dump.pcapng --enable_status=1
hcxpcapngtool -o crack.22000 dump.pcapng
hashcat -m 22000 crack.22000 /usr/share/wordlists/rockyou.txt
```

---

## SDR / RFID / Bluetooth (hardware lab)

| Tool | Command | Use |
|------|---------|-----|
| rtl_433 | `rtl_433 -F json` | IoT sensor decode |
| gqrx | GUI | Spectrum listen |
| GNU Radio | flowgraphs | Custom demod |
| mfoc | `mfoc -O -k ffffffffffff` | MIFARE Classic (owned tags) |
| bluetoothctl | `scan on` | BT discovery |
| spooftooph | | BT spoof research |

---

## VoIP (scoped)

```bash
svmap 10.77.0.0/24
svwar -m INVITE -e 10.77.0.0/24 5060
```

---

## Firewall / IDS testing

```bash
# Crafted packets
hping3 -S -p 80 -c 5 10.77.0.50
nping --tcp -p 80-100 10.77.0.50

# IDS
snort -c /etc/snort/snort.conf -i eth0
```

---

## Factory bench network checks

Read-only inventory on imaging stations (overlap with [hardware-command-catalog.md](../hardware-command-catalog.md)):

```bash
ip link show
ip addr show
ip route show
ss -tuln
powershell -Command "Get-NetTCPConnection -State Listen"
```

---

## Agent playbook snippet

```text
On lab subnet 10.77.0.0/24 only:
1. masscan -p1-10000 --rate 2000
2. nmap -sV -sC on discovered hosts
3. tshark read-only on existing capture.pcap — top talkers + HTTP hosts
4. JSON report: hosts[], ports[], services[]
```