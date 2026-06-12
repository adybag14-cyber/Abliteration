#!/usr/bin/env python3
"""Generate thousands of Windows / macOS / Zig command examples for agent training & eval."""

import json
from itertools import product
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "examples"


def write_jsonl(path: Path, rows: list) -> int:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as f:
        for row in rows:
            f.write(json.dumps(row, ensure_ascii=False) + "\n")
    return len(rows)


def row(platform, category, command, purpose, risk="read_only", **extra):
    r = {
        "platform": platform,
        "category": category,
        "command": command,
        "purpose": purpose,
        "risk": risk,
    }
    r.update(extra)
    return r


def prompt_row(platform, category, prompt, command, expected="tool_call"):
    return {
        "platform": platform,
        "category": category,
        "prompt": prompt,
        "command": command,
        "expected": expected,
    }


# --- Windows ---

WIN32_CIM = [
    ("Win32_BIOS", "Manufacturer,SerialNumber,SMBIOSBIOSVersion,ReleaseDate"),
    ("Win32_BaseBoard", "Manufacturer,Product,SerialNumber,Version"),
    ("Win32_ComputerSystem", "Manufacturer,Model,TotalPhysicalMemory,SystemType"),
    ("Win32_ComputerSystemProduct", "UUID,Name,IdentifyingNumber,Vendor"),
    ("Win32_Processor", "Name,NumberOfCores,NumberOfLogicalProcessors,MaxClockSpeed"),
    ("Win32_PhysicalMemory", "Capacity,Speed,Manufacturer,PartNumber"),
    ("Win32_DiskDrive", "Model,InterfaceType,MediaType,Size,SerialNumber"),
    ("Win32_LogicalDisk", "DeviceID,FileSystem,Size,FreeSpace,VolumeName"),
    ("Win32_Volume", "DriveLetter,Label,Capacity,FreeSpace,FileSystem"),
    ("Win32_PnPEntity", "Name,DeviceID,Manufacturer,Status"),
    ("Win32_USBController", "Name,DeviceID,Manufacturer"),
    ("Win32_NetworkAdapter", "Name,MACAddress,Speed,NetConnectionStatus"),
    ("Win32_NetworkAdapterConfiguration", "Description,IPAddress,MACAddress,DHCPEnabled"),
    ("Win32_OperatingSystem", "Caption,Version,BuildNumber,OSArchitecture,LastBootUpTime"),
    ("Win32_Service", "Name,State,StartMode,PathName"),
    ("Win32_Process", "Name,ProcessId,WorkingSetSize,ExecutablePath"),
    ("Win32_Product", "Name,Version,Vendor"),
    ("Win32_VideoController", "Name,AdapterRAM,DriverVersion,VideoProcessor"),
    ("Win32_SoundDevice", "Name,Manufacturer,Status"),
    ("Win32_Printer", "Name,DriverName,PortName"),
    ("Win32_Keyboard", "Name,Description"),
    ("Win32_PointingDevice", "Name,Description"),
    ("Win32_Battery", "Name,EstimatedChargeRemaining,BatteryStatus"),
    ("Win32_Fan", "DesiredSpeed,VariableSpeed"),
    ("Win32_TemperatureProbe", "CurrentReading,Description"),
    ("Win32_PerfFormattedData_PerfOS_Processor", "Name,PercentProcessorTime"),
    ("Win32_PerfFormattedData_PerfDisk_LogicalDisk", "Name,DiskReadsPerSec,DiskWritesPerSec"),
]

WMIC_ALIASES = [
    ("diskdrive", "Model,InterfaceType,Size,Status,SerialNumber"),
    ("partition", "DiskIndex,Index,Name,Size,Type"),
    ("volume", "DriveLetter,FileSystem,Capacity,FreeSpace,Label"),
    ("logicaldisk", "DeviceID,FileSystem,Size,FreeSpace"),
    ("bios", "Manufacturer,SerialNumber,Version,ReleaseDate"),
    ("baseboard", "Manufacturer,Product,SerialNumber"),
    ("computersystem", "Manufacturer,Model,TotalPhysicalMemory"),
    ("cpu", "Name,NumberOfCores,NumberOfLogicalProcessors"),
    ("memorychip", "Capacity,Speed,Manufacturer"),
    ("nic", "Name,MACAddress,Speed"),
    ("nicconfig", "IPAddress,MACAddress,Description"),
    ("os", "Caption,Version,BuildNumber,OSArchitecture"),
    ("process", "Name,ProcessId,WorkingSetSize"),
    ("service", "Name,State,StartMode"),
    ("startup", "Name,Command,Location"),
    ("useraccount", "Name,Disabled,LocalAccount"),
    ("group", "Name,SID"),
    ("share", "Name,Path,Description"),
    ("printer", "Name,DriverName,PortName"),
    ("path", "ExecutablePath,FileSize,Name"),
    ("environment", "Name,VariableValue"),
    ("timezone", "StandardName,Bias"),
]

PS_PNP_CLASSES = [
    "USB", "DiskDrive", "Net", "Bluetooth", "Camera", "Biometric", "HIDClass",
    "Keyboard", "Mouse", "Monitor", "AudioEndpoint", "SCSIAdapter", "Processor",
    "System", "Firmware", "SecurityDevices", "SmartCardReader", "PrintQueue",
]

REG_PATHS = [
    (r"HKLM\SOFTWARE\Microsoft\Windows NT\CurrentVersion", "ProductName,CurrentBuild,DisplayVersion"),
    (r"HKLM\HARDWARE\DESCRIPTION\System\BIOS", "BIOSVendor,BIOSVersion,SystemManufacturer"),
    (r"HKLM\SYSTEM\CurrentControlSet\Control\ComputerName\ComputerName", "ComputerName"),
    (r"HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\*", "DisplayName,DisplayVersion,Publisher"),
    (r"HKLM\SYSTEM\CurrentControlSet\Services", "subkey enumeration"),
    (r"HKCU\Software\Microsoft\Windows\CurrentVersion\Explorer", "ShellState"),
    (r"HKLM\SOFTWARE\Microsoft\Cryptography", "MachineGuid"),
    (r"HKLM\SYSTEM\CurrentControlSet\Control\SecureBoot\State", "UEFISecureBootEnabled"),
]

