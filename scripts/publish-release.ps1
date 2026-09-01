param(
    [switch]$SkipInstaller
)

$ErrorActionPreference = 'Stop'

$Root = Split-Path -Parent $PSScriptRoot
$Project = Join-Path $Root 'MFC Youth Area Management System.csproj'
$ReleaseBaseVersion = '2.0.3'
$ReleaseVersion = '2.0.3-beta'
$ReleaseDisplayVersion = 'v2.0.3-beta'
$PublishDir = Join-Path $Root 'dist\publish-win-x64'
$InstallerDir = Join-Path $Root 'dist\installer'
$InstallerScript = Join-Path $Root 'Installer\MFCYouthSetup_v2.0.3-beta.iss'
$InstallerExe = Join-Path $InstallerDir 'MFCYouthSetup_v2.0.3-beta.exe'
$ExpectedProductVersion = $ReleaseVersion
$ExpectedFileVersion = "$ReleaseBaseVersion.0"
$ExpectedWizardImageSha256 = '386868F2B8CB81FE472AB5C7BE1AF393244865E14008B307C5F242AADE13262E'
$ExpectedWizardSmallImageSha256 = 'ED7CE7DAFF211408049B4E53BDE90B58B2AE5AF4BCA17B9BDFDE13883515CD3E'

Write-Host ("=== MFC Youth Area Management System {0} ===" -f $ReleaseDisplayVersion) -ForegroundColor Cyan
Write-Host 'Building a clean self-contained Windows x64 release...' -ForegroundColor Cyan

$Dotnet = Get-Command 'dotnet.exe' -ErrorAction SilentlyContinue
if (-not $Dotnet) {
    $Dotnet = Get-Command 'dotnet' -ErrorAction SilentlyContinue
}
if (-not $Dotnet) {
    throw 'The .NET SDK was not found on PATH. Install/repair the .NET 8+ SDK before building the release.'
}

if (-not (Test-Path -LiteralPath $Project)) {
    throw "Project file is missing: $Project"
}
if (-not (Test-Path -LiteralPath $InstallerScript)) {
    throw "Installer script is missing: $InstallerScript"
}

# Guard against accidentally publishing a source tree whose visible/app version
# does not match the intended beta release.
[xml]$ProjectXml = Get-Content -LiteralPath $Project -Raw
$ProjectVersion = [string]$ProjectXml.Project.PropertyGroup.Version
$ProjectFileVersion = [string]$ProjectXml.Project.PropertyGroup.FileVersion
if ($ProjectVersion -ne $ReleaseVersion) {
    throw "Project Version mismatch. Expected '$ReleaseVersion' but found '$ProjectVersion'."
}
if ($ProjectFileVersion -ne $ExpectedFileVersion) {
    throw "Project FileVersion mismatch. Expected '$ExpectedFileVersion' but found '$ProjectFileVersion'."
}

$ConstantsPath = Join-Path $Root 'Utilities\ApplicationConstants.cs'
$ConstantsText = Get-Content -LiteralPath $ConstantsPath -Raw
if ($ConstantsText -notmatch [regex]::Escape('public const string AppVersionNumber = "2.0.3";') -or
    $ConstantsText -notmatch [regex]::Escape('public const string ReleaseChannel = "beta";')) {
    throw 'ApplicationConstants.cs does not identify the expected v2.0.3-beta release.'
}

$InstallerText = Get-Content -LiteralPath $InstallerScript -Raw
if ($InstallerText -notmatch [regex]::Escape('#define MyAppVersion "2.0.3-beta"')) {
    throw 'Installer script version does not match 2.0.3-beta.'
}

$WizardImage = Join-Path $Root 'Installer\Resources\WizardImage.png'
$WizardSmallImage = Join-Path $Root 'Installer\Resources\WizardSmallImage.png'
foreach ($ImagePath in @($WizardImage, $WizardSmallImage)) {
    if (-not (Test-Path -LiteralPath $ImagePath)) {
        throw "Required installer artwork is missing: $ImagePath"
    }
}

$WizardHash = (Get-FileHash -LiteralPath $WizardImage -Algorithm SHA256).Hash
$WizardSmallHash = (Get-FileHash -LiteralPath $WizardSmallImage -Algorithm SHA256).Hash
if ($WizardHash -ne $ExpectedWizardImageSha256) {
    throw 'WizardImage.png is not the approved MFC Youth installer image.'
}
if ($WizardSmallHash -ne $ExpectedWizardSmallImageSha256) {
    throw 'WizardSmallImage.png is not the approved MFC Youth installer image.'
}
Write-Host 'Installer artwork verification: OK' -ForegroundColor Green

