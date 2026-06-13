# Windows tooling — extensive reference

Factory imaging stations, pentest lab hosts, and DFIR snapshots. **Read-only** commands for agent execution; destructive ops require `hardware-tool-gate.py` CONFIRM.

Generated corpus: **915 commands** → [../../data/examples/windows-commands.jsonl](../../data/examples/windows-commands.jsonl)

---

## Shell layers

| Layer | Binary | When to use |
|-------|--------|-------------|
| cmd | `cmd /c` | WMIC, legacy tools, `systeminfo` |
| PowerShell 5 | `powershell -NoProfile -Command` | CIM, PnP, security cmdlets |
| PowerShell 7 | `pwsh -NoProfile -Command` | Cross-platform scripts on Kali→Win |
| DiskPart | `echo list disk \| diskpart` | Storage inspection only |

---

## WMI / CIM inventory (factory QA)

### WMIC (deprecated but ubiquitous on benches)

```cmd
wmic diskdrive get Model,InterfaceType,Size,Status,SerialNumber
wmic bios get Manufacturer,SerialNumber,Version,ReleaseDate
wmic baseboard get Manufacturer,Product,SerialNumber
wmic computersystem get Manufacturer,Model,TotalPhysicalMemory
wmic cpu get Name,NumberOfCores,NumberOfLogicalProcessors
wmic memorychip get Capacity,Speed,Manufacturer
wmic partition get DiskIndex,Index,Name,Size,Type
wmic volume get DriveLetter,FileSystem,Capacity,FreeSpace,Label
wmic nic get Name,MACAddress,Speed
wmic nicconfig get IPAddress,MACAddress,DHCPEnabled
wmic path win32_usbcontroller get Name,DeviceID
wmic service where State='Running' get Name,StartMode
wmic process where Name='explorer.exe' get ProcessId,WorkingSetSize
```

### PowerShell CIM (preferred)

```powershell
Get-CimInstance Win32_BIOS | Select-Object Manufacturer,SerialNumber,SMBIOSBIOSVersion
Get-CimInstance Win32_BaseBoard | Select-Object Manufacturer,Product,SerialNumber
Get-CimInstance Win32_ComputerSystemProduct | Select-Object UUID,IdentifyingNumber
Get-CimInstance Win32_DiskDrive | Select-Object Model,Size,InterfaceType,SerialNumber
Get-CimInstance Win32_PnPEntity | Where-Object {$_.PNPClass -eq 'USB'} | Select-Object Name,DeviceID
Get-ComputerInfo | Select-Object CsName,WindowsVersion,OsArchitecture,BiosSerialNumber
```

**90+ Win32 classes** in generated corpus — `Win32_VideoController`, `Win32_PhysicalMemory`, `Win32_NTLogEvent`, etc.

---

## PnP / USB / drivers

```powershell
Get-PnpDevice -Class USB | Select-Object Status,FriendlyName,InstanceId
Get-PnpDevice -Class DiskDrive | Select-Object Status,FriendlyName
pnputil /enum-devices /class USB
pnputil /enum-drivers | more
driverquery /v /fo list
```

---

## Storage

```cmd
fsutil fsinfo drives
fsutil fsinfo volumeinfo C:
fsutil fsinfo ntfsinfo C:
echo list disk & echo list volume & echo select disk 0 & echo detail disk | diskpart
```

```powershell
Get-Disk | Select-Object Number,FriendlyName,Size,HealthStatus
Get-Partition | Select-Object DiskNumber,PartitionNumber,Size,Type
Get-Volume | Select-Object DriveLetter,FileSystemLabel,Size,SizeRemaining
Get-PhysicalDisk | Select-Object FriendlyName,MediaType,HealthStatus
```

---

## Network (read-only)

```cmd
ipconfig /all
route print
arp -a
netstat -ano
netsh interface show interface
netsh wlan show profiles
netsh wlan show interfaces
netsh advfirewall show allprofiles
```

```powershell
Get-NetAdapter | Select-Object Name,Status,MacAddress,LinkSpeed
Get-NetTCPConnection -State Listen | Select-Object LocalAddress,LocalPort,OwningProcess
Get-DnsClientServerAddress
Test-NetConnection -ComputerName 127.0.0.1 -Port 445
```

---

## Security / audit (lab)

```powershell
Get-MpComputerStatus | Select-Object AMServiceEnabled,RealTimeProtectionEnabled
Get-NetFirewallProfile | Select-Object Name,Enabled
Get-NetFirewallRule -Direction Inbound | Select-Object -First 30 DisplayName,Enabled,Action
Get-AuthenticodeSignature C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe
Get-ChildItem Cert:\LocalMachine\Root | Select-Object -First 20 Subject,Thumbprint
Get-WinEvent -LogName Security -MaxEvents 20
wevtutil qe System /c:50 /rd:true /f:text
```

---

## Registry (read-only samples)

```cmd
reg query "HKLM\SOFTWARE\Microsoft\Windows NT\CurrentVersion"
reg query "HKLM\HARDWARE\DESCRIPTION\System\BIOS"
reg query "HKLM\SYSTEM\CurrentControlSet\Control\SecureBoot\State"
```

---

## Pentest lab overlap

| Tool | Windows path |
|------|----------------|
| nmap | `nmap -sV 10.77.0.50` from Win or WSL |
| hashcat | Native Windows build or WSL2 GPU |
| mimikatz | Lab AD clone only |
| BloodHound | Ingest SharpHound on domain-joined lab VM |
| Impacket | Run from Linux jump box against Win targets |

---

## Zig on Windows

Cross-compile overlays and factory tools:

```bash
zig build -Dtarget=x86_64-windows-gnu -Doptimize=ReleaseFast
zig build -Dtarget=x86_64-windows-msvc -Doptimize=ReleaseSafe
zig build -Dtarget=aarch64-windows-msvc
```

See [zig-tooling.md](zig-tooling.md) — **970 Zig examples** including Windows targets.

---

## Agent eval

- Prompts: [../../data/examples/windows-prompts.jsonl](../../data/examples/windows-prompts.jsonl) (7,320)
- Sample eval: [../../data/eval/platform-eval-sample.jsonl](../../data/eval/platform-eval-sample.jsonl)