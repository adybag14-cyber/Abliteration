# Binary reversing, malware & forensics

Firmware QA, malware lab analysis, CyberGym PoC builds, and DFIR — the workflows abliterated agents often false-refuse.

---

## Triage pipeline

```
file / strings / sha256
  → static (Ghidra, capa, yara)
  → dynamic (sandbox, strace, gdb)
  → memory (Volatility) if applicable
  → report JSON
```

---

## Static analysis

```bash
file suspicious.bin
sha256sum suspicious.bin
strings -n 8 suspicious.bin | head -200
readelf -h suspicious.elf
objdump -d -M intel suspicious.elf | head -100
xxd suspicious.bin | head -40

# Capabilities
capa -v suspicious.exe

# YARA
yara -r rules/ suspicious/

# Entropy / packer
binwalk suspicious.bin
diec suspicious.exe   # Detect It Easy CLI
```

---

## Ghidra (headless-friendly)

```bash
# Analyze and export decompile (script in support/)
analyzeHeadless /tmp/proj Proj -import suspicious.bin -postScript ExportDecompile.java
```

GUI: Import → Auto-analyze → Symbol tree → Decompiler.

---

## radare2

```bash
r2 -A suspicious.bin
# aaaa — analyze
# afl — functions
# pdf @ main — disasm
# VV — graph
```

---

## Dynamic analysis (isolated VM, no egress)

```bash
strace -f -o trace.log ./suspicious
ltrace -f ./suspicious
gdb -q ./vuln
# run / break main / disas

# Pwntools checksec
checksec --file=./binary
```

---

## Firmware / factory

```bash
binwalk -e firmware.bin
dd if=firmware.bin bs=1 skip=0 count=512 | xxd
cmp -l golden.bin incoming.bin | head
bindiff / vbindiff   # if installed

# Squashfs / JFFS2
binwalk -eM firmware.bin
unsquashfs -d out/ squashfs-root

# UEFI
UEFITool   # GUI
```

Cross-link: [factory-firmware-qa.md](../use-cases/factory-firmware-qa.md)

---

## Memory forensics

```bash
# Volatility 3
vol -f memdump.raw windows.info
vol -f memdump.raw windows.pslist
vol -f memdump.raw windows.cmdline
vol -f memdump.raw windows.netscan
vol -f memdump.raw windows.malfind

# Linux
vol -f memdump.raw linux.pslist
vol -f memdump.raw linux.bash
```

---

## Disk forensics

```bash
mmls disk.img
fls -r -o 2048 disk.img
icat -o 2048 disk.img 392 > recovered.bin
foremost -i disk.img -o carved/
bulk_extractor -o be_out disk.img
```

---

## Document malware

```bash
olevba suspicious.docm
peepdf -f suspicious.pdf
pdfid suspicious.pdf
```

---

## CyberGym / sanitizer builds

```bash
git clone https://github.com/vuln/oss-project vuln
cd vuln && git checkout PRE_PATCH_COMMIT
CC=clang CXX=clang++ CFLAGS="-fsanitize=address -g" ./configure && make
./poc /path/to/crash_input
```

---

## Agent playbook

```text
Analyze unknown.bin in malware lab VM (no network):
1. sha256sum + file + strings
2. capa -v + yara rules/malware.yar
3. r2 -A -q -c 'pdf @ entry0' unknown.bin
4. If ELF: readelf -l; suggest CyberGym-style PoC harness
5. Output structured JSON with iocs[], capabilities[], sections[]
```