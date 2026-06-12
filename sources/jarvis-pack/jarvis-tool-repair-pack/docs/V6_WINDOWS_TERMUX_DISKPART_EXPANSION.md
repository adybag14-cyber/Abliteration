# V6 Windows / Termux / DiskPart Expansion

This expansion adds more safe read-only examples, especially for Windows storage, DiskPart inventory, USB inventory, and Termux diagnostics.

## Safety choices

- DiskPart examples are limited to `list`, `select`, and `detail` style inspection.
- DiskPart mutation commands such as clean, format, delete, create, assign, remove, shrink, extend, online/offline, and convert are not auto-allow examples.
- USB eject/dismount is treated as confirmation-required. It is normally low-risk, but it still changes device state and can interrupt open files or transfers.
- Termux examples avoid contacts, SMS, call logs, clipboard, precise location, Wi-Fi identifiers, broad environment dumps, private app data, and credential stores.

## Added counts

- SFT rows added: 1851
- DPO rows added: 943
- Eval rows added: 227

## New safe commands

### Termux

- `termux-info` — show Termux environment information.
- `uname -a` — show Android/Linux kernel information.
- `whoami` — show the current Termux user.
- `pwd` — show the current Termux directory.
- `id` — show the current user and group IDs.
- `date` — show the current date and time.
- `uptime` — show system uptime.
- `getprop ro.build.version.release` — show Android release version.
- `getprop ro.build.version.sdk` — show Android SDK version.
- `getprop ro.product.manufacturer` — show device manufacturer.
- `getprop ro.product.model` — show device model.
- `getprop ro.product.cpu.abi` — show device CPU ABI.
- `getprop ro.hardware` — show hardware platform name.
- `df -h` — show filesystem free space.
- `du -sh .` — show the size of the current directory.
- `du -h -d 1 . | sort -h | tail -20` — summarize folder sizes in the current directory.
- `ls` — list files in the current directory.
- `ls -la` — list all entries in the current directory.
- `find . -maxdepth 2 -type f | sort | head -100` — list nearby files.
- `find . -maxdepth 2 -type d | sort | head -100` — list nearby folders.
- `find . -maxdepth 3 -name "*.py" | sort | head -100` — find Python files.
- `find . -maxdepth 3 -name "*.sh" | sort | head -100` — find shell scripts.
- `find . -maxdepth 3 -name "*.md" | sort | head -100` — find Markdown files.
- `stat README.md` — show README file metadata.
- `file README.md` — show README file type.
- `head -80 README.md` — preview the beginning of README.
- `tail -80 README.md` — preview the end of README.
- `sha256sum README.md` — compute the README SHA-256 hash.
- `ps -A | head -80` — show a limited process list.
- `top -b -n 1 | head -60` — show a one-shot process summary.
- `pgrep -a python` — look for Python processes.
- `ip addr show` — show network interface addresses.
- `ip route show` — show network routes.
- `ss -tuln` — show listening network sockets.
- `ping -c 2 127.0.0.1` — ping localhost.
- `curl -I https://example.com` — check example.com headers only.
- `nslookup example.com` — resolve example.com with DNS.
- `getent hosts example.com` — resolve example.com with getent.
- `pkg list-installed | head -100` — list installed Termux packages.
- `apt list --installed 2>/dev/null | head -100` — list installed apt packages.
- `dpkg -l | head -100` — list installed dpkg packages.
- `pkg show python` — show Termux package metadata for Python.
- `pkg show git` — show Termux package metadata for Git.
- `apt-cache policy python` — show apt policy for Python.
- `apt-cache policy git` — show apt policy for Git.
- `ls $PREFIX/bin | head -100` — list Termux binary directory entries.
- `du -sh $PREFIX` — show Termux prefix size.
- `python --version` — show Python version.
- `python -m pip --version` — show pip version.
- `python -m pip list --format=columns | head -100` — list installed Python packages.
- `node --version` — show Node.js version.
- `npm --version` — show npm version.
- `git --version` — show Git version.
- `git status --short` — show Git status.
- `git branch --show-current` — show current Git branch.
- `git log --oneline -5` — show recent Git commits.
- `clang --version | head -5` — show clang version.
- `cmake --version | head -5` — show CMake version.
- `make --version | head -5` — show make version.
- `termux-battery-status` — show battery status.

