# Safe Tool Catalog for Jarvis Repair v3

This expanded pack is safe-heavy. It teaches benign read-only agent actions while preserving confirmation and refusal behavior.

Important: environment-variable dumping was intentionally excluded because environment variables can contain secrets.

## Auto-allow candidates

- `uname -a`
- `whoami`
- `pwd`
- `ls`
- `ls -la`
- `find . -maxdepth 2 -type f | head -100`
- `find . -maxdepth 2 -type d | head -100`
- `find . -maxdepth 3 -name "*.py" | head -100`
- `find . -maxdepth 3 -name "*.js" -o -name "*.ts" | head -100`
- `find . -maxdepth 3 -name "*.md" | head -100`
- `find . -maxdepth 3 -name "requirements*.txt" -o -name "pyproject.toml" -o -name "package.json" | head -100`
- `find . -maxdepth 2 -type f -size +50M | head -50`
- `find . -maxdepth 3 -type f -name "*.log" | head -50`
- `df -h`
- `du -sh .`
- `du -h --max-depth=1 . | sort -h | tail -20`
- `free -h`
- `lscpu`
- `nproc`
- `uptime`
- `date`
- `nvidia-smi`
- `python --version`
- `python -c "import sys; print(sys.executable)"`
- `python -c "import sys; print(sys.version)"`
- `pip --version`
- `pip list --format=columns | head -80`
- `python -m pip list --format=columns | head -80`
- `node --version`
- `npm --version`
- `npm list --depth=0`
- `git status --short`
- `git branch --show-current`
- `git log --oneline -5`
- `git diff --stat`
- `git rev-parse --show-toplevel`
- `git ls-files | head -100`
- `grep -RIn "TODO" . --exclude-dir=.git | head -50`
- `grep -RIn "FIXME" . --exclude-dir=.git | head -50`
- `grep -RIn "def " . --include="*.py" --exclude-dir=.git | head -50`
- `grep -RIn "class " . --include="*.py" --exclude-dir=.git | head -50`
- `grep -RIn "import " . --include="*.py" --exclude-dir=.git | head -50`
- `grep -RIn "function " . --include="*.js" --include="*.ts" --exclude-dir=.git | head -50`
- `wc -l README.md`
- `head -80 README.md`
- `tail -80 README.md`
- `head -100 requirements.txt`
- `head -120 pyproject.toml`
- `head -120 package.json`
- `stat README.md`
- `file README.md`
- `sha256sum README.md`
- `ps -eo pid,comm,%cpu,%mem --sort=-%cpu | head -20`
- `ps -eo pid,comm,%mem --sort=-%mem | head -20`
- `ip addr show`
- `ip route show`
- `ss -tuln`
- `docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Image}}'`
- `docker images --format 'table {{.Repository}}\t{{.Tag}}\t{{.Size}}' | head -50`
- `docker version --format '{{.Server.Version}}'`
- `rustc --version`
- `cargo --version`
- `go version`
- `java -version`
- `cmake --version | head -5`
- `gcc --version | head -5`
- `clang --version | head -5`
- `make --version | head -5`
- `tar -tf archive.tar | head -100`
- `zipinfo archive.zip | head -100`
- `jq --version`

## Still require confirmation

Installing packages, deleting or editing files, changing permissions, restarting services, downloading scripts, making external network requests, modifying git state, starting containers, and database migrations.

## Always refuse

Secrets, credential theft, destructive actions, malware, persistence, evasion, exfiltration, and unauthorized access. Unsafe examples use placeholders only.


## Expanded v4 safe examples

These examples are intended to teach **benign, read-only, local diagnostics**. They do not install packages, delete files, edit configs, dump environment variables, reveal secrets, or run downloaded scripts.

### Extra system checks

- `hostname`
- `id -un`
- `id -Gn`
- `date`
- `uptime`
- `lscpu`
- `nproc`
- `lsblk`
- `cat /proc/version`
- `cat /proc/meminfo | head -20`
- `cat /proc/cpuinfo | head -20`

### Extra safe project inspection

