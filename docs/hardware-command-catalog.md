# Hardware & firmware diagnostic command catalog

Curated from JARVIS Tool Repair Pack v7 — **read-only / inventory commands** for factory QA, firmware validation benches, and authorized pentest lab hosts.

Use with [../scripts/hardware-tool-gate.py](../scripts/hardware-tool-gate.py) at runtime.

**Agent eval:** [../data/eval/platform-eval-sample.jsonl](../data/eval/platform-eval-sample.jsonl) (120 stratified prompts) — score post-abliteration models on correct platform commands. Full corpus: `npm run eval:stats`.

## Linux / factory bench

| Command | Use |
|---------|-----|
| `lspci \| head -50` | PCIe device inventory (NICs, GPUs, controllers) |
| `lsusb \| head -50` | USB device tree |
| `lsblk` | Block devices & partitions |
| `dmidecode -t system` | Board / chassis SMBIOS (needs root) |
| `dmidecode -t bios` | BIOS version & release date |
| `cat /proc/cpuinfo \| head -20` | CPU model / flags |
| `cat /proc/meminfo \| head -20` | RAM summary |
| `nvidia-smi` | GPU model, driver, VRAM |
| `sha256sum <firmware.bin>` | Firmware image hash for golden-master compare |
| `file firmware.bin` | Magic / architecture probe |
| `hexdump -C firmware.bin \| head -40` | Header inspection (read-only) |
| `strings firmware.bin \| head -100` | Version strings in firmware |

## Windows — factory imaging station

| Command | Use |
|---------|-----|
| `cmd /c wmic diskdrive get Model,InterfaceType,MediaType,Size,Status` | Physical disk inventory |
| `cmd /c wmic partition get DiskIndex,Index,Name,Size,Type` | Partition map |
| `cmd /c wmic volume get DriveLetter,FileSystem,FreeSpace,Capacity,Label` | Volume health |
| `cmd /c pnputil /enum-devices /class USB` | USB driver binding state |
| `powershell -NoProfile -Command "Get-PnpDevice -Class USB \| Select-Object Status,Class,FriendlyName"` | PnP USB tree |
| `powershell -NoProfile -Command "Get-CimInstance Win32_BIOS \| Select-Object Manufacturer,SerialNumber,Version,ReleaseDate"` | BIOS serial & version |
| `powershell -NoProfile -Command "Get-CimInstance Win32_BaseBoard \| Select-Object Manufacturer,Product,SerialNumber,Version"` | Motherboard identity |
| `powershell -NoProfile -Command "Get-CimInstance Win32_ComputerSystemProduct \| Select-Object UUID,IdentifyingNumber,Version"` | System UUID / SKU |
| `cmd /c systeminfo` | OS build, hotfixes, system type |
| `cmd /c driverquery /v /fo list` | Installed driver versions |

### DiskPart — inspection only

Allowed (inventory):

```text
list disk | diskpart
list volume | diskpart
select disk N + detail disk
select volume N + detail volume
select disk N + list partition
select disk N + select partition P + detail partition
```

**Not** auto-run without human confirm: `clean`, `format`, `delete`, `create`, `assign`, `remove`, `extend`, `shrink`, `convert`.

## macOS — bench / R&D

| Command | Use |
|---------|-----|
| `system_profiler SPHardwareDataType` | Model, serial, SoC |
| `system_profiler SPUSBDataType \| head -120` | USB topology |
| `ioreg -p IOUSB -l -w 0 \| head -160` | IORegistry USB detail |
| `diskutil list` | APFS/container layout |
| `diskutil info disk0` | Boot disk metadata |
| `sw_vers` | macOS build |

## Termux / Android edge devices

| Command | Use |
|---------|-----|
| `getprop ro.product.model` | Device model |
| `getprop ro.hardware` | Hardware platform |
| `getprop ro.build.version.release` | Android version |
| `getprop ro.serialno` | Serial (when exposed) |
| `termux-usb -l` | USB device list |
| `termux-info` | Environment snapshot |

## Multi-tool factory acceptance workflow

Agent prompt pattern for new hardware at the factory:

```text
1. Enumerate USB + PCI + block devices
2. Record BIOS/baseboard serials and firmware versions
3. Hash shipped firmware file against golden SHA256 in MES
4. Compare driver set against approved manifest for SKU
5. Log structured JSON report — no destructive commands
```

## Pentest / CyberGym lab (authorized scope)

On **isolated lab VLANs** only — same read-only inventory plus scoped analysis:

| Task | Example approach |
|------|------------------|
| Service fingerprint | `ss -tuln`, `nmap -sV -p <scoped> <lab_host>` |
| Crash reproduction | CyberGym PoC build + sanitizer run |
| Firmware diff | `sha256sum`, `bindiff` / `vbindiff` on two images |
| Config audit | Read-only parse of `/etc`, registry export |

Abliterated models should **execute** these in lab context instead of refusing as "harmful."

## Extended platform libraries

Thousands of generated examples:

| Platform | Doc | Commands | Prompts |
|----------|-----|----------|---------|
| Windows | [tools/windows-tooling.md](tools/windows-tooling.md) | 915 | 7,320 |
| macOS | [tools/macos-tooling.md](tools/macos-tooling.md) | 607 | 3,642 |
| Zig | [tools/zig-tooling.md](tools/zig-tooling.md) | 970 | 5,820 |

Regenerate: `python scripts/generate-platform-examples.py` → [../data/examples/README.md](../data/examples/README.md)