Push-Location $Root
try {
    # Never allow an old publish or installer to survive into a new package.
    Remove-Item (Join-Path $Root 'bin') -Recurse -Force -ErrorAction SilentlyContinue
    Remove-Item (Join-Path $Root 'obj') -Recurse -Force -ErrorAction SilentlyContinue
    Remove-Item $PublishDir -Recurse -Force -ErrorAction SilentlyContinue
    New-Item -ItemType Directory -Path $PublishDir -Force | Out-Null
    New-Item -ItemType Directory -Path $InstallerDir -Force | Out-Null
    Get-ChildItem -LiteralPath $InstallerDir -Filter 'MFCYouthSetup_v2.0.3*.exe' -File -ErrorAction SilentlyContinue |
        Remove-Item -Force -ErrorAction SilentlyContinue

    & $Dotnet.Source restore $Project -r win-x64
    if ($LASTEXITCODE -ne 0) { throw 'dotnet restore failed.' }

    & $Dotnet.Source publish $Project `
        -c Release `
        -r win-x64 `
        --self-contained true `
        -p:SelfContained=true `
        -p:PublishSelfContained=true `
        -p:PublishSingleFile=false `
        -p:PublishTrimmed=false `
        -p:DebugSymbols=false `
        -p:DebugType=None `
        -o $PublishDir `
        --no-restore
    if ($LASTEXITCODE -ne 0) { throw 'dotnet publish failed.' }

    $RequiredPublishFiles = @(
        'MFCYouthAreaManagementSystem.exe',
        'MFCYouthAreaManagementSystem.dll',
        'MFCYouthAreaManagementSystem.runtimeconfig.json',
        'MFCYouthAreaManagementSystem.deps.json',
        'coreclr.dll',
        'hostfxr.dll',
        'hostpolicy.dll',
        'System.Private.CoreLib.dll',
        'System.Data.SQLite.dll'
    )
    foreach ($RequiredFile in $RequiredPublishFiles) {
        $RequiredPath = Join-Path $PublishDir $RequiredFile
        if (-not (Test-Path -LiteralPath $RequiredPath)) {
            throw "Release payload verification failed. Missing: $RequiredFile"
        }
    }

    $Exe = Join-Path $PublishDir 'MFCYouthAreaManagementSystem.exe'
    $VersionInfo = (Get-Item -LiteralPath $Exe).VersionInfo
    Write-Host "ProductVersion: $($VersionInfo.ProductVersion)"
    Write-Host "FileVersion:    $($VersionInfo.FileVersion)"

    if ($VersionInfo.ProductVersion -ne $ExpectedProductVersion) {
        throw "Unexpected ProductVersion. Expected '$ExpectedProductVersion' but got '$($VersionInfo.ProductVersion)'. This usually means the publish output is stale or the project version is inconsistent."
    }
    if ($VersionInfo.FileVersion -ne $ExpectedFileVersion) {
        throw "Unexpected FileVersion. Expected '$ExpectedFileVersion' but got '$($VersionInfo.FileVersion)'."
    }

    $SQLiteInterop = Get-ChildItem -LiteralPath $PublishDir -Recurse -Filter 'SQLite.Interop.dll' -File -ErrorAction SilentlyContinue |
        Where-Object { $_.FullName -match '(?i)(x64|win-x64)' } |
        Select-Object -First 1
    if (-not $SQLiteInterop) {
        $SQLiteInterop = Get-ChildItem -LiteralPath $PublishDir -Recurse -Filter 'SQLite.Interop.dll' -File -ErrorAction SilentlyContinue |
            Select-Object -First 1
    }
    if (-not $SQLiteInterop) {
        throw 'SQLite native runtime verification failed. SQLite.Interop.dll was not found in the publish output.'
    }

    Write-Host 'Self-contained .NET runtime verification: OK' -ForegroundColor Green
    Write-Host "SQLite native runtime: $($SQLiteInterop.FullName)" -ForegroundColor Green

    if (-not $SkipInstaller) {
        $IsccCandidates = @(
            "${env:ProgramFiles(x86)}\Inno Setup 6\ISCC.exe",
            "$env:ProgramFiles\Inno Setup 6\ISCC.exe",
            'C:\Program Files (x86)\Inno Setup 6\ISCC.exe',
            'C:\Program Files\Inno Setup 6\ISCC.exe',
            'D:\Program Files\Inno Setup 6\ISCC.exe',
            'D:\Program Files (x86)\Inno Setup 6\ISCC.exe'
        ) | Select-Object -Unique

        $Iscc = $IsccCandidates |
            Where-Object { $_ -and (Test-Path -LiteralPath $_) } |
            Select-Object -First 1

        if (-not $Iscc) {
            $IsccCommand = Get-Command 'ISCC.exe' -ErrorAction SilentlyContinue
            if ($IsccCommand) { $Iscc = $IsccCommand.Source }
        }

        if ($Iscc) {
            Write-Host "Compiling installer with: $Iscc" -ForegroundColor Cyan
            & $Iscc $InstallerScript
            if ($LASTEXITCODE -ne 0) { throw 'Inno Setup compilation failed.' }

            if (-not (Test-Path -LiteralPath $InstallerExe)) {
                throw "Installer compilation completed but the expected installer was not found: $InstallerExe"
            }

            $InstallerInfo = Get-Item -LiteralPath $InstallerExe
            if ($InstallerInfo.LastWriteTime -lt (Get-Date).AddMinutes(-10)) {
                throw 'Installer timestamp is unexpectedly old. Refusing to treat it as the newly built release.'
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