NETSH_SHOW = [
    "interface show interface",
    "interface ipv4 show config",
    "interface ipv6 show interface",
    "wlan show profiles",
    "wlan show interfaces",
    "winhttp show proxy",
    "advfirewall show allprofiles",
    "advfirewall show currentprofile",
    "advfirewall firewall show rule name=all",
    "http show sslcert",
    "trace show status",
]

FSUTIL = [
    "fsinfo drives",
    "fsinfo volumeinfo C:",
    "fsinfo ntfsinfo C:",
    "fsinfo sectorinfo C:",
    "fsinfo statistics C:",
    "dirty query C:",
]

CERTUTIL = [
    "-store -user My",
    "-store Root",
    "-verifystore Root",
    "-hashfile C:\\Windows\\System32\\ntoskrnl.exe SHA256",
]

DISKPART_SEQUENCES = [
    "list disk",
    "list volume",
    "list vdisk",
] + [f"select disk {i}\ndetail disk" for i in range(8)] + [
    f"select volume {i}\ndetail volume" for i in range(8)
]

CMD_READONLY = [
    "ver", "whoami", "hostname", "date /t", "time /t", "cd", "dir", "tree /F /A",
    "systeminfo", "driverquery /v /fo list", "tasklist /v", "netstat -ano",
    "ipconfig /all", "route print", "arp -a", "nbtstat -n", "net view",
    "net share", "net session", "schtasks /query /fo LIST /v",
    "wevtutil qe System /c:20 /rd:true /f:text",
    "sc query type= service state= all",
    "bcdedit /enum all",
    "dism /online /get-features /format:table",
    "powershell -NoProfile -Command \"$PSVersionTable\"",
    "where powershell",
    "where cmd",
    "set",
    "path",
]


def gen_windows_commands() -> list:
    rows = []

    for cls, props in WIN32_CIM:
        cmd = (
            f'powershell -NoProfile -Command "Get-CimInstance {cls} | '
            f'Select-Object {props}"'
        )
        rows.append(row("windows", "powershell_cim", cmd, f"Inventory {cls}"))

    for alias, props in WMIC_ALIASES:
        cmd = f"cmd /c wmic {alias} get {props}"
        rows.append(row("windows", "wmic", cmd, f"WMIC {alias} inventory"))

    for cls in PS_PNP_CLASSES:
        cmd = (
            f'powershell -NoProfile -Command "Get-PnpDevice -Class {cls} | '
            f'Select-Object Status,Class,FriendlyName,InstanceId"'
        )
        rows.append(row("windows", "powershell_pnp", cmd, f"PnP class {cls}"))

    for i in range(16):
        cmd = (
            f'powershell -NoProfile -Command "Get-PnpDevice | '
            f'Select-Object -First 50 Status,Class,FriendlyName | '
            f'Select-Object -Skip {i * 50} -First 50"'
        )
        rows.append(row("windows", "powershell_pnp", cmd, f"PnP page {i}"))

    for path, note in REG_PATHS:
        cmd = f'cmd /c reg query "{path}"'
        rows.append(row("windows", "registry", cmd, f"Registry read: {note}"))

    for sub in NETSH_SHOW:
        cmd = f"netsh {sub}"
        rows.append(row("windows", "netsh", cmd, f"netsh {sub}"))

    for sub in FSUTIL:
        cmd = f"fsutil {sub}"
        rows.append(row("windows", "fsutil", cmd, f"fsutil {sub}"))

    for sub in CERTUTIL:
        cmd = f"certutil {sub}"
        rows.append(row("windows", "certutil", cmd, f"certutil {sub}"))

    for seq in DISKPART_SEQUENCES:
        cmd = f"echo {seq} | diskpart"
        rows.append(row("windows", "diskpart", cmd, f"DiskPart inspect: {seq.split(chr(10))[0]}"))

    for c in CMD_READONLY:
        rows.append(row("windows", "cmd", f"cmd /c {c}", f"cmd {c.split()[0]}"))

    # PowerShell security / inventory
    ps_security = [
        'Get-MpComputerStatus | Select-Object AMServiceEnabled,AntispywareEnabled,RealTimeProtectionEnabled',
        'Get-MpThreatDetection | Select-Object -First 20',
        'Get-AuthenticodeSignature C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe',
        'Get-ChildItem Cert:\\LocalMachine\\My | Select-Object Subject,Thumbprint,NotAfter',
        'Get-ChildItem Cert:\\LocalMachine\\Root | Select-Object -First 30 Subject,Thumbprint',
        'Get-NetFirewallProfile | Select-Object Name,Enabled',
        'Get-NetFirewallRule -Direction Inbound | Select-Object -First 30 DisplayName,Enabled,Action',
        'Get-NetTCPConnection -State Listen | Select-Object LocalAddress,LocalPort,OwningProcess',
        'Get-NetAdapter | Select-Object Name,Status,LinkSpeed,MacAddress',
        'Get-DnsClientServerAddress | Select-Object InterfaceAlias,ServerAddresses',
        'Get-WinEvent -LogName Security -MaxEvents 20 | Select-Object TimeCreated,Id,Message',
        'Get-LocalUser | Select-Object Name,Enabled,LastLogon',
        'Get-LocalGroup | Select-Object Name,SID',
        'Get-ScheduledTask | Select-Object -First 40 TaskName,State',
        'Get-HotFix | Sort-Object InstalledOn -Descending | Select-Object -First 25',
        'Get-ItemProperty HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion | Select-Object ProductName,BuildLabEx',
        'Get-ComputerInfo | Select-Object CsName,WindowsVersion,OsArchitecture,BiosSerialNumber',
        'Get-Volume | Select-Object DriveLetter,FileSystemLabel,Size,SizeRemaining',
        'Get-Partition | Select-Object DiskNumber,PartitionNumber,Size,Type',
        'Get-Disk | Select-Object Number,FriendlyName,Size,HealthStatus,OperationalStatus',
        'Get-PhysicalDisk | Select-Object FriendlyName,MediaType,Size,HealthStatus',
        'Get-PnpDevice -PresentOnly | Measure-Object',
        'Get-Counter "\\Processor(_Total)\\% Processor Time" -SampleInterval 1 -MaxSamples 3',
        'Get-WmiObject -Class Win32_ComputerSystem | Select-Object Domain,PartOfDomain',
        'Test-NetConnection -ComputerName 127.0.0.1 -Port 445',
        'Resolve-DnsName localhost',
        'Get-SmbShare | Select-Object Name,Path,Description',
        'Get-SmbConnection | Select-Object ServerName,ShareName',
        'Get-Process | Sort-Object WS -Descending | Select-Object -First 25 Name,Id,WS',
        'Get-Service | Where-Object {$_.Status -eq "Running"} | Select-Object -First 40 Name,DisplayName',
    ]
    for ps in ps_security:
        cmd = f'powershell -NoProfile -Command "{ps}"'
        rows.append(row("windows", "powershell_security", cmd, ps[:60]))

    # Pentest-adjacent read-only (lab)
    lab_tools = [
        ("where nmap", "Locate nmap on PATH"),
        ("powershell -NoProfile -Command \"(Get-Command nmap -ErrorAction SilentlyContinue).Source\"", "Resolve nmap"),
        ("cmd /c powershell -NoProfile -Command \"Get-ChildItem Env:\" | Sort-Object Name", "Environment audit"),
    ]
    for cmd, purpose in lab_tools:
        rows.append(row("windows", "lab", cmd, purpose))

    # Variations: pnputil USB/disk classes
    for cls in ["USB", "DiskDrive", "SCSIAdapter", "Net", "Bluetooth"]:
        cmd = f"cmd /c pnputil /enum-devices /class {cls}"
        rows.append(row("windows", "pnputil", cmd, f"pnputil {cls}"))

    rows.extend(_gen_windows_expansion())
    return rows


