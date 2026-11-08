param(
    [Parameter(Mandatory)][string]$PackageRoot,
    [Parameter(Mandatory)][ValidateSet('windows-x64','linux-x64','linux-x64-cuda13-sm89')][string]$ExpectedTarget,
    [Parameter(Mandatory)][string]$ExpectedSource,
    [switch]$SkipExecution
)
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$root = [IO.Path]::GetFullPath($PackageRoot)
$archives = @(Get-ChildItem -LiteralPath $root -File | Where-Object Name -Match ('-' + [regex]::Escape($ExpectedTarget) + '\.(zip|tar\.gz)$'))
if ($archives.Count -ne 1) { throw 'Expected exactly one archive for the selected target' }
$archive = $archives[0]
$expectedDigest = (Get-Content -Raw -LiteralPath ($archive.FullName + '.sha256')).Trim().Split(' ')[0]
if ((Get-FileHash -LiteralPath $archive.FullName -Algorithm SHA256).Hash.ToLowerInvariant() -ne $expectedDigest) { throw 'Archive SHA-256 mismatch' }
$name = $archive.Name -replace '\.(zip|tar\.gz)$',''
$extract = [IO.Path]::GetFullPath((Join-Path $root ('verify-' + $ExpectedTarget)))
if (-not $extract.StartsWith($root + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) { throw 'Extraction escaped the package root' }
if (Test-Path -LiteralPath $extract) { throw 'Use a fresh extraction directory' }
$null = New-Item -ItemType Directory -Path $extract
function Test-Entry([string]$EntryName) {
    if ([IO.Path]::IsPathRooted($EntryName) -or $EntryName.Contains('\') -or $EntryName.Contains(':') -or $EntryName.Split('/') -contains '..' -or -not ($EntryName -eq $name -or $EntryName.StartsWith($name + '/',[StringComparison]::Ordinal))) {
        throw "Unsafe archive entry: $EntryName"
    }
}
if ($archive.Extension -eq '.zip') {
    $zip = [IO.Compression.ZipFile]::OpenRead($archive.FullName)
    try { foreach ($entry in $zip.Entries) { Test-Entry $entry.FullName } }
    finally { $zip.Dispose() }
    Expand-Archive -LiteralPath $archive.FullName -DestinationPath $extract
} else {
    $entries = & tar -tzf $archive.FullName
    if ($LASTEXITCODE -ne 0) { throw 'Cannot list archive' }
    foreach ($entry in $entries) { Test-Entry $entry.TrimEnd('/') }
    $details = & tar -tvzf $archive.FullName
    if ($LASTEXITCODE -ne 0) { throw 'Cannot inspect archive entry types' }
    foreach ($detail in $details) { if ($detail -notmatch '^[-d]') { throw 'Links and special archive entries are forbidden' } }
    & tar -xzf $archive.FullName -C $extract --no-same-owner --no-same-permissions
    if ($LASTEXITCODE -ne 0) { throw 'Archive extraction failed' }
}
$payload = Join-Path $extract $name
$manifest = Get-Content -Raw -LiteralPath (Join-Path $payload 'SOURCE.json') | ConvertFrom-Json
if ($manifest.source_commit -ne $ExpectedSource -or $manifest.target -ne $ExpectedTarget -or $manifest.runtime -ne 'Rust' -or $manifest.python_required -ne $false -or $manifest.refusalbench_tested -ne $false) { throw 'Package identity mismatch' }
$actualFiles = @(Get-ChildItem -LiteralPath $payload -Recurse -File)
if ($actualFiles.Count -ne $manifest.files.Count + 1) { throw 'Unmanifested or missing package files' }
foreach ($file in $manifest.files) {
    $path = [IO.Path]::GetFullPath((Join-Path $payload $file.path))
    if (-not $path.StartsWith($payload + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) { throw 'Manifest path escaped payload' }
    $item = Get-Item -LiteralPath $path
    if ($item.Attributes -band [IO.FileAttributes]::ReparsePoint) { throw 'Linked package file' }
    if ($item.Length -ne $file.bytes -or (Get-FileHash -LiteralPath $path -Algorithm SHA256).Hash.ToLowerInvariant() -ne $file.sha256) { throw "Packaged file mismatch: $($file.path)" }
    if ($item.Extension -eq '.py') { throw 'Unexpected Python runtime file' }
}
if (-not $SkipExecution) {
    $extension = if ($ExpectedTarget -eq 'windows-x64') { '.exe' } else { '' }
    $cli = Join-Path $payload ('abliteration-cli' + $extension)
    $doctorText = & $cli doctor
    if ($LASTEXITCODE -ne 0) { throw 'Extracted CLI doctor failed' }
    $doctor = $doctorText | ConvertFrom-Json
    if ($doctor.build_sha -ne $ExpectedSource -or $doctor.python_required -ne $false -or $doctor.inference_built -ne $true -or $doctor.executable_sha256 -ne (Get-FileHash -LiteralPath $cli -Algorithm SHA256).Hash.ToLowerInvariant()) { throw 'Extracted CLI runtime contract failed' }
    & (Join-Path $payload ('abliteration-studio' + $extension)) --version
    if ($LASTEXITCODE -ne 0) { throw 'GUI command entry point failed' }
    foreach ($config in (Get-ChildItem -LiteralPath (Join-Path $payload 'configs') -Filter '*.toml' -File)) {
        & $cli validate-config $config.FullName | Out-Null
        if ($LASTEXITCODE -ne 0) { throw "Packaged configuration failed: $($config.Name)" }
    }
}
$proof = [ordered]@{schema=1;source_commit=$ExpectedSource;target=$ExpectedTarget;archive_sha256=$expectedDigest;files_verified=$manifest.files.Count;entrypoints_executed=(-not $SkipExecution);model_inference_executed=$false;refusalbench_executed=$false}
[IO.File]::WriteAllText((Join-Path $root ("verification-$ExpectedTarget.json")), ($proof | ConvertTo-Json), [Text.UTF8Encoding]::new($false))
$proof | ConvertTo-Json -Compress
