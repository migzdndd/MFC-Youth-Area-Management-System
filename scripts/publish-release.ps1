param(
    [switch]$SkipInstaller
)

$ErrorActionPreference = 'Stop'

$Root = Split-Path -Parent $PSScriptRoot
$Project = Join-Path $Root 'MFC Youth Area Management System.csproj'
$ReleaseBaseVersion = '2.0.3'
$ReleaseChannel = 'beta.2'
$ReleaseRevision = '2'
$ReleaseVersion = "$ReleaseBaseVersion-$ReleaseChannel"
$ReleaseDisplayVersion = "v$ReleaseVersion"
$PublishDir = Join-Path $Root 'dist\publish-win-x64'
$InstallerDir = Join-Path $Root 'dist\installer'
$InstallerScript = Join-Path $Root ("Installer\MFCYouthSetup_v{0}.iss" -f $ReleaseVersion)
$InstallerExe = Join-Path $InstallerDir ("MFCYouthSetup_v{0}.exe" -f $ReleaseVersion)
$ExpectedProductVersion = $ReleaseVersion
$ExpectedFileVersion = "$ReleaseBaseVersion.$ReleaseRevision"
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
$ProjectAssemblyVersion = [string]$ProjectXml.Project.PropertyGroup.AssemblyVersion
$ProjectFileVersion = [string]$ProjectXml.Project.PropertyGroup.FileVersion
$ProjectInformationalVersion = [string]$ProjectXml.Project.PropertyGroup.InformationalVersion
if ($ProjectVersion -ne $ReleaseVersion) {
    throw "Project Version mismatch. Expected '$ReleaseVersion' but found '$ProjectVersion'."
}
if ($ProjectAssemblyVersion -ne $ExpectedFileVersion) {
    throw "Project AssemblyVersion mismatch. Expected '$ExpectedFileVersion' but found '$ProjectAssemblyVersion'."
}
if ($ProjectFileVersion -ne $ExpectedFileVersion) {
    throw "Project FileVersion mismatch. Expected '$ExpectedFileVersion' but found '$ProjectFileVersion'."
}
if ($ProjectInformationalVersion -ne $ReleaseVersion) {
    throw "Project InformationalVersion mismatch. Expected '$ReleaseVersion' but found '$ProjectInformationalVersion'."
}