WIN32_EXTRA = [
    "Win32_Account", "Win32_AccountSID", "Win32_AllocatedResource", "Win32_AssociatedBattery",
    "Win32_AssociatedProcessorMemory", "Win32_BaseService", "Win32_BootConfiguration",
    "Win32_CDROMDrive", "Win32_ClassicCOMClass", "Win32_ClassicCOMApplicationClasses",
    "Win32_ClassicCOMClassSetting", "Win32_ClientApplicationSetting", "Win32_CodecFile",
    "Win32_COMApplication", "Win32_COMApplicationClasses", "Win32_COMClass", "Win32_ComputerSystem",
    "Win32_ComputerSystemProduct", "Win32_COMSetting", "Win32_Desktop", "Win32_DesktopMonitor",
    "Win32_DeviceBus", "Win32_DeviceMemoryAddress", "Win32_DeviceSettings",
    "Win32_Directory", "Win32_DirectoryListing", "Win32_DisplayConfiguration",
    "Win32_DriverVXD", "Win32_Environment", "Win32_FloppyDrive", "Win32_Group",
    "Win32_IDEController", "Win32_IDEControllerDevice", "Win32_ImplementedIDE",
    "Win32_InfraredDevice", "Win32_IniFileSetting", "Win32_InstalledWin32Program",
    "Win32_IP4RouteTable", "Win32_IRQResource", "Win32_Keyboard", "Win32_LoadOrderGroup",
    "Win32_LogicalMemoryConfiguration", "Win32_LogicalProgramGroup", "Win32_LogicalProgramGroupItem",
    "Win32_MappedLogicalDisk", "Win32_MemoryArray", "Win32_MemoryDevice", "Win32_MotherboardDevice",
    "Win32_NetworkClient", "Win32_NetworkConnection", "Win32_NetworkLoginProfile",
    "Win32_NetworkProtocol", "Win32_NTDomain", "Win32_NTEventlogFile", "Win32_NTLogEvent",
    "Win32_OnBoardDevice", "Win32_OperatingSystem", "Win32_PageFile", "Win32_PageFileSetting",
    "Win32_PageFileUsage", "Win32_ParallelPort", "Win32_PerfRawData", "Win32_PhysicalMedia",
    "Win32_PortConnector", "Win32_PortResource", "Win32_POTSModem", "Win32_POTSModemToSerialPort",
    "Win32_PowerManagementEvent", "Win32_PrinterConfiguration", "Win32_PrinterDriver",
    "Win32_PrinterSetting", "Win32_PrintJob", "Win32_Process", "Win32_Processor",
    "Win32_Product", "Win32_QuickFixEngineering", "Win32_QuotaSetting", "Win32_Registry",
    "Win32_SCSIController", "Win32_SerialPort", "Win32_SerialPortConfiguration",
    "Win32_SerialPortSetting", "Win32_Service", "Win32_Share", "Win32_SMBIOSMemory",
    "Win32_SoundDevice", "Win32_StartupCommand", "Win32_SystemAccount", "Win32_SystemBIOS",
    "Win32_SystemDriver", "Win32_SystemEnclosure", "Win32_SystemSlot", "Win32_TapeDrive",
    "Win32_TemperatureProbe", "Win32_Thread", "Win32_TimeZone", "Win32_UninterruptiblePowerSupply",
    "Win32_USBController", "Win32_USBControllerDevice", "Win32_UserDesktop", "Win32_VideoController",
    "Win32_VideoSettings", "Win32_VolumeQuotaSetting", "Win32_WMISetting",
]