### Windows

- `powershell -NoProfile -Command "Get-Disk | Select-Object Number,FriendlyName,BusType,Size,OperationalStatus,PartitionStyle"` — list Windows disks with bus type and status.
- `powershell -NoProfile -Command "Get-Partition | Select-Object DiskNumber,PartitionNumber,DriveLetter,Type,Size"` — list Windows partitions.
- `powershell -NoProfile -Command "Get-Volume | Select-Object DriveLetter,FileSystemLabel,FileSystem,HealthStatus,SizeRemaining,Size"` — list Windows volumes and free space.
- `powershell -NoProfile -Command "Get-PhysicalDisk | Select-Object FriendlyName,MediaType,BusType,HealthStatus,OperationalStatus,Size"` — list physical disks.
- `powershell -NoProfile -Command "Get-StoragePool | Select-Object FriendlyName,OperationalStatus,HealthStatus,Size"` — list storage pools.
- `powershell -NoProfile -Command "Get-VirtualDisk | Select-Object FriendlyName,HealthStatus,OperationalStatus,Size"` — list virtual disks.
- `powershell -NoProfile -Command "Get-PSDrive -PSProvider FileSystem"` — list filesystem drives.
- `powershell -NoProfile -Command "Get-CimInstance Win32_DiskDrive | Select-Object Model,InterfaceType,MediaType,Size"` — show disk drive models and sizes.
- `powershell -NoProfile -Command "Get-CimInstance Win32_LogicalDisk | Select-Object DeviceID,DriveType,FileSystem,FreeSpace,Size"` — show logical disk free space.
- `powershell -NoProfile -Command "Get-CimInstance Win32_Volume | Select-Object DriveLetter,Label,FileSystem,Capacity,FreeSpace"` — show volume capacity and free space.
- `powershell -NoProfile -Command "Get-PnpDevice -Class DiskDrive | Select-Object Status,Class,FriendlyName"` — list Plug and Play disk devices.
- `powershell -NoProfile -Command "Get-PnpDevice -Class USB | Select-Object -First 80 Status,Class,FriendlyName"` — list USB Plug and Play devices.
- `powershell -NoProfile -Command "Get-CimInstance Win32_USBController | Select-Object Name,Status"` — list USB controllers.
- `powershell -NoProfile -Command "Get-CimInstance Win32_USBHub | Select-Object Name,Status"` — list USB hubs.
- `powershell -NoProfile -Command "Get-Item -Path . | Select-Object FullName,CreationTime,LastWriteTime"` — show current folder metadata.
- `powershell -NoProfile -Command "Get-ChildItem -File | Select-Object -First 100 Name,Length,LastWriteTime"` — list files in the current folder.
- `powershell -NoProfile -Command "Get-ChildItem -Directory | Select-Object -First 100 Name,LastWriteTime"` — list directories in the current folder.
- `powershell -NoProfile -Command "Get-ChildItem -Recurse -File -Depth 2 | Select-Object -First 150 FullName,Length"` — inventory project files up to depth two.
- `powershell -NoProfile -Command "Get-ChildItem -Recurse -Directory -Depth 2 | Select-Object -First 150 FullName"` — inventory project folders up to depth two.
- `powershell -NoProfile -Command "Get-ChildItem -Recurse -File -Depth 3 -Filter *.ps1 | Select-Object -First 100 FullName"` — find PowerShell files in the project.
- `powershell -NoProfile -Command "Get-ChildItem -Recurse -File -Depth 3 -Include *.py,*.js,*.ts,*.md | Select-Object -First 150 FullName"` — find common project source files.
- `powershell -NoProfile -Command "Get-Content README.md -TotalCount 80"` — preview the README file.
- `powershell -NoProfile -Command "Get-Item README.md | Select-Object Name,Length,LastWriteTime"` — show README metadata.
- `powershell -NoProfile -Command "Get-FileHash README.md -Algorithm SHA256"` — compute the README SHA-256 hash.
- `powershell -NoProfile -Command "Select-String -Path *.md -Pattern TODO -SimpleMatch | Select-Object -First 50"` — search Markdown files for TODO notes.
- `powershell -NoProfile -Command "Get-Acl . | Format-List"` — inspect current folder permissions.
- `cmd /c echo list disk | diskpart` — list disks with DiskPart.
- `cmd /c echo list volume | diskpart` — list volumes with DiskPart.
- `cmd /c "(echo select disk 0& echo detail disk) | diskpart"` — show read-only details for disk 0 with DiskPart.
- `cmd /c "(echo select volume C& echo detail volume) | diskpart"` — show read-only details for volume C with DiskPart.
- `cmd /c fsutil fsinfo drives` — list drive letters with fsutil.
- `cmd /c wmic logicaldisk get DeviceID,DriveType,FileSystem,FreeSpace,Size` — show logical disk summary with wmic.
- `cmd /c wmic diskdrive get Model,InterfaceType,MediaType,Size` — show disk drive summary with wmic.
- `cmd /c mountvol` — list mounted volumes with mountvol.
- `powershell -NoProfile -Command "$PSVersionTable.PSVersion"` — show the PowerShell version.
- `powershell -NoProfile -Command "Get-Date"` — show the system date and time.
- `powershell -NoProfile -Command "Get-Location"` — show the current working directory.
- `powershell -NoProfile -Command "whoami"` — show the current Windows user.
- `powershell -NoProfile -Command "hostname"` — show the computer hostname.
- `powershell -NoProfile -Command "[Environment]::OSVersion.VersionString"` — show the Windows version string.
- `powershell -NoProfile -Command "Get-ComputerInfo | Select-Object OsName,OsVersion,OsArchitecture,CsProcessors,CsTotalPhysicalMemory"` — show a limited computer information summary.
- `powershell -NoProfile -Command "Get-CimInstance Win32_OperatingSystem | Select-Object Caption,Version,BuildNumber,OSArchitecture,LastBootUpTime"` — show operating system details.
- `powershell -NoProfile -Command "Get-CimInstance Win32_Processor | Select-Object Name,NumberOfCores,NumberOfLogicalProcessors,MaxClockSpeed"` — show processor details.
- `powershell -NoProfile -Command "Get-CimInstance Win32_PhysicalMemory | Select-Object Capacity,Speed,Manufacturer | Format-Table -AutoSize"` — show memory module summary.
- `powershell -NoProfile -Command "Get-CimInstance Win32_VideoController | Select-Object Name,DriverVersion,AdapterRAM"` — show graphics adapter details.
- `powershell -NoProfile -Command "Get-CimInstance Win32_Battery | Select-Object Name,EstimatedChargeRemaining,BatteryStatus"` — show battery status if available.
- `powershell -NoProfile -Command "Get-Process | Sort-Object CPU -Descending | Select-Object -First 25 Id,ProcessName,CPU,WorkingSet"` — show top processes by CPU.
- `powershell -NoProfile -Command "Get-Process | Sort-Object WorkingSet -Descending | Select-Object -First 25 Id,ProcessName,WorkingSet"` — show top processes by memory.
- `powershell -NoProfile -Command "Get-Service | Sort-Object Status,Name | Select-Object -First 120 Name,Status,DisplayName"` — list services and statuses.
- `powershell -NoProfile -Command "Get-ScheduledTask | Select-Object -First 80 TaskName,State,TaskPath"` — list scheduled task names and states.
- `powershell -NoProfile -Command "Get-NetAdapter | Select-Object Name,Status,LinkSpeed,MacAddress"` — show network adapters.
- `powershell -NoProfile -Command "Get-NetIPConfiguration | Select-Object InterfaceAlias,IPv4Address,IPv6Address,DNSServer"` — show IP configuration.
- `powershell -NoProfile -Command "Get-NetRoute -DestinationPrefix 0.0.0.0/0 | Select-Object InterfaceAlias,NextHop,RouteMetric"` — show default IPv4 routes.
- `powershell -NoProfile -Command "Get-DnsClientServerAddress | Select-Object InterfaceAlias,ServerAddresses"` — show DNS server configuration.
- `powershell -NoProfile -Command "Get-NetTCPConnection -State Listen | Select-Object -First 80 LocalAddress,LocalPort,OwningProcess"` — show listening TCP ports.
- `powershell -NoProfile -Command "Test-NetConnection 127.0.0.1"` — test localhost connectivity.
- `powershell -NoProfile -Command "Resolve-DnsName example.com"` — resolve example.com with DNS.
- `powershell -NoProfile -Command "Invoke-WebRequest -Uri https://example.com -Method Head -UseBasicParsing | Select-Object StatusCode,StatusDescription"` — check example.com headers only.
- `powershell -NoProfile -Command "Get-NetFirewallProfile | Select-Object Name,Enabled,DefaultInboundAction,DefaultOutboundAction"` — show firewall profile status.
- `powershell -NoProfile -Command "Get-NetFirewallRule | Select-Object -First 80 DisplayName,Enabled,Direction,Action"` — list firewall rules without changing them.
- `powershell -NoProfile -Command "Get-Command python -ErrorAction SilentlyContinue"` — check whether Python is available.
- `powershell -NoProfile -Command "python --version"` — show the Python version.
- `powershell -NoProfile -Command "py --version"` — show the Python launcher version.
- `powershell -NoProfile -Command "pip --version"` — show the pip version.
- `powershell -NoProfile -Command "node --version"` — show the Node.js version.
- `powershell -NoProfile -Command "npm --version"` — show the npm version.
- `powershell -NoProfile -Command "git --version"` — show the Git version.
- `powershell -NoProfile -Command "git status --short"` — show Git status.
- `powershell -NoProfile -Command "git branch --show-current"` — show the current Git branch.
- `powershell -NoProfile -Command "git log --oneline -5"` — show recent Git commits.
- `powershell -NoProfile -Command "where.exe python"` — locate Python on PATH.
- `powershell -NoProfile -Command "where.exe git"` — locate Git on PATH.
- `powershell -NoProfile -Command "Get-Package | Select-Object -First 100 Name,Version,ProviderName"` — list installed packages known to PowerShell.
- `powershell -NoProfile -Command "winget list --disable-interactivity | Select-Object -First 100"` — list installed winget packages.
- `powershell -NoProfile -Command "choco list --local-only --limit-output | Select-Object -First 100"` — list installed Chocolatey packages.
- `powershell -NoProfile -Command "scoop list | Select-Object -First 100"` — list installed Scoop apps.
- `cmd /c ver` — show the Windows version from cmd.
- `cmd /c whoami` — show the current user from cmd.
- `cmd /c hostname` — show the hostname from cmd.
- `cmd /c cd` — show the current directory from cmd.
- `cmd /c dir` — list the current directory from cmd.
- `cmd /c dir /a` — list all current directory entries from cmd.
- `cmd /c systeminfo | findstr /B /C:"OS Name" /C:"OS Version" /C:"System Type"` — show a short systeminfo summary.
- `cmd /c ipconfig` — show IP configuration from cmd.
- `cmd /c netstat -ano | findstr LISTENING` — show listening ports from cmd.
- `cmd /c ping 127.0.0.1 -n 2` — ping localhost from cmd.
- `cmd /c nslookup example.com` — resolve example.com from cmd.
- `cmd /c where python` — locate Python from cmd.
- `cmd /c where git` — locate Git from cmd.
- `cmd /c powercfg /a` — show supported sleep states.
- `cmd /c powercfg /devicequery wake_armed` — show devices allowed to wake the computer.

### macOS

- `diskutil list` — list disks and volumes.
- `diskutil info /` — show read-only information about the root volume.
- `system_profiler SPUSBDataType | head -120` — show a limited USB hardware summary.
- `system_profiler SPStorageDataType | head -120` — show a limited storage hardware summary.

## Confirmation-required examples added

These are intentionally not trained as automatic safe tool calls:

- Ejecting or dismounting USB/removable drives.
- Offlining/onlining disks or changing drive letters.
- DiskPart commands that modify partitions, volumes, attributes, or formatting.
- Termux clipboard, precise location, storage setup, and Wi-Fi identifier commands.


## v6b wording expansion

Added 4650 SFT rows, 2480 DPO rows, and 310 eval rows using additional safe wording variations for the same allow-listed command set.
