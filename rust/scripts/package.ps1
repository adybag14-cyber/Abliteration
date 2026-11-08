param(
    [Parameter(Mandatory)]
    [ValidateSet('windows-x64', 'linux-x64', 'linux-x64-cuda13-sm89')]
    [string]$Target,
    [Parameter(Mandatory)]
    [ValidatePattern('^(development|[0-9a-f]{40})$')]
    [string]$SourceCommit,
    [string]$BinaryDirectory = 'target/release',
    [string]$OutputRoot = 'artifacts/rust-package',
    [string]$DoctorJson
)
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$repoRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
if ($SourceCommit -ne 'development') {
    & git -C $repoRoot diff --quiet HEAD
    if ($LASTEXITCODE -ne 0) { throw 'Release packaging requires unchanged committed source' }
}
$rustTriple = if ($Target -eq 'windows-x64') { 'x86_64-pc-windows-msvc' } else { 'x86_64-unknown-linux-gnu' }
$cargoFeatures = if ($Target -eq 'linux-x64-cuda13-sm89') { 'gui,cuda' } else { 'gui' }
$metadataText = & cargo +1.99.1 metadata --locked --format-version 1 --features $cargoFeatures --filter-platform $rustTriple --manifest-path (Join-Path $repoRoot 'Cargo.toml')
if ($LASTEXITCODE -ne 0) { throw 'Cargo metadata failed' }
$metadata = $metadataText | ConvertFrom-Json
$package = @($metadata.packages | Where-Object name -eq 'abliteration-lab')
if ($package.Count -ne 1) { throw 'Ambiguous Rust package identity' }
$version = $package[0].version
if ($version -notmatch '^\d+\.\d+\.\d+(?:-[A-Za-z0-9.]+)?$') { throw 'Invalid package version' }
$outputDirectory = [IO.Path]::GetFullPath($(if ([IO.Path]::IsPathRooted($OutputRoot)) { $OutputRoot } else { Join-Path $repoRoot $OutputRoot }))
$name = "abliteration-studio-$version-$Target"
$stage = [IO.Path]::GetFullPath((Join-Path $outputDirectory $name))
if (-not $stage.StartsWith($outputDirectory + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) { throw 'Staging path escaped output root' }
if (Test-Path -LiteralPath $stage) { throw 'Staging directory already exists; use a fresh candidate directory' }
$null = New-Item -ItemType Directory -Path $stage
$binaryRoot = [IO.Path]::GetFullPath($(if ([IO.Path]::IsPathRooted($BinaryDirectory)) { $BinaryDirectory } else { Join-Path $repoRoot $BinaryDirectory }))
$suffix = if ($Target -eq 'windows-x64') { '.exe' } else { '' }
foreach ($binaryName in @('abliteration-cli', 'abliteration-studio')) {
    $source = Join-Path $binaryRoot ($binaryName + $suffix)
    if (-not (Test-Path -LiteralPath $source -PathType Leaf)) { throw "Missing binary: $source" }
    $destination = Join-Path $stage ($binaryName + $suffix)
    Copy-Item -LiteralPath $source -Destination $destination
    if (-not $IsWindows) {
        [IO.File]::SetUnixFileMode($destination, [IO.UnixFileMode]::UserRead -bor [IO.UnixFileMode]::UserWrite -bor [IO.UnixFileMode]::UserExecute -bor [IO.UnixFileMode]::GroupRead -bor [IO.UnixFileMode]::GroupExecute -bor [IO.UnixFileMode]::OtherRead -bor [IO.UnixFileMode]::OtherExecute)
    }
}
$cli = Join-Path $stage ('abliteration-cli' + $suffix)
if ($DoctorJson) {
    $doctor = Get-Content -Raw -LiteralPath $DoctorJson | ConvertFrom-Json
} else {
    $doctorText = & $cli doctor
    if ($LASTEXITCODE -ne 0) { throw 'Packaged CLI doctor failed' }
    $doctor = $doctorText | ConvertFrom-Json
}
if ($doctor.version -ne $version -or $doctor.build_sha -ne $SourceCommit -or $doctor.runtime -ne 'Rust' -or $doctor.python_required -ne $false -or $doctor.inference_built -ne $true) {
    throw 'Packaged binary identity or runtime contract differs from the release'
}
$cliDigest = (Get-FileHash -LiteralPath $cli -Algorithm SHA256).Hash.ToLowerInvariant()
if ($doctor.executable_sha256 -ne $cliDigest) { throw 'Doctor receipt is not bound to this CLI binary' }
if ($Target -eq 'linux-x64-cuda13-sm89' -and $doctor.cuda_built -ne $true) { throw 'CUDA artifact lacks the CUDA backend' }
Copy-Item -LiteralPath (Join-Path $repoRoot 'rust/configs') -Destination (Join-Path $stage 'configs') -Recurse
Copy-Item -LiteralPath (Join-Path $repoRoot 'rust/README.md') -Destination (Join-Path $stage 'README.md')
foreach ($file in @('LICENSE', 'Cargo.lock', 'rust-toolchain.toml')) {
    Copy-Item -LiteralPath (Join-Path $repoRoot $file) -Destination (Join-Path $stage $file)
}
$null = New-Item -ItemType Directory -Path (Join-Path $stage 'provenance')
Copy-Item -LiteralPath (Join-Path $repoRoot 'data/models/lfm3-1.7b.json') -Destination (Join-Path $stage 'provenance/model-lock.json')
Copy-Item -LiteralPath (Join-Path $repoRoot 'data/benchmarks/lfm3-benign.json') -Destination (Join-Path $stage 'provenance/benign-sources.json')
Copy-Item -LiteralPath (Join-Path $repoRoot 'sources/research/lfm3-benchmarks-2026-11.json') -Destination (Join-Path $stage 'provenance/benchmark-catalog.json')
$notices = Join-Path $stage 'third-party-licenses'
$null = New-Item -ItemType Directory -Path $notices
$licenseChoices = Get-Content -Raw -LiteralPath (Join-Path $repoRoot 'rust/license-choices.json') | ConvertFrom-Json
Copy-Item -LiteralPath (Join-Path $repoRoot 'rust/license-choices.json') -Destination (Join-Path $stage 'LICENSE-CHOICES.json')
$dependencyRows = [Collections.Generic.List[object]]::new()
foreach ($dependency in ($metadata.packages | Sort-Object name, version)) {
    $dependencyRoot = Split-Path -Parent $dependency.manifest_path
    $selectedLicense = $null
    $choices = @($licenseChoices.choices | Where-Object { $_.package -eq $dependency.name -and $_.version -eq $dependency.version })
    if ($choices.Count -gt 1) { throw 'Ambiguous dependency license selection' }
    if ($choices.Count -eq 1) {
        $choice = $choices[0]
        if ($dependency.license -ne $choice.offered) { throw 'Upstream license expression changed' }
        if ((Get-FileHash -LiteralPath (Join-Path $dependencyRoot $choice.license_file) -Algorithm SHA256).Hash.ToLowerInvariant() -ne $choice.license_sha256) { throw 'Selected license text changed' }
        $selectedLicense = $choice.selected
    }
    $licenseFiles = @(Get-ChildItem -LiteralPath $dependencyRoot -File | Where-Object Name -Match '^(LICENSE|COPYING|COPYRIGHT|NOTICE)([._-].*)?$')
    if ($licenseFiles.Count -eq 0 -and $dependency.source -and $dependency.source.StartsWith('git+')) {
        $licenseFiles = @(Get-ChildItem -LiteralPath (Split-Path -Parent $dependencyRoot) -File | Where-Object Name -Match '^(LICENSE|COPYING|COPYRIGHT|NOTICE)([._-].*)?$')
    }
    $destination = Join-Path $notices ("$($dependency.name)-$($dependency.version)")
    if ($licenseFiles.Count -gt 0) {
        $null = New-Item -ItemType Directory -Path $destination -Force
        foreach ($licenseFile in $licenseFiles) {
            if ($licenseFile.Length -gt 2MB) { throw 'Unexpectedly large license file' }
            if ($licenseFile.Attributes -band [IO.FileAttributes]::ReparsePoint) { throw 'Linked license files are not copied into releases' }
            Copy-Item -LiteralPath $licenseFile.FullName -Destination (Join-Path $destination $licenseFile.Name)
        }
    }
    $dependencyRows.Add([ordered]@{name=$dependency.name;version=$dependency.version;license=$dependency.license;selected_license=$selectedLicense;repository=$dependency.repository})
}
[IO.File]::WriteAllText((Join-Path $stage 'DEPENDENCIES.json'), ($dependencyRows | ConvertTo-Json -Depth 5), [Text.UTF8Encoding]::new($false))
$files = @(Get-ChildItem -LiteralPath $stage -Recurse -File | Sort-Object FullName | ForEach-Object {
    if ($_.Attributes -band [IO.FileAttributes]::ReparsePoint) { throw 'Linked package files are forbidden' }
    if ($_.Extension -eq '.py') { throw 'Python runtime files must not be shipped in the native toolkit' }
    [ordered]@{path=[IO.Path]::GetRelativePath($stage,$_.FullName).Replace('\','/');bytes=$_.Length;sha256=(Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256).Hash.ToLowerInvariant()}
})
$manifest = [ordered]@{
    schema=1; version=$version; target=$Target; source_commit=$SourceCommit; runtime='Rust'; python_required=$false
    engine_revision=$doctor.engine_revision; cargo_lock_sha256=(Get-FileHash -LiteralPath (Join-Path $repoRoot 'Cargo.lock') -Algorithm SHA256).Hash.ToLowerInvariant()
    inference_built=$doctor.inference_built; cuda_built=$doctor.cuda_built; refusalbench_tested=$false; files=$files
}
[IO.File]::WriteAllText((Join-Path $stage 'SOURCE.json'), ($manifest | ConvertTo-Json -Depth 8), [Text.UTF8Encoding]::new($false))
$archive = Join-Path $outputDirectory ($name + $(if ($Target -eq 'windows-x64') { '.zip' } else { '.tar.gz' }))
if (Test-Path -LiteralPath $archive) { throw 'Release archive already exists; published candidates are immutable' }
if ($Target -eq 'windows-x64') {
    Compress-Archive -LiteralPath $stage -DestinationPath $archive -CompressionLevel Optimal
} else {
    & tar -czf $archive -C $outputDirectory $name
    if ($LASTEXITCODE -ne 0) { throw 'Archive creation failed' }
}
$digest = (Get-FileHash -LiteralPath $archive -Algorithm SHA256).Hash.ToLowerInvariant()
[IO.File]::WriteAllText(($archive + '.sha256'), ("$digest  $([IO.Path]::GetFileName($archive))" + [char]10), [Text.UTF8Encoding]::new($false))
[ordered]@{archive=$archive;sha256=$digest;files=$files.Count;source_commit=$SourceCommit} | ConvertTo-Json -Compress