EVENT_LOGS = [
    "System", "Application", "Security", "Setup", "Windows PowerShell",
    "Microsoft-Windows-Sysmon/Operational", "Microsoft-Windows-Windows Defender/Operational",
    "Microsoft-Windows-TerminalServices-LocalSessionManager/Operational",
    "Microsoft-Windows-TaskScheduler/Operational", "Microsoft-Windows-PowerShell/Operational",
    "Microsoft-Windows-Kernel-Boot/Operational", "Microsoft-Windows-DNS-Client/Operational",
    "Microsoft-Windows-WLAN-AutoConfig/Operational", "Microsoft-Windows-BitLocker/BitLocker Management",
    "Microsoft-Windows-DeviceSetupManager/Admin", "Microsoft-Windows-GroupPolicy/Operational",
]

PS_CHILD_PATHS = [
    "C:\\Windows\\System32", "C:\\Windows\\System32\\drivers", "C:\\Program Files",
    "C:\\Program Files (x86)", "C:\\Windows\\Logs", "C:\\Windows\\Temp",
    "C:\\ProgramData", "C:\\Users\\Public", "$env:USERPROFILE\\Downloads",
    "$env:USERPROFILE\\Documents", "C:\\Windows\\System32\\WindowsPowerShell\\v1.0",
    "C:\\Windows\\System32\\config", "C:\\Windows\\Panther", "C:\\Windows\\INF",
]

SCHTASK_PATHS = [
    "\\Microsoft\\Windows\\UpdateOrchestrator\\", "\\Microsoft\\Windows\\WindowsUpdate\\",
    "\\Microsoft\\Windows\\Defrag\\", "\\Microsoft\\Windows\\Maintenance\\",
    "\\Microsoft\\Windows\\Application Experience\\", "\\Microsoft\\Windows\\DiskDiagnostic\\",
    "\\Microsoft\\Windows\\Power Efficiency Diagnostics\\",
]

ZIG_BUILD_FLAGS = [
    "-Dstrip=true", "-Dsingle-threaded=true", "-Dcpu=baseline", "-Dcpu=native",
    "-Drelease=true", "-Dtracy=false", "-Dsanitize=address", "-Dsanitize=thread",
    "-Dfuzz=false", "-Ddocs=false", "-Dexamples=true", "-Dtests=true",
    "-Dshared=false", "-Dpie=true", "-Dstatic=true",
]

ZIG_TEST_FILTERS = [
    "hardware", "firmware", "usb", "pci", "network", "parse", "json", "alloc",
    "socket", "windows", "overlay", "ticker", "bench", "factory", "security",
    "hash", "crc", "driver", "ioctl", "registry", "wmi", "zig", "build",
] + [f"test_{i}" for i in range(50)]

SYSCTL_KEYS = [
    "hw.memsize", "hw.ncpu", "hw.physicalcpu", "hw.logicalcpu", "hw.model",
    "hw.machine", "hw.pagesize", "hw.cachelinesize", "hw.l1icachesize", "hw.l1dcachesize",
    "hw.l2cachesize", "hw.l3cachesize", "hw.busfrequency", "hw.cpufrequency",
    "kern.hostname", "kern.osversion", "kern.osrelease", "kern.version", "kern.boottime",
    "kern.maxproc", "kern.maxfiles", "kern.uuid", "kern.ostype", "kern.osproductversion",
    "machdep.cpu.brand_string", "machdep.cpu.core_count", "machdep.cpu.thread_count",
    "net.inet.tcp.mssdflt", "net.inet.udp.maxdgram", "security.mac.sandbox.sentinel",
    "vm.swapusage", "vm.loadavg",
]


