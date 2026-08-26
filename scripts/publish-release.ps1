param(
    [Parameter(Mandatory = $false)]
    [string]$Version = "2.0.0"
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$project = Join-Path $root "MFC Youth Area Management System.csproj"
$dist = Join-Path $root "dist"
$publish = Join-Path $dist "publish-win-x64"
$safeVersion = $Version.TrimStart('v')
$archiveBase = "MFC-Youth-Area-Management-System-$safeVersion-win-x64"
$zip = Join-Path $dist "$archiveBase.zip"
$sha = Join-Path $dist "$archiveBase.sha256"

if (Test-Path $dist) {
    Remove-Item $dist -Recurse -Force
}
New-Item -ItemType Directory -Path $publish -Force | Out-Null

Write-Host "Restoring packages..."
dotnet restore $project -r win-x64

Write-Host "Publishing self-contained Windows x64 build..."
dotnet publish $project `
    -c Release `
    -r win-x64 `
    --self-contained true `
    -p:PublishProfile=WinX64SelfContained `
    -p:Version=$safeVersion `
    -o $publish `
    --no-restore

$exe = Join-Path $publish "MFCYouthAreaManagementSystem.exe"
if (-not (Test-Path $exe)) {
    throw "Publish failed: MFCYouthAreaManagementSystem.exe was not produced."
}

$sqliteInterop = Get-ChildItem -Path $publish -Recurse -Filter "SQLite.Interop.dll" -ErrorAction SilentlyContinue
if (-not $sqliteInterop) {
    Write-Warning "SQLite.Interop.dll was not found by name. Test the published app on a clean Windows x64 machine before releasing."
}

Copy-Item (Join-Path $root "README.md") (Join-Path $publish "README.txt") -Force
Copy-Item (Join-Path $root "CHANGELOG.md") (Join-Path $publish "CHANGELOG.txt") -Force

Write-Host "Creating release archive..."
Compress-Archive -Path (Join-Path $publish "*") -DestinationPath $zip -CompressionLevel Optimal -Force

$hash = (Get-FileHash -Algorithm SHA256 -Path $zip).Hash.ToLowerInvariant()
"$hash  $archiveBase.zip" | Set-Content -Path $sha -Encoding ascii

Write-Host ""
Write-Host "Release package created:"
Write-Host "  $zip"
Write-Host "SHA-256:"
Write-Host "  $hash"