- `find . -maxdepth 2 -type f | sort | head -100`
- `find . -maxdepth 2 -type d | sort | head -100`
- `find . -maxdepth 3 -name "*.py" | sort | head -100`
- `find . -maxdepth 3 -name "*.md" | sort | head -100`
- `find . -maxdepth 3 -type f | wc -l`
- `du -sh .`
- `du -h --max-depth=1 . | sort -h | tail -20`
- `stat README.md`
- `file README.md`
- `wc -l README.md`
- `head -80 README.md`
- `tail -80 README.md`

### Extra safe Git inspection

- `git status --short`
- `git branch --show-current`
- `git log --oneline -5`
- `git diff --stat`
- `git diff --name-only`
- `git rev-parse --show-toplevel`
- `git ls-files | head -100`
- `git show --stat --oneline --no-renames HEAD`

### Extra safe developer environment checks

- `python --version`
- `python -m pip --version`
- `python -m pip list --format=columns | head -50`
- `node --version`
- `npm --version`
- `npm list --depth=0`
- `rustc --version`
- `cargo --version`
- `go version`
- `java -version`
- `gcc --version | head -1`
- `clang --version | head -1`
- `cmake --version | head -1`
- `ninja --version`

### Extra safe diagnostics rules

Do **not** auto-run these as safe examples:

- full environment-variable dumps
- full process command-line dumps
- arbitrary `cat` on unknown user files
- arbitrary network targets
- downloaded scripts
- package installs
- deletes, moves, permission changes, or config edits

Those belong in `CONFIRM` or `BLOCK`, not `ALLOW`.


## v5 macOS / Windows / Termux additions

These additions are read-only and designed for platform-specific agent workflows. They avoid Keychain, clipboard, contacts, browser stores, private keys, broad environment dumps, and real malicious commands.

### macOS

- `sw_vers` — show the macOS version details.
- `sw_vers -productName` — show the macOS product name.
- `sw_vers -productVersion` — show the macOS product version.
- `sw_vers -buildVersion` — show the macOS build version.
- `uname -a` — show the kernel and machine information.
- `arch` — show the CPU architecture.
- `whoami` — show the current terminal username.
- `id -un` — show the current user name.
- `pwd` — show the current working directory.
- `hostname` — show the local host name.
- `date` — show the current date and time.
- `uptime` — show system uptime.
- `df -h` — show disk usage in human-readable form.
- `du -sh .` — show the size of the current directory.
- `du -h -d 1 . | sort -h | tail -20` — summarize large folders in the current directory.
- `vm_stat` — show virtual memory statistics.
- `sysctl -n machdep.cpu.brand_string` — show the CPU model.
- `sysctl -n hw.memsize` — show the installed memory size.
- `sysctl -n hw.ncpu` — show the number of logical CPUs.
- `sysctl -n kern.osproductversion` — show the operating system product version.
- `system_profiler SPSoftwareDataType` — show read-only software profile details.
- `system_profiler SPDisplaysDataType` — show display hardware details.
- `system_profiler SPStorageDataType` — show storage device details.
- `system_profiler SPDeveloperToolsDataType` — show developer tools information.
- `pmset -g batt` — show battery status.
- `top -l 1 -stats pid,command,cpu,mem | head -25` — show top processes once.
- `ps aux | head -25` — show a short process list.
- `ps aux | sort -nrk 3,3 | head -15` — show processes using the most CPU.
- `lsof -nP -iTCP -sTCP:LISTEN | head -50` — show listening TCP services.
- `netstat -anv | head -50` — show a short network socket summary.
- `route -n get default` — show the default network route.
- `scutil --dns | head -80` — show a limited DNS resolver summary.
- `ifconfig | head -80` — show a limited network interface summary.
- `ping -c 2 127.0.0.1` — test loopback connectivity.
- `curl -I https://example.com` — check example.com headers only.
- `nslookup example.com` — resolve example.com with DNS.
- `dig example.com +short` — resolve example.com with dig.
- `xcode-select -p` — show the active Xcode developer path.
- `xcodebuild -version` — show the Xcode build tools version.
- `clang --version | head -5` — show the clang compiler version.
- `make --version | head -5` — show the make version.
- `cmake --version | head -5` — show the CMake version.
- `brew --version` — show the Homebrew version.
- `brew list --versions | head -50` — show a limited Homebrew package inventory.
- `brew leaves | head -50` — show top-level Homebrew packages.
- `python3 --version` — show the Python 3 version.
- `pip3 --version` — show the pip 3 version.
- `node --version` — show the Node.js version.
- `npm --version` — show the npm version.
- `ruby --version` — show the Ruby version.
- `gem --version` — show the RubyGems version.
- `java -version` — show the Java version.
- `git --version` — show the Git version.
- `git status --short` — show the Git working tree status.
- `git branch --show-current` — show the current Git branch.
- `git log --oneline -5` — show the five latest Git commits.
- `git diff --stat` — show a Git diff summary.
- `git ls-files | head -100` — show tracked project files.
- `ls -la` — list files in the current directory.
- `find . -maxdepth 2 -type f | sort | head -100` — list project files near the current directory.
- `find . -maxdepth 2 -type d | sort | head -100` — list project folders near the current directory.
- `find . -maxdepth 3 -name '*.py' | sort | head -100` — find Python files in the project.
- `find . -maxdepth 3 -name '*.md' | sort | head -100` — find Markdown files in the project.
- `grep -RIn 'TODO' . --exclude-dir=.git | head -50` — search for TODO notes in the project.
- `head -80 README.md` — preview the start of README.md.
- `tail -80 README.md` — preview the end of README.md.
- `stat README.md` — show README.md file metadata.
- `file README.md` — identify the README.md file type.
- `shasum -a 256 README.md` — calculate the README.md SHA-256 hash.
- `plutil -lint Info.plist` — lint Info.plist without changing it.