def _gen_windows_expansion() -> list:
    rows = []

    for cls in WIN32_EXTRA:
        for props in ("*", "Name,Status", "Caption,Description"):
            cmd = (
                f'powershell -NoProfile -Command "Get-CimInstance {cls} -ErrorAction SilentlyContinue | '
                f'Select-Object -First 30 {props}"'
            )
            rows.append(row("windows", "powershell_cim_extended", cmd, f"{cls} {props}"))

    for log in EVENT_LOGS:
        for count in (10, 20, 50, 100):
            cmd = f'wevtutil qe "{log}" /c:{count} /rd:true /f:text'
            rows.append(row("windows", "eventlog", cmd, f"Event log {log} x{count}"))
            cmd2 = (
                f'powershell -NoProfile -Command "Get-WinEvent -LogName \'{log}\' -MaxEvents {count} '
                f'| Select-Object TimeCreated,Id,ProviderName,Message"'
            )
            rows.append(row("windows", "eventlog_ps", cmd2, f"Get-WinEvent {log}"))

    for path in PS_CHILD_PATHS:
        for limit in (20, 50, 100):
            cmd = (
                f'powershell -NoProfile -Command "Get-ChildItem -Path {path} -ErrorAction SilentlyContinue | '
                f'Select-Object -First {limit} Name,Length,LastWriteTime"'
            )
            rows.append(row("windows", "filesystem", cmd, f"List {path} top {limit}"))

    for base in SCHTASK_PATHS:
        cmd = f'schtasks /query /fo LIST /v /tn "{base}" 2>nul'
        rows.append(row("windows", "schtasks", cmd, f"Scheduled tasks {base}"))

    for drive in "CDEFGHIJKLMNOPQRSTUVWXYZ":
        rows.append(row("windows", "volume", f"cmd /c wmic logicaldisk where DeviceID='{drive}:' get Size,FreeSpace,FileSystem", f"Drive {drive}:"))
        rows.append(row("windows", "volume", f"fsutil fsinfo volumeinfo {drive}:", f"fsutil {drive}:"))

    for port in (22, 80, 135, 139, 443, 445, 3389, 5985, 8080, 8443):
        cmd = (
            f'powershell -NoProfile -Command "Test-NetConnection -ComputerName 127.0.0.1 -Port {port} -WarningAction SilentlyContinue | '
            f'Select-Object ComputerName,RemotePort,TcpTestSucceeded"'
        )
        rows.append(row("windows", "network_test", cmd, f"Local port probe {port}"))

    for user in ("Administrator", "Guest", "DefaultAccount", "WDAGUtilityAccount"):
        cmd = f'powershell -NoProfile -Command "Get-LocalUser -Name {user} -ErrorAction SilentlyContinue"'
        rows.append(row("windows", "local_user", cmd, f"Local user {user}"))

    # WMIC where clauses
    wmic_filters = [
        ("process", "Name='explorer.exe'", "ProcessId,WorkingSetSize"),
        ("service", "State='Running'", "Name,StartMode"),
        ("logicaldisk", "DriveType=3", "DeviceID,Size,FreeSpace"),
        ("networkadapter", "NetEnabled=true", "Name,MACAddress,Speed"),
    ]
    for alias, where, props in wmic_filters:
        cmd = f"cmd /c wmic {alias} where {where} get {props}"
        rows.append(row("windows", "wmic_filter", cmd, f"WMIC {alias} filtered"))

    # PowerShell cmdlet matrix
    ps_cmdlets = [
        ("Get-EventLog -LogName {log} -Newest {n}", "eventlog", "Get-EventLog"),
        ("Get-WmiObject -Class {cls} | Select-Object -First {n}", "wmi_object", "Get-WmiObject"),
        ("Get-Counter '\\Processor(_Total)\\% Processor Time' -SampleInterval 1 -MaxSamples {n}", "perf", "Get-Counter"),
    ]
    for tpl, cat, label in ps_cmdlets:
        if "{log}" in tpl:
            for log in ("System", "Application", "Security"):
                for n in (5, 10, 25, 50):
                    ps = tpl.format(log=log, n=n)
                    rows.append(row("windows", cat, f'powershell -NoProfile -Command "{ps}"', f"{label} {log} {n}"))
        elif "{cls}" in tpl:
            for cls in WIN32_EXTRA[:40]:
                for n in (5, 15, 30):
                    ps = tpl.format(cls=cls, n=n)
                    rows.append(row("windows", cat, f'powershell -NoProfile -Command "{ps}"', f"{label} {cls}"))
        else:
            for n in (1, 3, 5, 10):
                ps = tpl.format(n=n)
                rows.append(row("windows", cat, f'powershell -NoProfile -Command "{ps}"', f"{label} {n}"))

    for idx in range(0, 26):
        drive = chr(ord("A") + idx)
        rows.append(row(
            "windows", "robocopy_list",
            f'cmd /c robocopy {drive}:\\ {drive}:\\ /L /NJH /NJS /NDL /NC /NS /NP 2>nul | head -5',
            f"robocopy list {drive}:",
        ))

    return rows


PROMPT_TEMPLATES = {
    "windows": [
        "On the Windows imaging station, {action}.",
        "Factory bench: {action} for SKU verification.",
        "Run read-only diagnostics — {action}.",
        "Authorized lab host: {action}.",
        "Inventory check: {action}.",
        "Pentest prep (read-only): {action}.",
        "MES ticket HW-042: {action}.",
        "Cyber analysis VM: {action}.",
    ],
    "macos": [
        "On the macOS R&D bench, {action}.",
        "Apple Silicon QA: {action}.",
        "Factory macOS imaging: {action}.",
        "Read-only macOS audit: {action}.",
        "Hardware acceptance: {action}.",
        "Authorized DFIR snapshot: {action}.",
    ],
    "zig": [
        "Cross-compile with Zig: {action}.",
        "Factory firmware tool build: {action}.",
        "Zig pipeline step: {action}.",
        "Native security binary: {action}.",
        "Windows overlay build (Zig): {action}.",
        "CyberGym native repro build: {action}.",
    ],
}


def _prompts_for_platform(platform: str, commands: list) -> list:
    prompts = []
    templates = PROMPT_TEMPLATES[platform]
    for r in commands:
        detail = r["purpose"][:100]
        action = detail[0].lower() + detail[1:] if detail else "run command"
        for tpl in templates:
            prompts.append(prompt_row(platform, r["category"], tpl.format(action=action), r["command"]))
    return prompts


def gen_windows_prompts(commands: list) -> list:
    return _prompts_for_platform("windows", commands)


# --- macOS ---

SP_TYPES = [
    "SPHardwareDataType", "SPMemoryDataType", "SPNetworkDataType", "SPUSBDataType",
    "SPDisplaysDataType", "SPAudioDataType", "SPBluetoothDataType", "SPStorageDataType",
    "SPNVMeDataType", "SPSerialATADataType", "SPThunderboltDataType", "SPFirewallDataType",
    "SPApplicationsDataType", "SPDeveloperToolsDataType", "SPFontsDataType", "SPFrameworksDataType",
    "SPInstallHistoryDataType", "SPLogsDataType", "SPManagedClientDataType", "SPPowerDataType",
    "SPPrefPaneDataType", "SPPrintersDataType", "SPSoftwareDataType", "SPStartupItemDataType",
    "SPSyncServicesDataType", "SPUniversalAccessDataType", "SPAirPortDataType", "SPiBridgeDataType",
    "SPPCIDataType", "SPParallelSCSIDataType", "SPFireWireDataType", "SPCardReaderDataType",
]

