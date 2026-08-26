param(
    [switch]$SkipInstaller
)

$ErrorActionPreference = 'Stop'

$Root = Split-Path -Parent $PSScriptRoot
$Project = Join-Path $Root 'MFC Youth Area Management System.csproj'
$PublishDir = Join-Path $Root 'dist\publish-win-x64'
$InstallerDir = Join-Path $Root 'dist\installer'
$InstallerScript = Join-Path $Root 'installer\MFCYouthSetup_v2.0.1-beta-fixed.iss'
$InstallerExe = Join-Path $InstallerDir 'MFCYouthSetup_v2.0.1-beta-fixed.exe'
$ExpectedProductVersion = '2.0.1-beta-fixed'
$ExpectedFileVersion = '2.0.1.0'
$ExpectedWizardImageSha256 = '386868F2B8CB81FE472AB5C7BE1AF393244865E14008B307C5F242AADE13262E'
$ExpectedWizardSmallImageSha256 = 'ED7CE7DAFF211408049B4E53BDE90B58B2AE5AF4BCA17B9BDFDE13883515CD3E'

Write-Host '=== MFC Youth Area Management System v2.0.1-beta-fixed ===' -ForegroundColor Cyan
Write-Host 'Building a self-contained Windows x64 release...' -ForegroundColor Cyan

$WizardImage = Join-Path $Root 'installer\Resources\WizardImage.png'
$WizardSmallImage = Join-Path $Root 'installer\Resources\WizardSmallImage.png'

foreach ($ImagePath in @($WizardImage, $WizardSmallImage)) {
    if (-not (Test-Path $ImagePath)) {
        throw "Required installer artwork is missing: $ImagePath"
    }
}

$WizardHash = (Get-FileHash $WizardImage -Algorithm SHA256).Hash
$WizardSmallHash = (Get-FileHash $WizardSmallImage -Algorithm SHA256).Hash
if ($WizardHash -ne $ExpectedWizardImageSha256) {
    throw 'WizardImage.png is not the approved MFC Youth installer image.'
}
if ($WizardSmallHash -ne $ExpectedWizardSmallImageSha256) {
    throw 'WizardSmallImage.png is not the approved MFC Youth installer image.'
}
Write-Host 'Installer artwork verification: OK' -ForegroundColor Green


Push-Location $Root
try {
    Remove-Item (Join-Path $Root 'bin') -Recurse -Force -ErrorAction SilentlyContinue
    Remove-Item (Join-Path $Root 'obj') -Recurse -Force -ErrorAction SilentlyContinue
    Remove-Item $PublishDir -Recurse -Force -ErrorAction SilentlyContinue
    Remove-Item $InstallerExe -Force -ErrorAction SilentlyContinue

    dotnet restore $Project -r win-x64
    if ($LASTEXITCODE -ne 0) { throw 'dotnet restore failed.' }

    dotnet publish $Project `
        -c Release `
        -r win-x64 `
        --self-contained true `
        -p:SelfContained=true `
        -p:PublishSelfContained=true `
        -p:PublishSingleFile=false `
        -p:PublishTrimmed=false `
        -o $PublishDir `
        --no-restore
    if ($LASTEXITCODE -ne 0) { throw 'dotnet publish failed.' }

    $Exe = Join-Path $PublishDir 'MFCYouthAreaManagementSystem.exe'
    if (-not (Test-Path $Exe)) {
        throw "Published executable was not found: $Exe"
    }

    $VersionInfo = (Get-Item $Exe).VersionInfo
    Write-Host "ProductVersion: $($VersionInfo.ProductVersion)"
    Write-Host "FileVersion:    $($VersionInfo.FileVersion)"

    if ($VersionInfo.ProductVersion -ne $ExpectedProductVersion) {
        throw "Unexpected ProductVersion. Expected '$ExpectedProductVersion' but got '$($VersionInfo.ProductVersion)'."
    }

    if ($VersionInfo.FileVersion -ne $ExpectedFileVersion) {
        throw "Unexpected FileVersion. Expected '$ExpectedFileVersion' but got '$($VersionInfo.FileVersion)'."
    }

    $RuntimeFiles = @(
        'coreclr.dll',
        'hostfxr.dll',
        'hostpolicy.dll',
        'System.Private.CoreLib.dll'
    )

    foreach ($RuntimeFile in $RuntimeFiles) {
        $RuntimePath = Join-Path $PublishDir $RuntimeFile
        if (-not (Test-Path $RuntimePath)) {
            throw "Self-contained runtime verification failed. Missing: $RuntimeFile"
        }
    }

    $SQLiteInterop = Get-ChildItem $PublishDir -Recurse -Filter 'SQLite.Interop.dll' -ErrorAction SilentlyContinue | Select-Object -First 1
    if (-not $SQLiteInterop) {
        throw 'SQLite native runtime verification failed. SQLite.Interop.dll was not found in the publish output.'
    }

    Write-Host 'Self-contained .NET runtime verification: OK' -ForegroundColor Green
    Write-Host "SQLite native runtime: $($SQLiteInterop.FullName)" -ForegroundColor Green

    if (-not $SkipInstaller) {
        $IsccCandidates = @(
            "$env:ProgramFiles(x86)\Inno Setup 6\ISCC.exe",
            "$env:ProgramFiles\Inno Setup 6\ISCC.exe"
        ) | Where-Object { $_ -and (Test-Path $_) }

        if ($IsccCandidates.Count -gt 0) {
            $Iscc = $IsccCandidates[0]
            Write-Host "Compiling installer with: $Iscc" -ForegroundColor Cyan
            & $Iscc $InstallerScript
            if ($LASTEXITCODE -ne 0) { throw 'Inno Setup compilation failed.' }

            if (-not (Test-Path $InstallerExe)) {
                throw "Installer compilation completed but the expected installer was not found: $InstallerExe"
            }

            Write-Host "Installer ready: $InstallerExe" -ForegroundColor Green
        }
        else {
            Write-Warning 'Inno Setup 6 was not found. Publish succeeded, but installer compilation was skipped.'
            Write-Host "Compile manually: $InstallerScript"
        }
    }
    else {
        Write-Host 'Installer compilation skipped by request.' -ForegroundColor Yellow
    }

    Write-Host ''
    Write-Host 'Release build completed successfully.' -ForegroundColor Green
    Write-Host "Publish folder: $PublishDir"
}
finally {
    Pop-Location
}
