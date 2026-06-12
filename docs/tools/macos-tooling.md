# macOS tooling — extensive reference

R&D benches, Apple Silicon factory QA, and authorized DFIR on owned Macs. **607 generated commands** → [../../data/examples/macos-commands.jsonl](../../data/examples/macos-commands.jsonl)

---

## System identity

```bash
sw_vers
uname -a
hostname
system_profiler SPHardwareDataType
system_profiler SPHardwareDataType -detailLevel mini
sysctl -n machdep.cpu.brand_string
sysctl hw.memsize hw.ncpu
ioreg -l | grep board-id
nvram -p | head -40
```

---

## system_profiler types (full factory set)

| Type | Data |
|------|------|
| `SPHardwareDataType` | Model, chip, serial, memory |
| `SPMemoryDataType` | RAM slots, speed |
| `SPUSBDataType` | USB tree |
| `SPThunderboltDataType` | TB devices |
| `SPNVMeDataType` | SSD details |
| `SPStorageDataType` | Volumes |
| `SPNetworkDataType` | Interfaces |
| `SPAirPortDataType` | Wi-Fi hardware |
| `SPBluetoothDataType` | BT controllers |
| `SPDisplaysDataType` | Monitors / GPU |
| `SPAudioDataType` | Audio devices |
| `SPPCIDataType` | PCIe |
| `SPPowerDataType` | Battery / PMU |
| `SPInstallHistoryDataType` | Install log |
| `SPApplicationsDataType` | Installed apps |
| `SPDeveloperToolsDataType` | Xcode / CLT |

JSON export: `system_profiler -json SPHardwareDataType`

**32 SP types × 3 output modes** in generated corpus.

---

## IORegistry / USB

```bash
ioreg -p IOUSB -l -w 0 | head -160
ioreg -p IOPower -l -w 0 | head -100
ioreg -p IOACPIPlane -l -w 0 | head -80
ioreg -l | grep -iE 'usb|product|vendor|serial' | head -50
```

---

## Storage / APFS

```bash
diskutil list
diskutil info disk0
diskutil info startup-disk
diskutil apfs list
diskutil apfs listUsers
diskutil cs list
```

---

## Network

```bash
networksetup -listallhardwareports
networksetup -getinfo Wi-Fi
networksetup -getinfo Ethernet
ifconfig -a
netstat -rn
netstat -an | head -80
scutil --dns
scutil --nc list
airport -I
lsof -i -P | head -50
```

---

## Security / integrity

```bash
csrutil status
spctl --status
fdesetup status
codesign -dv --verbose=4 /usr/bin/python3
codesign --verify --verbose /usr/bin/ssh
security list-keychains
security dump-trust-settings
systemextensionsctl list
profiles list
```

---

## Binary analysis (malware lab / firmware)

```bash
otool -L /usr/bin/ssh
otool -hv /usr/bin/ssh
nm -gU /usr/bin/ssh | head -50
lipo -info /usr/bin/ssh
vtool -show-build /usr/bin/ssh
file /usr/bin/ssh
strings /usr/bin/ssh | head -40
```

---

## Logs & diagnostics

```bash
log show --predicate 'eventMessage CONTAINS "error"' --last 5m --style compact | head -30
log show --predicate 'process == "kernel"' --last 15m | head -40
pmset -g batt
pmset -g therm
launchctl list | head -60
```

**13 log predicates × 4 time windows** in corpus.

---

## Packages & dev tools

```bash
pkgutil --pkgs | head -80
xcode-select -p
xcrun --show-sdk-path
mdfind 'kMDItemKind == Application' | head -30
dscl . -list /Users
```

---

## sysctl keys

Generated corpus includes **30+ keys**: `kern.boottime`, `hw.model`, `machdep.cpu.brand_string`, `vm.swapusage`, etc.

---

## Zig on macOS

```bash
zig build -Dtarget=aarch64-macos -Doptimize=ReleaseSafe
zig build -Dtarget=x86_64-macos -Doptimize=ReleaseFast
zig build -Dtarget=native
```

Universal / cross: see [zig-tooling.md](zig-tooling.md).

---

## Agent eval

- Prompts: [../../data/examples/macos-prompts.jsonl](../../data/examples/macos-prompts.jsonl) (3,642)
- Hardware overlap: [../hardware-command-catalog.md](../hardware-command-catalog.md#macos--bench--rd)