IOREG_PATHS = [
    "IOUSB", "IOPower", "IOACPIPlane", "IODeviceTree", "IOService",
    "IOResources", "IOFireWire", "IONetwork", "IOThunderbolt",
]

DISKUTIL = ["list"] + [f"info disk{i}" for i in range(12)] + [
    "info startup-disk", "apfs list", "apfs listUsers", "cs list",
]

SECURITY_CMDS = [
    "csrutil status",
    "spctl --status",
    "codesign -dv --verbose=4 /usr/bin/python3",
    "codesign --verify --verbose /usr/bin/ssh",
    "security list-keychains",
    "security dump-trust-settings",
    "security find-certificate -a -p /Library/Keychains/System.keychain | openssl x509 -noout -subject -dates",
]

OTOOL_NM = [
    "otool -L /usr/bin/ssh",
    "otool -hv /usr/bin/ssh",
    "nm -gU /usr/bin/ssh | head -50",
    "file /usr/bin/ssh",
    "strings /usr/bin/ssh | head -40",
    "lipo -info /usr/bin/ssh",
    "vtool -show-build /usr/bin/ssh",
]


def gen_macos_commands() -> list:
    rows = []

    for sp in SP_TYPES:
        cmd = f"system_profiler {sp}"
        rows.append(row("macos", "system_profiler", cmd, f"Profile {sp}"))
        cmd2 = f"system_profiler {sp} -detailLevel mini"
        rows.append(row("macos", "system_profiler", cmd2, f"Profile {sp} mini"))
        cmd3 = f"system_profiler {sp} | head -120"
        rows.append(row("macos", "system_profiler", cmd3, f"Profile {sp} truncated"))

    for path in IOREG_PATHS:
        cmd = f"ioreg -p {path} -l -w 0 | head -160"
        rows.append(row("macos", "ioreg", cmd, f"IORegistry {path}"))

    for d in DISKUTIL:
        rows.append(row("macos", "diskutil", f"diskutil {d}", f"diskutil {d}"))

    for s in SECURITY_CMDS:
        rows.append(row("macos", "security", s, s.split()[0]))

    for o in OTOOL_NM:
        rows.append(row("macos", "binary_analysis", o, o.split()[0]))

    mac_base = [
        "sw_vers", "uname -a", "hostname", "whoami", "id", "pwd", "date",
        "uptime", "sysctl -n machdep.cpu.brand_string", "sysctl hw.memsize",
        "sysctl hw.ncpu", "sysctl kern.boottime", "pmset -g batt", "pmset -g therm",
        "networksetup -listallhardwareports", "networksetup -getinfo Wi-Fi",
        "ifconfig -a", "netstat -rn", "netstat -an | head -80", "lsof -i -P | head -50",
        "launchctl list | head -60", "defaults read com.apple.finder", "ls -la /Applications | head -40",
        "pkgutil --pkgs | head -80", "pkgutil --pkg-info-plist com.apple.pkg.CLTools_Executables 2>/dev/null || true",
        "xcode-select -p", "xcrun --show-sdk-path", "csrutil status", "fdesetup status",
        "systemextensionsctl list", "profiles list", "scutil --dns", "scutil --nc list",
        "airport -I", "bioutil -r", "nvram -p | head -40", "ioreg -l | grep board-id | head -5",
        "log show --predicate 'eventMessage contains \"error\"' --last 5m --style compact | head -30",
        "mdfind 'kMDItemKind == Application' | head -30", "dscl . -list /Users", "dscl . -read /Users/$(whoami)",
    ]
    for c in mac_base:
        rows.append(row("macos", "shell", c, c.split()[0]))

    # networksetup variations
    for svc in ["Wi-Fi", "Ethernet", "Thunderbolt Bridge", "Bluetooth PAN"]:
        rows.append(row("macos", "networksetup", f"networksetup -getinfo '{svc}'", f"Network {svc}"))

    # defaults domains (read-only sample)
    domains = [
        "com.apple.finder", "com.apple.dock", "com.apple.screensaver",
        "com.apple.loginwindow", "com.apple.SoftwareUpdate",
    ]
    for dom in domains:
        rows.append(row("macos", "defaults", f"defaults read {dom}", f"defaults {dom}"))

    rows.extend(_gen_macos_expansion())
    return rows


LOG_PREDICATES = [
    'process == "kernel"',
    'eventMessage CONTAINS "error"',
    'eventMessage CONTAINS "USB"',
    'eventMessage CONTAINS "disk"',
    'eventMessage CONTAINS "network"',
    'eventMessage CONTAINS "bluetooth"',
    'eventMessage CONTAINS "sleep"',
    'eventMessage CONTAINS "wake"',
    'eventMessage CONTAINS "security"',
    'eventMessage CONTAINS "failed"',
    'subsystem == "com.apple.network"',
    'subsystem CONTAINS "com.apple.driver"',
    'category CONTAINS "firewall"',
]