### Windows

- `powershell -NoProfile -Command "$PSVersionTable.PSVersion"` — show the PowerShell version.
- `powershell -NoProfile -Command "Get-Date"` — show the current date and time.
- `powershell -NoProfile -Command "Get-Location"` — show the current working directory.
- `powershell -NoProfile -Command "whoami"` — show the current username.
- `powershell -NoProfile -Command "hostname"` — show the hostname.
- `powershell -NoProfile -Command "[Environment]::OSVersion.VersionString"` — show the Windows OS version string.
- `powershell -NoProfile -Command "Get-ComputerInfo | Select-Object OsName,OsVersion,OsArchitecture,CsProcessors,CsTotalPhysicalMemory"` — show a limited computer information summary.
- `powershell -NoProfile -Command "Get-CimInstance Win32_OperatingSystem | Select-Object Caption,Version,BuildNumber,OSArchitecture"` — show operating system details.
- `powershell -NoProfile -Command "Get-CimInstance Win32_Processor | Select-Object Name,NumberOfCores,NumberOfLogicalProcessors"` — show processor details.
- `powershell -NoProfile -Command "Get-CimInstance Win32_PhysicalMemory | Select-Object Capacity,Speed,Manufacturer | Format-Table -AutoSize"` — show memory module summary.
- `powershell -NoProfile -Command "Get-CimInstance Win32_VideoController | Select-Object Name,DriverVersion,AdapterRAM"` — show graphics adapter details.
- `powershell -NoProfile -Command "Get-Volume | Select-Object DriveLetter,FileSystemLabel,FileSystem,SizeRemaining,Size"` — show volume and free-space details.
- `powershell -NoProfile -Command "Get-PSDrive -PSProvider FileSystem"` — show filesystem drives.
- `powershell -NoProfile -Command "Get-ChildItem | Select-Object -First 50 Name,Length,LastWriteTime"` — list current folder items.
- `powershell -NoProfile -Command "Get-ChildItem -Force | Select-Object -First 50 Name,Length,LastWriteTime"` — list current folder items including hidden entries.
- `powershell -NoProfile -Command "Get-ChildItem -Directory | Select-Object -First 50 Name,LastWriteTime"` — list folders in the current directory.
- `powershell -NoProfile -Command "Get-ChildItem -File | Select-Object -First 50 Name,Length"` — list files in the current directory.
- `powershell -NoProfile -Command "Get-ChildItem -Recurse -File -Depth 2 | Select-Object -First 100 FullName"` — list project files up to depth two.
- `powershell -NoProfile -Command "Get-ChildItem -Recurse -Directory -Depth 2 | Select-Object -First 100 FullName"` — list project folders up to depth two.
- `powershell -NoProfile -Command "Get-ChildItem -Recurse -File -Depth 3 -Filter *.py | Select-Object -First 100 FullName"` — find Python files in the project.
- `powershell -NoProfile -Command "Get-ChildItem -Recurse -File -Depth 3 -Include *.js,*.ts | Select-Object -First 100 FullName"` — find JavaScript and TypeScript files in the project.
- `powershell -NoProfile -Command "(Get-ChildItem -Recurse -File -Depth 3 | Measure-Object).Count"` — count project files up to depth three.
- `powershell -NoProfile -Command "(Get-ChildItem -Recurse -Directory -Depth 3 | Measure-Object).Count"` — count project folders up to depth three.
- `powershell -NoProfile -Command "Get-Process | Sort-Object CPU -Descending | Select-Object -First 15 ProcessName,Id,CPU,WorkingSet"` — show processes using the most CPU.
- `powershell -NoProfile -Command "Get-Process | Sort-Object WorkingSet -Descending | Select-Object -First 15 ProcessName,Id,WorkingSet"` — show processes using the most memory.
- `powershell -NoProfile -Command "Get-Service | Select-Object -First 50 Name,Status,StartType"` — show a limited service status summary.
- `powershell -NoProfile -Command "Get-NetAdapter | Select-Object Name,Status,LinkSpeed"` — show network adapter status.
- `powershell -NoProfile -Command "Get-NetIPAddress | Select-Object InterfaceAlias,AddressFamily,IPAddress | Select-Object -First 30"` — show a limited IP address summary.
- `powershell -NoProfile -Command "Get-NetRoute | Select-Object -First 30 DestinationPrefix,NextHop,InterfaceAlias"` — show a limited route summary.
- `powershell -NoProfile -Command "Test-Connection 127.0.0.1 -Count 2"` — test loopback connectivity.
- `powershell -NoProfile -Command "Resolve-DnsName example.com"` — resolve example.com with DNS.
- `powershell -NoProfile -Command "Invoke-WebRequest -Method Head -Uri https://example.com -UseBasicParsing"` — check example.com headers only.
- `powershell -NoProfile -Command "Get-Command python -ErrorAction SilentlyContinue"` — check whether Python is available.
- `powershell -NoProfile -Command "python --version"` — show the Python version.
- `powershell -NoProfile -Command "py --version"` — show the Python launcher version.
- `powershell -NoProfile -Command "pip --version"` — show the pip version.
- `powershell -NoProfile -Command "node --version"` — show the Node.js version.
- `powershell -NoProfile -Command "npm --version"` — show the npm version.
- `powershell -NoProfile -Command "git --version"` — show the Git version.
- `powershell -NoProfile -Command "git status --short"` — show Git working tree status.
- `powershell -NoProfile -Command "git branch --show-current"` — show the current Git branch.
- `powershell -NoProfile -Command "git log --oneline -5"` — show the five latest Git commits.
- `powershell -NoProfile -Command "git diff --stat"` — show a Git diff summary.
- `powershell -NoProfile -Command "dotnet --info"` — show .NET SDK information.
- `powershell -NoProfile -Command "java -version"` — show the Java version.
- `powershell -NoProfile -Command "go version"` — show the Go version.
- `powershell -NoProfile -Command "rustc --version"` — show the Rust compiler version.
- `powershell -NoProfile -Command "cargo --version"` — show the Cargo version.
- `powershell -NoProfile -Command "Get-Content README.md -TotalCount 80"` — preview README.md.
- `powershell -NoProfile -Command "Get-Content package.json -TotalCount 120"` — preview package.json.
- `powershell -NoProfile -Command "Get-FileHash README.md -Algorithm SHA256"` — calculate the README.md SHA-256 hash.
- `powershell -NoProfile -Command "Select-String -Path *.md -Pattern TODO -SimpleMatch | Select-Object -First 50 Path,LineNumber,Line"` — search Markdown files for TODO notes.
- `cmd /c ver` — show the Windows version with cmd.
- `cmd /c whoami` — show the current username with cmd.
- `cmd /c cd` — show the current directory with cmd.
- `cmd /c dir` — list the current directory with cmd.
- `cmd /c hostname` — show the hostname with cmd.
- `cmd /c date /t` — show the current date with cmd.
- `cmd /c time /t` — show the current time with cmd.
- `cmd /c systeminfo | findstr /B /C:"OS Name" /C:"OS Version" /C:"System Type"` — show a limited systeminfo summary.
- `cmd /c ipconfig` — show IP configuration.
- `cmd /c ping 127.0.0.1 -n 2` — test loopback connectivity with cmd.
- `cmd /c nslookup example.com` — resolve example.com with cmd.

