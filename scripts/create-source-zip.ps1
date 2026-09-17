[CmdletBinding()]
param(
    [string]$OutputPath = "..\MFC-Youth-Area-Management-System-v2.0.4-Revamp-Source.zip"
)

$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$fullOutputPath = [System.IO.Path]::GetFullPath((Join-Path $repoRoot $OutputPath))

Write-Host "Creating clean source ZIP archive..." -ForegroundColor Cyan
Write-Host "Repository root: $repoRoot"
Write-Host "Output ZIP path: $fullOutputPath"

if (Test-Path $fullOutputPath) {
    Remove-Item $fullOutputPath -Force
}

Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

$tempDir = Join-Path ([System.IO.Path]::GetTempPath()) ([System.Guid]::NewGuid().ToString("N"))
New-Item -ItemType Directory -Path $tempDir | Out-Null

try {
    $excludeDirs = @(".git", "bin", "obj", "dist", ".vs", ".idea")
    
    Get-ChildItem -Path $repoRoot -Force | Where-Object {
        $name = $_.Name
        if ($_.PSIsContainer -and ($excludeDirs -contains $name)) {
            return $false
        }
        if ($_.Name.EndsWith(".zip", [System.StringComparison]::OrdinalIgnoreCase)) {
            return $false
        }
        return $true
    } | ForEach-Object {
        Copy-Item -Path $_.FullName -Destination $tempDir -Recurse -Force
    }

    [System.IO.Compression.ZipFile]::CreateFromDirectory($tempDir, $fullOutputPath, [System.IO.Compression.CompressionLevel]::Optimal, $false)
    Write-Host "Successfully generated source ZIP at: $fullOutputPath" -ForegroundColor Green
}
finally {
    if (Test-Path $tempDir) {
        Remove-Item $tempDir -Recurse -Force -ErrorAction SilentlyContinue
    }
}