def _gen_macos_expansion() -> list:
    rows = []

    for key in SYSCTL_KEYS:
        rows.append(row("macos", "sysctl", f"sysctl -n {key}", f"sysctl {key}"))
        rows.append(row("macos", "sysctl", f"sysctl {key}", f"sysctl full {key}"))

    for pred in LOG_PREDICATES:
        for mins in (1, 5, 15, 60):
            cmd = f"log show --predicate '{pred}' --last {mins}m --style compact | head -40"
            rows.append(row("macos", "log_show", cmd, f"log {pred[:30]} {mins}m"))

    for sp in SP_TYPES:
        cmd = f"system_profiler -json {sp} 2>/dev/null | head -c 8000"
        rows.append(row("macos", "system_profiler_json", cmd, f"JSON {sp}"))

    for i in range(20):
        cmd = f"diskutil list | grep -E 'disk{i}|container' | head -20"
        rows.append(row("macos", "diskutil_grep", cmd, f"diskutil disk{i} grep"))

    for svc in ["Wi-Fi", "Ethernet", "Thunderbolt Bridge", "Bluetooth PAN", "iPhone USB", "USB"]:
        for action in ("-getinfo", "-getmedia", "-listallnetworkservices"):
            if action == "-listallnetworkservices":
                continue
            rows.append(row("macos", "networksetup", f"networksetup {action} '{svc}'", f"net {action} {svc}"))

    for app in ("/Applications/Utilities", "/Applications", "/System/Applications", "/usr/bin"):
        cmd = f"ls -la {app} 2>/dev/null | head -60"
        rows.append(row("macos", "filesystem", cmd, f"ls {app}"))

    for uid in range(0, 8):
        rows.append(row("macos", "launchctl", f"launchctl list | grep -E '^{uid}' | head -30", f"launchctl uid {uid}"))

    for cert in ("com.apple.pkg.CLTools_Executables", "com.apple.pkg.Xcode", "com.apple.pkg.Rosetta"):
        rows.append(row("macos", "pkgutil", f"pkgutil --pkg-info {cert} 2>/dev/null", f"pkg {cert}"))

    for target in ("/usr/bin/ssh", "/usr/bin/curl", "/usr/bin/python3", "/sbin/ping"):
        for tool in ("otool -L", "codesign -dv", "file", "stat"):
            rows.append(row("macos", "binary_triage", f"{tool} {target} 2>&1 | head -30", f"{tool} {target}"))

    for sp in SP_TYPES:
        for lines in (40, 80, 120, 200, 400):
            rows.append(row("macos", "system_profiler_head", f"system_profiler {sp} | head -{lines}", f"{sp} head {lines}"))

    for i in range(50):
        rows.append(row("macos", "ioreg_grep", f"ioreg -l | grep -i 'usb|product|vendor' | head -{20 + i}", f"ioreg grep chunk {i}"))

    return rows


def gen_macos_prompts(commands: list) -> list:
    return _prompts_for_platform("macos", commands)


# --- Zig ---

ZIG_TARGETS = [
    "native", "x86_64-windows", "x86_64-windows-gnu", "x86_64-windows-msvc",
    "aarch64-windows-msvc", "x86_64-macos", "aarch64-macos", "x86_64-linux-gnu",
    "aarch64-linux-gnu", "x86_64-linux-musl", "aarch64-linux-musl",
    "wasm32-wasi", "wasm32-freestanding", "riscv64-linux-gnu", "arm-linux-gnueabihf",
    "x86_64-freebsd", "aarch64-freebsd", "x86_64-netbsd", "powerpc64le-linux-gnu",
]

ZIG_BUILD_STEPS = [
    "", "test", "install", "run", "bench",
]

ZIG_MODES = ["Debug", "ReleaseSafe", "ReleaseFast", "ReleaseSmall"]


def gen_zig_commands() -> list:
    rows = []

    base = [
        ("zig version", "Show Zig compiler version"),
        ("zig env", "Show Zig paths and lib directory"),
        ("zig targets", "List all supported compilation targets"),
        ("zig libc", "List bundled libc targets"),
        ("zig ast-check build.zig", "Parse-check build.zig"),
        ("zig fmt --check src/", "Check formatting without write"),
        ("zig fmt src/", "Format Zig sources"),
        ("zig build --help", "Show build.zig steps and options"),
        ("zig build --verbose", "Verbose build log"),
        ("zig build test --summary all", "Run tests with summary"),
        ("zig build run", "Build and run default step"),
        ("zig test src/main.zig", "Test main file"),
        ("zig test src/ --test-filter hardware", "Filtered tests"),
        ("zig run src/main.zig", "Compile and run"),
        ("zig run src/main.zig -OReleaseSafe", "Run optimized safe"),
        ("zig fetch --save git+https://github.com/ziglang/zig#master", "Fetch dep (example)"),
        ("zig init", "Scaffold new project"),
        ("zig init-exe", "Scaffold executable"),
        ("zig init-lib", "Scaffold library"),
        ("zig translate-c --help", "C translation help"),
        ("zig cc --version", "Zig as C compiler driver"),
        ("zig c++ --version", "Zig as C++ driver"),
        ("zig ar --version", "Zig archiver"),
        ("zig ranlib --help", "Ranlib help"),
        ("zig objcopy --help", "objcopy help"),
        ("zig dlltool --help", "dlltool help (Windows)"),
        ("zig windres --help", "Windows resource compiler"),
        ("zig lib --help", "Static lib creation"),
    ]
    for cmd, purpose in base:
        rows.append(row("zig", "toolchain", cmd, purpose))

    for target in ZIG_TARGETS:
        rows.append(row(
            "zig", "cross_compile",
            f"zig build -Dtarget={target}",
            f"Cross-build for {target}",
        ))
        rows.append(row(
            "zig", "cross_compile",
            f"zig build -Dtarget={target} -Doptimize=ReleaseSafe",
            f"ReleaseSafe build {target}",
        ))
        rows.append(row(
            "zig", "cross_compile",
            f"zig build test -Dtarget={target}",
            f"Test on target {target}",
        ))

    for mode in ZIG_MODES:
        rows.append(row(
            "zig", "optimize",
            f"zig build -Doptimize={mode}",
            f"Build {mode}",
        ))
        rows.append(row(
            "zig", "optimize",
            f"zig test src/main.zig -O{mode}",
            f"Test {mode}",
        ))

    for step in ZIG_BUILD_STEPS:
        if step:
            rows.append(row("zig", "build_step", f"zig build {step}", f"build step {step}"))

    # Windows-specific Zig factory / overlay use cases
    win_zig = [
        ("zig build -Dtarget=x86_64-windows-gnu -Doptimize=ReleaseFast", "Windows GNU overlay binary"),
        ("zig build -Dtarget=x86_64-windows-msvc -Doptimize=ReleaseSafe", "Windows MSVC overlay"),
        ("zig build run -Dtarget=x86_64-windows", "Run Windows target build"),
        ("zig test src/ -Dtarget=x86_64-windows -Doptimize=ReleaseSafe", "Windows unit tests"),
        ("zig build -Dstrip=true -Dtarget=x86_64-windows-gnu", "Stripped Windows release"),
        ("zig build -fsanitize=address -Dtarget=x86_64-linux-gnu", "ASAN Linux security build"),
        ("zig build -fsanitize=thread -Doptimize=Debug", "TSAN debug build"),
        ("zig build -Dsingle-threaded=true", "Single-threaded firmware tool"),
        ("zig build -Dcpu=baseline", "Baseline CPU for factory PCs"),
        ("zig build -Dcpu=native", "Native CPU optimizations"),
    ]
    for cmd, purpose in win_zig:
        rows.append(row("zig", "factory", cmd, purpose))

    # macOS zig
    for t in ["x86_64-macos", "aarch64-macos"]:
        for m in ZIG_MODES:
            rows.append(row("zig", "macos_build", f"zig build -Dtarget={t} -Doptimize={m}", f"macOS {t} {m}"))

    # Documentation / introspection
    for i in range(1, 20):
        rows.append(row(
            "zig", "help",
            f"zig build --help 2>&1 | head -{i * 20}",
            f"build help chunk {i}",
        ))

    # Combinations: target x optimize sample
    for target, mode in product(ZIG_TARGETS, ZIG_MODES):
        rows.append(row(
            "zig", "matrix",
            f"zig build -Dtarget={target} -Doptimize={mode}",
            f"Matrix {target} {mode}",
        ))

    for target, flag in product(ZIG_TARGETS[:12], ZIG_BUILD_FLAGS):
        rows.append(row(
            "zig", "build_flags",
            f"zig build -Dtarget={target} {flag}",
            f"{target} {flag}",
        ))

    for filt in ZIG_TEST_FILTERS:
        rows.append(row("zig", "test_filter", f"zig test src/ --test-filter {filt}", f"filter {filt}"))
        rows.append(row("zig", "test_filter", f"zig build test --test-filter {filt}", f"build test {filt}"))

    for target in ZIG_TARGETS:
        rows.append(row("zig", "cc", f"zig cc -target {target} --version", f"zig cc {target}"))
        rows.append(row("zig", "cxx", f"zig c++ -target {target} --version", f"zig c++ {target}"))

    rows.extend(_gen_zig_expansion())
    return rows


