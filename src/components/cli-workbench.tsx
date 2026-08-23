import { useState } from "react";
import { Check, Copy, Download, MonitorCog, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CXX_NIGHTLY_DOWNLOAD } from "@/lib/utils";

type Platform = "windows" | "linux" | "macos";

const platforms: Array<{ id: Platform; label: string; detail: string }> = [
  { id: "windows", label: "Windows", detail: "PowerShell · MSVC x64" },
  { id: "linux", label: "Linux", detail: "shell · GCC 16 x64" },
  { id: "macos", label: "macOS", detail: "shell · LLVM Apple Silicon" },
];

const commands: Record<Platform, string> = {
  windows: `$base = "${CXX_NIGHTLY_DOWNLOAD}"
$archive = "abliterate-cxx-windows-x64-msvc.zip"
$destination = "abliterate-cxx-1.1.0"
Invoke-WebRequest "$base/SHA256SUMS" -OutFile SHA256SUMS
Invoke-WebRequest "$base/$archive" -OutFile $archive
$expected = ((Select-String -Path SHA256SUMS -Pattern "  $archive$").Line -split "\\s+")[0]
$actual = (Get-FileHash -Algorithm SHA256 $archive).Hash.ToLowerInvariant()
if (!$expected -or $actual -ne $expected) { throw "SHA-256 verification failed" }
if (Test-Path $destination) { throw "$destination already exists; choose a clean destination" }
Expand-Archive $archive -DestinationPath $destination
Set-Location $destination
.\\abliterate-cxx.exe guide
.\\abliterate-cxx.exe doctor
.\\abliterate-cxx.exe limits
.\\abliterate-cxx.exe self-check
.\\abliterate-cxx.exe demo`,
  linux: `base="${CXX_NIGHTLY_DOWNLOAD}"
archive="abliterate-cxx-linux-x64-gcc16.tar.gz"
destination="abliterate-cxx-1.1.0"
curl --fail --location --remote-name "$base/SHA256SUMS"
curl --fail --location --remote-name "$base/$archive"
grep "  $archive$" SHA256SUMS | sha256sum --check --strict -
mkdir "$destination" && tar -xzf "$archive" -C "$destination"
cd "$destination"
./abliterate-cxx guide
./abliterate-cxx doctor
./abliterate-cxx limits
./abliterate-cxx self-check
./abliterate-cxx demo`,
  macos: `base="${CXX_NIGHTLY_DOWNLOAD}"
archive="abliterate-cxx-macos-arm64-llvm.tar.gz"
destination="abliterate-cxx-1.1.0"
curl --fail --location --remote-name "$base/SHA256SUMS"
curl --fail --location --remote-name "$base/$archive"
grep "  $archive$" SHA256SUMS | shasum -a 256 --check -
mkdir "$destination" && tar -xzf "$archive" -C "$destination"
cd "$destination"
./abliterate-cxx guide
./abliterate-cxx doctor
./abliterate-cxx limits
./abliterate-cxx self-check
./abliterate-cxx demo`,
};

export function CliWorkbench() {
  const [platform, setPlatform] = useState<Platform>("windows");
  const [copied, setCopied] = useState(false);
  const selected = platforms.find((candidate) => candidate.id === platform)!;

  async function copyCommands() {
    await navigator.clipboard.writeText(commands[platform]);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2_000);
  }

  return (
    <Card className="overflow-hidden" data-slot="cli-workbench">
      <div className="grid lg:grid-cols-[.72fr_1.28fr]">
        <div className="border-b border-border bg-card p-6 lg:border-b-0 lg:border-r sm:p-8">
          <Badge><MonitorCog aria-hidden="true" /> Quick-start workbench</Badge>
          <h3 className="mt-5 font-display text-2xl font-semibold tracking-tight">From download to verified lab</h3>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Choose your platform. Every path downloads the checksum manifest first, refuses a mismatched archive, and runs the complete Hour 0 safety loop.
          </p>
          <div className="mt-6 grid gap-2" role="group" aria-label="Quick-start platform">
            {platforms.map((candidate) => (
              <Button
                key={candidate.id}
                type="button"
                variant={platform === candidate.id ? "default" : "secondary"}
                className="h-auto justify-start px-4 py-3 text-left"
                aria-pressed={platform === candidate.id}
                onClick={() => {
                  setPlatform(candidate.id);
                  setCopied(false);
                }}
              >
                <span><span className="block">{candidate.label}</span><span className="mt-0.5 block text-[11px] font-medium opacity-70">{candidate.detail}</span></span>
              </Button>
            ))}
          </div>
          <ul className="mt-6 space-y-2 text-xs leading-5 text-muted-foreground">
            <li className="flex gap-2"><Download className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden="true" /> One compiler-labelled artifact; no ambiguous archive names.</li>
            <li className="flex gap-2"><ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden="true" /> SHA-256 must match before extraction.</li>
            <li className="flex gap-2"><Check className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden="true" /> `limits` exposes every pre-allocation guardrail.</li>
          </ul>
        </div>

        <div className="min-w-0 bg-foreground p-5 text-background sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-background/55">{selected.detail}</span>
              <h4 className="mt-1 font-display text-lg font-semibold">Checksum-first commands</h4>
            </div>
            <Button type="button" variant="secondary" size="sm" onClick={copyCommands} aria-label={`Copy ${selected.label} quick-start commands`}>
              {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
              {copied ? "Copied" : "Copy commands"}
            </Button>
          </div>
          <pre className="mt-5 max-h-[32rem] overflow-auto rounded-2xl border border-background/10 bg-black/25 p-4 text-[11px] leading-5 text-background/85" tabIndex={0} aria-label={`${selected.label} quick-start commands`}><code>{commands[platform]}</code></pre>
          <p className="mt-3 text-[11px] leading-5 text-background/55" aria-live="polite">
            {copied ? `${selected.label} commands copied to the clipboard.` : "Review the commands and destination directory before running them."}
          </p>
        </div>
      </div>
    </Card>
  );
}