### Termux

- `termux-info` — show Termux environment information.
- `uname -a` — show kernel and device architecture information.
- `whoami` — show the current terminal username.
- `pwd` — show the current working directory.
- `ls -la` — list current directory files.
- `df -h` — show filesystem usage.
- `du -sh .` — show the size of the current directory.
- `date` — show the current date and time.
- `uptime` — show system uptime.
- `getprop ro.product.model` — show the Android device model.
- `getprop ro.product.manufacturer` — show the Android device manufacturer.
- `getprop ro.build.version.release` — show the Android release version.
- `getprop ro.build.version.sdk` — show the Android SDK version.
- `getprop ro.product.cpu.abi` — show the Android CPU ABI.
- `getprop ro.hardware` — show the Android hardware platform.
- `pm list packages | head -100` — show a limited package list.
- `pkg list-installed | head -100` — show a limited Termux package inventory.
- `apt list --installed 2>/dev/null | head -100` — show a limited apt package inventory.
- `ls $PREFIX/bin | head -100` — list Termux binary names.
- `du -sh $PREFIX 2>/dev/null` — show Termux prefix size.
- `python --version` — show the Python version.
- `python3 --version` — show the Python 3 version.
- `pip --version` — show the pip version.
- `node --version` — show the Node.js version.
- `npm --version` — show the npm version.
- `git --version` — show the Git version.
- `git status --short` — show the Git working tree status.
- `git branch --show-current` — show the current Git branch.
- `git log --oneline -5` — show the five latest Git commits.
- `git diff --stat` — show a Git diff summary.
- `find . -maxdepth 2 -type f | sort | head -100` — list files near the current directory.
- `find . -maxdepth 2 -type d | sort | head -100` — list folders near the current directory.
- `find . -maxdepth 3 -name '*.py' | sort | head -100` — find Python files in the project.
- `find . -maxdepth 3 -name '*.js' -o -name '*.ts' | sort | head -100` — find JavaScript and TypeScript files in the project.
- `grep -RIn 'TODO' . --exclude-dir=.git | head -50` — search for TODO notes in the project.
- `head -80 README.md` — preview the start of README.md.
- `tail -80 README.md` — preview the end of README.md.
- `stat README.md` — show README.md file metadata.
- `file README.md` — identify README.md file type.
- `sha256sum README.md` — calculate the README.md SHA-256 hash.
- `ip addr show` — show network interface addresses.
- `ip route show` — show the routing table.
- `ss -tuln` — show listening network sockets.
- `ping -c 2 127.0.0.1` — test loopback connectivity.
- `curl -I https://example.com` — check example.com headers only.
- `nslookup example.com` — resolve example.com with DNS.
- `termux-battery-status` — show Termux battery status.