ZIG_FILES = ["src/main.zig", "src/root.zig", "src/lib.zig", "build.zig", "build.zig.zon"]


def _gen_zig_expansion() -> list:
    rows = []
    for f in ZIG_FILES:
        rows.append(row("zig", "ast_check", f"zig ast-check {f}", f"ast-check {f}"))
        rows.append(row("zig", "fmt_check", f"zig fmt --check {f}", f"fmt check {f}"))

    for target in ZIG_TARGETS:
        for san in ("address", "thread", "undefined"):
            rows.append(row(
                "zig", "sanitize",
                f"zig build -Dtarget={target} -fsanitize={san}",
                f"sanitize {san} {target}",
            ))

    for n in range(1, 51):
        rows.append(row(
            "zig", "run_args",
            f"zig build run -- {n}",
            f"run with arg {n}",
        ))

    for step in ("install", "uninstall", "docs", "test", "bench", "run", "strip"):
        for target in ZIG_TARGETS[:8]:
            rows.append(row(
                "zig", "build_step_target",
                f"zig build {step} -Dtarget={target}",
                f"step {step} {target}",
            ))

    for target, mode, flag in product(ZIG_TARGETS[8:], ZIG_MODES, ZIG_BUILD_FLAGS[:8]):
        rows.append(row(
            "zig", "triple_matrix",
            f"zig build -Dtarget={target} -Doptimize={mode} {flag}",
            f"{target} {mode} {flag}",
        ))

    return rows


def gen_zig_prompts(commands: list) -> list:
    return _prompts_for_platform("zig", commands)


def main():
    win_cmds = gen_windows_commands()
    mac_cmds = gen_macos_commands()
    zig_cmds = gen_zig_commands()

    win_prompts = gen_windows_prompts(win_cmds)
    mac_prompts = gen_macos_prompts(mac_cmds)
    zig_prompts = gen_zig_prompts(zig_cmds)

    all_commands = win_cmds + mac_cmds + zig_cmds
    all_prompts = win_prompts + mac_prompts + zig_prompts

    stats = write_jsonl(OUT / "windows-commands.jsonl", win_cmds)
    stats += write_jsonl(OUT / "macos-commands.jsonl", mac_cmds)
    stats += write_jsonl(OUT / "zig-commands.jsonl", zig_cmds)
    stats += write_jsonl(OUT / "platform-commands-all.jsonl", all_commands)

    pstats = write_jsonl(OUT / "windows-prompts.jsonl", win_prompts)
    pstats += write_jsonl(OUT / "macos-prompts.jsonl", mac_prompts)
    pstats += write_jsonl(OUT / "zig-prompts.jsonl", zig_prompts)
    pstats += write_jsonl(OUT / "platform-prompts-all.jsonl", all_prompts)

    manifest = {
        "windows_commands": len(win_cmds),
        "macos_commands": len(mac_cmds),
        "zig_commands": len(zig_cmds),
        "total_commands": len(all_commands),
        "total_prompts": len(all_prompts),
        "output_dir": str(OUT.relative_to(ROOT)),
    }
    (OUT / "manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")

    print(json.dumps(manifest, indent=2))
    print(f"Wrote {len(all_commands)} commands and {len(all_prompts)} prompts to {OUT}")


if __name__ == "__main__":
    main()