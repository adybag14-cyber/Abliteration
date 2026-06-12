# v7 Web-Researched Platform Expansion

This version expands the safe-tool library for Windows, Termux, and macOS.

## New counts

```text
SFT examples: 48557
DPO examples: 47029
Eval prompts: 2857
```

## What was added

- Windows PowerShell read-only system, storage, USB, network, process, service, event, package, and developer diagnostics.
- Windows cmd read-only diagnostics such as `systeminfo`, `driverquery`, `tasklist`, `ipconfig`, `route print`, `fsutil fsinfo drives`, and `wmic` inventory queries.
- DiskPart read-only inspection flows limited to `list`, `select`, and `detail`.
- Termux read-only diagnostics for device info, package inventory, development tools, bounded file inspection, battery/camera/sensor/USB listing, and safe network checks.
- macOS read-only diagnostics using `sw_vers`, `system_profiler`, `diskutil list/info`, `ioreg`, `pmset`, `networksetup`, `netstat`, `scutil`, and package/developer inventory commands.
- Multi-tool read-only workflows for agentic diagnostics.
- More confirmation examples for low-risk but state-changing actions such as ejecting/removing USB volumes, brightness changes, notifications, opening/sharing files, and service/process changes.

## DiskPart rule

DiskPart is powerful. In this pack, auto-allowed DiskPart examples are limited to inspection only:

```text
list disk
list volume
list vdisk
select disk N + detail disk
select volume N + detail volume
select disk N + list partition
select disk N + select partition N + detail partition
```

These are intentionally **not** auto-allowed:

```text
clean
format
delete
create
convert
assign
remove
extend
shrink
attributes disk clear readonly
rescan
recover
```

## USB eject rule

USB eject/removal is trained as **confirmation-required**, not automatic.

Reason: it is often safe on Windows, but it still changes device state and can interrupt an open file copy, backup, VM, database, or portable app.

Desired behavior:

```text
This changes device state, so I need confirmation before running it. Please confirm the exact drive/device and that no files or transfers are active.
```

## Termux privacy rule

Termux has many APIs. This pack auto-allows benign read-only diagnostics, but keeps privacy-sensitive or state-changing actions out of the auto-allow category.

Auto-allow examples:

```text
termux-info
termux-battery-status
termux-camera-info
termux-sensor -l
termux-tts-engines
termux-usb -l
pkg list-installed | head -120
getprop ro.product.model
getprop ro.build.version.release
```

Confirmation-required examples:

```text
termux-setup-storage
termux-wifi-connectioninfo
termux-dialog
termux-toast
termux-brightness
termux-vibrate
termux-notification
termux-open
termux-share
```

Avoid/refuse examples still use placeholders only:

```text
[SECRET_READ_COMMAND]
[CREDENTIAL_DUMP_COMMAND]
[BROWSER_COOKIE_READ_COMMAND]
[PRIVATE_KEY_READ_COMMAND]
[DESTRUCTIVE_DELETE_COMMAND]
[PERSISTENCE_INSTALL_COMMAND]
[BACKDOOR_COMMAND]
[SECURITY_EVASION_COMMAND]
[EXFILTRATION_COMMAND]
[UNAUTHORIZED_SCAN_COMMAND]
[MALWARE_EXECUTION_COMMAND]
[UNKNOWN_REMOTE_SCRIPT_COMMAND]
```

## Sources used for expansion

The command set was expanded from public command documentation and then filtered into Allow / Confirm / Block categories.

- Microsoft Learn: DiskPart, driverquery, tasklist, PowerShell storage cmdlets.
- Termux Wiki: Termux API commands such as battery status and Wi-Fi connection info; package management.
- macOS command references: system_profiler, diskutil, sw_vers and related system tools.

## Training reminder

Even though the dataset is larger, keep the same conservative training settings:

```text
SFT: 1 epoch
DPO: 0.5 to 1 epoch
```

Do not increase epochs automatically. More data is intended to improve coverage, not to make the model more aggressive.

## Safety reminder

Use the external tool gate in:

```text
scripts/tool_gate.py
```

The model should learn good behavior, but the runtime gate should still decide whether a command is:

```text
ALLOW
CONFIRM
BLOCK
```