$ManifestPath = Join-Path $Root 'Properties\app.manifest'
$ManifestText = Get-Content -LiteralPath $ManifestPath -Raw
if ($ManifestText -notmatch [regex]::Escape("assemblyIdentity version=`"$ExpectedFileVersion`"")) {
    throw "Application manifest version does not match $ExpectedFileVersion."
}

$ConstantsPath = Join-Path $Root 'Utilities\ApplicationConstants.cs'
$ConstantsText = Get-Content -LiteralPath $ConstantsPath -Raw
$ExpectedAppVersionNumberLine = 'public const string AppVersionNumber = "{0}";' -f $ReleaseBaseVersion
$ExpectedReleaseChannelLine = 'public const string ReleaseChannel = "{0}";' -f $ReleaseChannel
if ($ConstantsText -notmatch [regex]::Escape($ExpectedAppVersionNumberLine) -or
    $ConstantsText -notmatch [regex]::Escape($ExpectedReleaseChannelLine)) {
    throw "ApplicationConstants.cs does not identify the expected $ReleaseDisplayVersion release."
}

$DatabaseConfigurationPath = Join-Path $Root 'Database\DatabaseConfiguration.cs'
$DatabaseConfigurationText = Get-Content -LiteralPath $DatabaseConfigurationPath -Raw
if ($DatabaseConfigurationText -notmatch [regex]::Escape('"MFCYouthAreaManagementSystem"') -or
    $DatabaseConfigurationText -notmatch [regex]::Escape('"mfcyouth.db"')) {
    throw 'Application database location is not the canonical MFCYouthAreaManagementSystem\mfcyouth.db path.'
}

$DatabaseInitializerPath = Join-Path $Root 'Database\DatabaseInitializer.cs'
$DatabaseInitializerText = Get-Content -LiteralPath $DatabaseInitializerPath -Raw
if ($DatabaseInitializerText -notmatch [regex]::Escape('MigrateLegacyDatabaseIfNeeded();') -or
    $DatabaseInitializerText -notmatch [regex]::Escape('"MFC Youth Database", "MFCYouth.db"')) {
    throw 'Legacy database preservation check is missing from application startup.'
}

$DatabaseMigratorPath = Join-Path $Root 'Database\DatabaseMigrator.cs'
$DatabaseMigratorText = Get-Content -LiteralPath $DatabaseMigratorPath -Raw
if ($DatabaseMigratorText -notmatch [regex]::Escape('public const int CurrentVersion = 5;')) {
    throw 'Database schema version mismatch. v2.0.3-beta.2 expects schema version 5.'
}
if ($DatabaseMigratorText -notmatch [regex]::Escape('ChapterID INTEGER NULL')) {
    throw 'Schema v5 nullable Member Chapter migration is missing.'
}

$InstallerText = Get-Content -LiteralPath $InstallerScript -Raw
$ExpectedInstallerVersionLine = '#define MyAppVersion "{0}"' -f $ReleaseVersion
$ExpectedInstallerFileVersionLine = '#define MyAppFileVersion "{0}"' -f $ExpectedFileVersion
if ($InstallerText -notmatch [regex]::Escape($ExpectedInstallerVersionLine)) {
    throw "Installer script version does not match $ReleaseVersion."
}
if ($InstallerText -notmatch [regex]::Escape($ExpectedInstallerFileVersionLine)) {
    throw "Installer numeric file version does not match $ExpectedFileVersion."
}
if ($InstallerText -notmatch [regex]::Escape('OutputBaseFilename=MFCYouthSetup_v{#MyAppVersion}')) {
    throw 'Installer output filename is not derived from MyAppVersion.'
}
if ($InstallerText -notmatch [regex]::Escape('VersionInfoProductTextVersion={#MyAppVersion}')) {
    throw 'Installer textual product version is not derived from MyAppVersion.'
}

$ExpectedInstallFolderDefine = '#define MyAppInstallFolder "MFCYouthAreaManagementSystem"'
$ExpectedInstallDirectoryLine = 'DefaultDirName={localappdata}\Programs\{#MyAppInstallFolder}'
if ($InstallerText -notmatch [regex]::Escape($ExpectedInstallFolderDefine)) {
    throw 'Installer canonical application folder is not MFCYouthAreaManagementSystem.'
}
if ($InstallerText -notmatch [regex]::Escape($ExpectedInstallDirectoryLine)) {
    throw 'Installer DefaultDirName does not target the canonical MFCYouthAreaManagementSystem folder.'
}
if ($InstallerText -notmatch [regex]::Escape('UsePreviousAppDir=no')) {
    throw 'Installer must ignore previously remembered incorrect install directories for this corrective release.'
}
if ($InstallerText -notmatch [regex]::Escape('DisableDirPage=yes')) {
    throw 'Installer destination page must remain disabled so the canonical application directory cannot drift.'
}

$ExpectedLegacyDatabasePath = "'MFC Youth Database\MFCYouth.db'"
$ExpectedCurrentDatabasePath = "'MFCYouthAreaManagementSystem\mfcyouth.db'"
$ExpectedBackupDirectory = "'MFCYouthAreaManagementSystem\Backups'"
foreach ($ExpectedInstallerDataText in @(
    $ExpectedLegacyDatabasePath,
    $ExpectedCurrentDatabasePath,
    $ExpectedBackupDirectory,
    'EnsureCanonicalDatabaseLocation('
)) {
    if ($InstallerText -notmatch [regex]::Escape($ExpectedInstallerDataText)) {
        throw "Installer database preservation logic is incomplete: $ExpectedInstallerDataText"
    }
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
    $ActualProductVersion = ([string]$VersionInfo.ProductVersion).Trim()
    $ActualFileVersion = ([string]$VersionInfo.FileVersion).Trim()
    Write-Host "ProductVersion: $ActualProductVersion"
    Write-Host "FileVersion:    $ActualFileVersion"

    if ($ActualProductVersion -ne $ExpectedProductVersion) {
        throw "Unexpected ProductVersion. Expected '$ExpectedProductVersion' but got '$ActualProductVersion'. This usually means the publish output is stale or the project version is inconsistent."
    }
    if ($ActualFileVersion -ne $ExpectedFileVersion) {
        throw "Unexpected FileVersion. Expected '$ExpectedFileVersion' but got '$ActualFileVersion'."
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

            $InstallerVersionInfo = $InstallerInfo.VersionInfo
            $ActualInstallerFileVersion = ([string]$InstallerVersionInfo.FileVersion).Trim()
            if ($ActualInstallerFileVersion -ne $ExpectedFileVersion) {
                throw "Installer FileVersion mismatch. Expected '$ExpectedFileVersion' but got '$ActualInstallerFileVersion'."
            }

            Write-Host "Installer FileVersion: $ActualInstallerFileVersion"
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