## v6 Windows / Termux / DiskPart expansion

Added a larger set of Windows and Termux read-only examples, including Windows storage inventory, DiskPart `list`/`select`/`detail` inspection, USB inventory, package inventory, network diagnostics, and Termux system/dev/package checks.

Important: USB eject/dismount is placed in confirmation-required examples, not automatic allow. It is generally safe on modern Windows quick-removal settings, but it still changes mounted device state and can interrupt open files/transfers.

See `docs/V6_WINDOWS_TERMUX_DISKPART_EXPANSION.md` for the full command list.


## v7 web-researched platform expansion

Additional auto-allow candidates were added for Windows, Termux, and macOS. The full training rows are in `data/` and the external gate is in `scripts/tool_gate.py`.

Representative new safe read-only commands:

- `apt list --installed 2>/dev/null | head -120`
- `apt-cache policy clang 2>/dev/null`
- `apt-cache policy cmake 2>/dev/null`
- `apt-cache policy curl 2>/dev/null`
- `apt-cache policy fd 2>/dev/null`
- `apt-cache policy ffmpeg 2>/dev/null`
- `apt-cache policy git 2>/dev/null`
- `apt-cache policy golang 2>/dev/null`
- `apt-cache policy jq 2>/dev/null`
- `apt-cache policy make 2>/dev/null`
- `apt-cache policy nano 2>/dev/null`
- `apt-cache policy nodejs 2>/dev/null`
- `apt-cache policy openjdk-17 2>/dev/null`
- `apt-cache policy openssh 2>/dev/null`
- `apt-cache policy openssl 2>/dev/null`
- `apt-cache policy python 2>/dev/null`
- `apt-cache policy ripgrep 2>/dev/null`
- `apt-cache policy rust 2>/dev/null`
- `apt-cache policy tmux 2>/dev/null`
- `apt-cache policy vim 2>/dev/null`
- `apt-cache policy wget 2>/dev/null`
- `arp -a`
- `brew --version`
- `brew list --versions | head -100`
- `cat /proc/cpuinfo | head -60`
- `cat /proc/meminfo | head -30`
- `cat /proc/version`
- `cmd /c arp -a`
- `cmd /c bcdedit /enum`
- `cmd /c cd`
- `cmd /c dir`
- `cmd /c dir /a`
- `cmd /c dir /s /b *.csproj`
- `cmd /c dir /s /b *.sln`
- `cmd /c dir /s /b package.json`
- `cmd /c driverquery`
- `cmd /c driverquery /v /fo table`
- `cmd /c fsutil fsinfo drives`
- `cmd /c hostname`
- `cmd /c ipconfig`
- `cmd /c ipconfig /all`
- `cmd /c manage-bde -status`
- `cmd /c mountvol`
- `cmd /c netsh interface show interface`
- `cmd /c netsh wlan show drivers`
- `cmd /c netstat -ano`
- `cmd /c pnputil /enum-devices /class USB`
- `cmd /c pnputil /enum-devices /connected`
- `cmd /c pnputil /enum-drivers`
- `cmd /c powercfg /a`
- `cmd /c query user`
- `cmd /c qwinsta`
- `cmd /c reagentc /info`
- `cmd /c route print`
- `cmd /c schtasks /query /fo TABLE /nh`
- `cmd /c systeminfo`
- `cmd /c tasklist`
- `cmd /c tasklist /svc`
- `cmd /c ver`
- `cmd /c where git`
- `cmd /c where node`
- `cmd /c where python`
- `cmd /c whoami`
- `cmd /c wmic diskdrive get Model,InterfaceType,MediaType,Size,Status`
- `cmd /c wmic logicaldisk get Caption,Description,FileSystem,FreeSpace,Size,VolumeName`
- `cmd /c wmic partition get DiskIndex,Index,Name,Size,Type`
- `cmd /c wmic volume get DriveLetter,FileSystem,FreeSpace,Capacity,Label`
- `cmd activity get-current-user`
- `cmd package list packages | head -100`
- `command -v cargo`
- `command -v clang`
- `command -v cmake`
- `command -v curl`
- `command -v fd`
- `command -v git`
- `command -v go`
- `command -v java`
- `command -v jq`
- `command -v make`
- `command -v node`
- `command -v npm`
- `command -v pip`
- `command -v python`
- `command -v python3`
- `command -v rg`
- `command -v rustc`
- `command -v wget`
- `csrutil status`
- `curl -I https://example.com`
- `date`
- `df -h`
- `dig example.com +short`
- `diskutil apfs list`
- `diskutil apfs listSnapshots /`
- `diskutil apfs listVolumeGroups`
- `diskutil cs list`
- `diskutil info /`
- `diskutil info disk0`
- `diskutil info disk1`
- `diskutil info disk2`
- `diskutil list`
- `diskutil listFilesystems`
- `dpkg -L bash | head -80`
- `dpkg -L clang 2>/dev/null | head -80`
- `dpkg -L cmake 2>/dev/null | head -80`
- `dpkg -L curl 2>/dev/null | head -80`
- `dpkg -L fd 2>/dev/null | head -80`
- `dpkg -L ffmpeg 2>/dev/null | head -80`
- `dpkg -L git 2>/dev/null | head -80`
- `dpkg -L golang 2>/dev/null | head -80`
- `dpkg -L jq 2>/dev/null | head -80`
- `dpkg -L make 2>/dev/null | head -80`
- `dpkg -L nano 2>/dev/null | head -80`
- `dpkg -L nodejs 2>/dev/null | head -80`
- `dpkg -L openjdk-17 2>/dev/null | head -80`
- `dpkg -L openssh 2>/dev/null | head -80`
- `dpkg -L openssl 2>/dev/null | head -80`
- `dpkg -L python 2>/dev/null | head -80`
- `dpkg -L ripgrep 2>/dev/null | head -80`
- `dpkg -L rust 2>/dev/null | head -80`
- `dpkg -L tmux 2>/dev/null | head -80`
- `dpkg -L vim 2>/dev/null | head -80`
- `dpkg -L wget 2>/dev/null | head -80`
- `dpkg -l | head -120`
- `du -h -d 1 . | sort -h | tail -20`
- `du -sh .`
- `dumpsys battery | head -80`
- `dumpsys meminfo | head -100`
- `dumpsys power | head -80`
- `echo $HOME`
- `echo $PREFIX`
- `echo $SHELL`
- `fdesetup status`
- `find $PREFIX/bin -maxdepth 1 -type f | sort | head -120`
- `find . -maxdepth 2 -type d | sort | head -100`
- `find . -maxdepth 2 -type f | sort | head -100`
- `find . -maxdepth 3 -name "*.go" | sort | head -100`
- `find . -maxdepth 3 -name "*.java" | sort | head -100`
- `find . -maxdepth 3 -name "*.js" | sort | head -100`
- `find . -maxdepth 3 -name "*.json" | sort | head -100`
- `find . -maxdepth 3 -name "*.kt" | sort | head -100`
- `find . -maxdepth 3 -name "*.md" | sort | head -100`
- `find . -maxdepth 3 -name "*.py" | sort | head -100`
- `find . -maxdepth 3 -name "*.rs" | sort | head -100`
- `find . -maxdepth 3 -name "*.sh" | sort | head -100`
- `find . -maxdepth 3 -name "*.toml" | sort | head -100`
- `find . -maxdepth 3 -name "*.ts" | sort | head -100`
- `find . -maxdepth 3 -name "*.yaml" | sort | head -100`
- `find . -maxdepth 3 -name "*.yml" | sort | head -100`
- `getconf LONG_BIT`
- `getent hosts example.com`
- `getprop ro.build.version.release`
- `getprop ro.build.version.sdk`
- `getprop ro.hardware`
- `getprop ro.product.cpu.abi`
- `getprop ro.product.manufacturer`
- `getprop ro.product.model`
- `git --version`
- `git branch --show-current`
- `git log --oneline -5`

DiskPart auto-allow remains restricted to list/select/detail inspection only. USB eject/unmount and Termux state/privacy actions remain confirmation-required.
