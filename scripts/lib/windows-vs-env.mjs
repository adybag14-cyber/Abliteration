import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

/** Return an owned environment enriched by the latest Visual Studio C++ developer shell. */
export function windowsVisualStudioEnvironment(baseEnvironment = process.env) {
  const environment = { ...baseEnvironment };
  if (process.platform !== "win32" || (environment.INCLUDE && environment.LIB)) return environment;

  const vswhereCandidates = [
    join(environment["ProgramFiles(x86)"] || "C:\\Program Files (x86)", "Microsoft Visual Studio", "Installer", "vswhere.exe"),
    join(environment.ProgramFiles || "C:\\Program Files", "Microsoft Visual Studio", "Installer", "vswhere.exe"),
  ];
  const vswhere = vswhereCandidates.find(existsSync);
  if (!vswhere) return environment;

  const located = spawnSync(vswhere, [
    "-latest",
    "-products", "*",
    "-requires", "Microsoft.VisualStudio.Component.VC.Tools.x86.x64",
    "-property", "installationPath",
  ], { encoding: "utf8", env: environment, windowsHide: true });
  const installation = located.status === 0 ? located.stdout.trim() : "";
  const developerCommand = join(installation, "Common7", "Tools", "VsDevCmd.bat");
  if (!installation || !existsSync(developerCommand)) return environment;

  const targetArchitecture = process.arch === "arm64" ? "arm64" : "x64";
  const command = `call "${developerCommand}" -no_logo -arch=${targetArchitecture} -host_arch=x64 >nul && set`;
  const commandProcessor = environment.ComSpec || "C:\\Windows\\System32\\cmd.exe";
  const systemRoot = environment.SystemRoot || environment.windir || "C:\\Windows";
  // VsDevCmd is a batch program and can exceed cmd.exe's line limit when it
  // inherits a workstation PATH with many developer tools. Bootstrap it from
  // the small Windows core environment, then merge its owned output below.
  const bootstrapEnvironment = {
    SystemRoot: systemRoot,
    windir: systemRoot,
    ComSpec: commandProcessor,
    ProgramData: environment.ProgramData || "C:\\ProgramData",
    ProgramFiles: environment.ProgramFiles || "C:\\Program Files",
    "ProgramFiles(x86)": environment["ProgramFiles(x86)"] || "C:\\Program Files (x86)",
    USERPROFILE: environment.USERPROFILE,
    TEMP: environment.TEMP,
    TMP: environment.TMP,
    PROCESSOR_ARCHITECTURE: environment.PROCESSOR_ARCHITECTURE,
    PATHEXT: environment.PATHEXT,
    VSCMD_SKIP_SENDTELEMETRY: "1",
    Path: [
      join(systemRoot, "System32"),
      systemRoot,
      join(systemRoot, "System32", "Wbem"),
      join(systemRoot, "System32", "WindowsPowerShell", "v1.0"),
    ].join(";"),
  };
  const result = spawnSync(commandProcessor, ["/d", "/s", "/c", command], {
    encoding: "utf8",
    env: bootstrapEnvironment,
    windowsHide: true,
    windowsVerbatimArguments: true,
  });
  if (result.status !== 0) {
    if (environment.ABLITERATE_DEBUG_VS_ENV === "1")
      process.stderr.write(`VsDevCmd bootstrap failed (${result.status ?? "spawn"}): ${result.error?.message || result.stderr || result.stdout || "unknown error"}\n`);
    return environment;
  }

  const originalPathKey = Object.keys(environment).find((key) => key.toLowerCase() === "path") || "Path";
  const originalPath = environment[originalPathKey] || "";
  for (const line of result.stdout.split(/\r?\n/)) {
    const separator = line.indexOf("=");
    if (separator <= 0) continue;
    environment[line.slice(0, separator)] = line.slice(separator + 1);
  }
  const developerPathKey = Object.keys(environment).find((key) => key.toLowerCase() === "path") || "Path";
  environment[developerPathKey] = `${originalPath};${environment[developerPathKey] || ""}`;
  return environment;
}
