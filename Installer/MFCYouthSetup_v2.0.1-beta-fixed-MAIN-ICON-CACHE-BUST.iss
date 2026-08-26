#define MyAppName "MFC Youth Area Management System"
#define MyAppVersion "2.0.1-beta-fixed"
#define MyAppDisplayVersion "Public Beta v2.0.1-fixed"
#define MyAppFileVersion "2.0.1.0"
#define MyAppPublisher "Miguel Riovaldez - MFC Youth NCR Central"
#define MyAppExeName "MFCYouthAreaManagementSystem.exe"
#define MyAppURL "https://github.com/migzdndd/MFC-Youth-Area-Management-System"

[Setup]
; ===========================================================================
; MFC Youth Area Management System
; Public Beta v2.0.1-fixed
; RELEASE-READY SELF-CONTAINED INSTALLER
;
; IMPORTANT:
; This installer expects a SELF-CONTAINED win-x64 publish in:
;   ..\dist\publish-win-x64\
;
; Build with:
; dotnet publish ".\MFC Youth Area Management System.csproj" `
;   -c Release `
;   -r win-x64 `
;   --self-contained true `
;   -p:PublishSingleFile=false `
;   -o ".\dist\publish-win-x64"
; ===========================================================================

; REQUIRED RELEASE BUILD COMMAND:
;
; dotnet publish ".\MFC Youth Area Management System.csproj" `
;   -c Release `
;   -r win-x64 `
;   --self-contained true `
;   -p:SelfContained=true `
;   -p:PublishSingleFile=false `
;   -o ".\dist\publish-win-x64"
;
; IMPORTANT:
; Do NOT compile this installer using a publish folder created with
; --self-contained false.
; The mandatory runtime Source entries below intentionally make compilation
; fail when a framework-dependent build is detected.
; ===========================================================================

; Keep this AppId unchanged across future beta/stable updates.
AppId={{8F7F5A1C-0C9A-4A5E-8F3A-3DDBF5C8A001}

AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppVerName={#MyAppName} {#MyAppDisplayVersion}

AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}/issues
AppUpdatesURL={#MyAppURL}/releases

DefaultDirName={localappdata}\Programs\{#MyAppName}
DefaultGroupName={#MyAppName}

OutputDir=..\dist\installer
OutputBaseFilename=MFCYouthSetup_v2.0.1-beta-fixed-FINAL

Compression=lzma2
SolidCompression=yes

; ---------------------------------------------------------------------------
; Installer UI
; ---------------------------------------------------------------------------
WizardStyle=modern
WizardSizePercent=105
WizardKeepAspectRatio=yes
DefaultDialogFontName=Segoe UI

; Always use the official MFC Youth installer artwork.
SetupIconFile=MFCYouth-Main.ico
WizardImageFile=Resources\WizardImage.png
WizardSmallImageFile=Resources\WizardSmallImage.png
WizardImageBackColor=#132A4A
WizardSmallImageBackColor=#0E6AA7
WizardImageStretch=yes

DisableWelcomePage=no
DisableReadyPage=yes
DisableProgramGroupPage=yes
AllowNoIcons=yes
UsePreviousTasks=no

; ---------------------------------------------------------------------------
; Platform
; ---------------------------------------------------------------------------
PrivilegesRequired=lowest
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
MinVersion=10.0

; ---------------------------------------------------------------------------
; Installer metadata
; ---------------------------------------------------------------------------
VersionInfoVersion={#MyAppFileVersion}
VersionInfoCompany={#MyAppPublisher}
VersionInfoDescription={#MyAppName} {#MyAppDisplayVersion}
VersionInfoProductName={#MyAppName}
VersionInfoProductVersion={#MyAppFileVersion}
VersionInfoCopyright=© 2026 Miguel Riovaldez

UninstallDisplayName={#MyAppName}
UninstallDisplayIcon={app}\MFCYouth-Main.ico

CloseApplications=yes
RestartApplications=no
Uninstallable=yes
SetupLogging=no

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "Create a desktop shortcut"; GroupDescription: "Shortcuts:"; Flags: unchecked

[Files]
; ===========================================================================
; RELEASE PAYLOAD VALIDATION
; ===========================================================================
;
; These entries intentionally make compilation fail if the self-contained
; publish is incomplete. This prevents releasing an installer that asks
; users to install .NET separately.
;

; Main application host and .NET metadata.
Source: "..\dist\publish-win-x64\{#MyAppExeName}"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\dist\publish-win-x64\MFCYouthAreaManagementSystem.runtimeconfig.json"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\dist\publish-win-x64\MFCYouthAreaManagementSystem.deps.json"; DestDir: "{app}"; Flags: ignoreversion

; Required self-contained .NET runtime files.
Source: "..\dist\publish-win-x64\coreclr.dll"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\dist\publish-win-x64\hostfxr.dll"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\dist\publish-win-x64\hostpolicy.dll"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\dist\publish-win-x64\System.Private.CoreLib.dll"; DestDir: "{app}"; Flags: ignoreversion

; Bundle everything else from the self-contained win-x64 publish.
; Files explicitly required above are excluded here so they are packaged once.
Source: "..\dist\publish-win-x64\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs; Excludes: "*.pdb,*.log,Thumbs.db,Desktop.ini,MFCYouthAreaManagementSystem.exe,MFCYouthAreaManagementSystem.runtimeconfig.json,MFCYouthAreaManagementSystem.deps.json,coreclr.dll,hostfxr.dll,hostpolicy.dll,System.Private.CoreLib.dll"

; Official MFC Youth application/installer icon.
Source: "MFCYouth-Main.ico"; DestDir: "{app}"; Flags: ignoreversion

[InstallDelete]
; Remove known obsolete program binaries only.
; User databases are NEVER deleted by the installer.
Type: files; Name: "{app}\MFC Youth Area Management System.exe"
Type: files; Name: "{app}\MFC Youth Area Management System.exe.config"
Type: files; Name: "{app}\MFC Youth Area Management System.pdb"

[Icons]
Name: "{autoprograms}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; WorkingDir: "{app}"; IconFilename: "{app}\MFCYouth-Main.ico"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; WorkingDir: "{app}"; IconFilename: "{app}\MFCYouth-Main.ico"; Tasks: desktopicon

[Run]
Filename: "{app}\{#MyAppExeName}"; Description: "Launch {#MyAppName}"; WorkingDir: "{app}"; Flags: nowait postinstall skipifsilent

[Code]
const
  OldV1DatabaseRelativePath =
    'MFC Youth Database\MFCYouth.db';

  CurrentV2DatabaseRelativePath =
    'MFCYouthAreaManagementSystem\mfcyouth.db';

  BackupRelativeDirectory =
    'MFCYouthAreaManagementSystem\Backups';

procedure InitializeWizard;
begin
  WizardForm.Caption :=
    'MFC Youth Area Management System - Public Beta Setup';

  WizardForm.WelcomeLabel1.Caption :=
    'Welcome to MFC Youth Area Management System';

  WizardForm.WelcomeLabel2.Caption :=
    'Install Public Beta v2.0.1-fixed on this computer.' +
    Chr(13) + Chr(10) + Chr(13) + Chr(10) +
    'This maintenance release includes fixes for Chapter deletion and ' +
    'database relationship handling.' +
    Chr(13) + Chr(10) + Chr(13) + Chr(10) +
    'The required .NET runtime is bundled with this installer. Users do not ' +
    'need to download or install .NET separately.' +
    Chr(13) + Chr(10) + Chr(13) + Chr(10) +
    'MFC Youth Area Management System works offline and stores its ' +
    'application data locally.' +
    Chr(13) + Chr(10) + Chr(13) + Chr(10) +
    'Before updating, Setup will create a safety backup of an existing ' +
    'MFC Youth database whenever one is found.' +
    Chr(13) + Chr(10) + Chr(13) + Chr(10) +
    'Close other applications before continuing.';

  WizardForm.FinishedHeadingLabel.Caption :=
    'Public Beta v2.0.1-fixed is ready';

  WizardForm.FinishedLabel.Caption :=
    'Installation completed successfully.' +
    Chr(13) + Chr(10) + Chr(13) + Chr(10) +
    'VERSION' +
    Chr(13) + Chr(10) +
    'MFC Youth Area Management System Public Beta v2.0.1-fixed' +
    Chr(13) + Chr(10) + Chr(13) + Chr(10) +
    'FIXES INCLUDED' +
    Chr(13) + Chr(10) +
    'This maintenance release improves Chapter deletion and related ' +
    'database foreign-key handling while preserving historical data.' +
    Chr(13) + Chr(10) + Chr(13) + Chr(10) +
    'The required .NET runtime is bundled with this release.' +
    Chr(13) + Chr(10) + Chr(13) + Chr(10) +
    'BETA NOTICE' +
    Chr(13) + Chr(10) +
    'This remains a public testing release. Bugs or unexpected behavior may ' +
    'still be present. Feedback and bug reports are appreciated.' +
    Chr(13) + Chr(10) + Chr(13) + Chr(10) +
    'IMPORTANT FOR EXISTING USERS' +
    Chr(13) + Chr(10) +
    'Your MFC Youth database is stored separately from the installed ' +
    'application files and is not removed by this update.' +
    Chr(13) + Chr(10) +
    'Setup creates a timestamped safety backup before installation.' +
    Chr(13) + Chr(10) + Chr(13) + Chr(10) +
    'Thank you for installing and supporting this project.' +
    Chr(13) + Chr(10) + Chr(13) + Chr(10) +
    '#MFCYouth  #LifeLikeNoOther' +
    Chr(13) + Chr(10) +
    'Miguel Riovaldez' +
    Chr(13) + Chr(10) +
    'Area LIT Servant - NCR Central';
end;

procedure CurPageChanged(CurPageID: Integer);
begin
  if CurPageID = wpSelectTasks then
    WizardForm.NextButton.Caption := SetupMessage(msgButtonInstall)
  else if CurPageID = wpFinished then
    WizardForm.NextButton.Caption := SetupMessage(msgButtonFinish)
  else
    WizardForm.NextButton.Caption := SetupMessage(msgButtonNext);
end;

function BackupDatabaseIfPresent(
  const SourceDatabase: String;
  const BackupPrefix: String
): String;
var
  BackupDirectory: String;
  BackupFile: String;
  TimeStamp: String;
begin
  Result := '';

  if not FileExists(SourceDatabase) then
  begin
    Log('No database found at "' + SourceDatabase + '". Backup not required.');
    Exit;
  end;

  BackupDirectory :=
    AddBackslash(ExpandConstant('{localappdata}')) +
    BackupRelativeDirectory;

  if not ForceDirectories(BackupDirectory) then
  begin
    Result :=
      'Setup found an existing MFC Youth database but could not create the ' +
      'backup directory:' +
      Chr(13) + Chr(10) + Chr(13) + Chr(10) +
      BackupDirectory +
      Chr(13) + Chr(10) + Chr(13) + Chr(10) +
      'Installation has been stopped to protect your data.';
    Exit;
  end;

  TimeStamp := GetDateTimeString('yyyymmdd-hhnnss', '-', ':');

  BackupFile :=
    AddBackslash(BackupDirectory) +
    BackupPrefix + '-' + TimeStamp + '.db';

  Log(
    'Backing up database "' +
    SourceDatabase +
    '" to "' +
    BackupFile +
    '".'
  );

  if not CopyFile(SourceDatabase, BackupFile, False) then
  begin
    Result :=
      'Setup found an existing MFC Youth database but could not create a ' +
      'safety backup:' +
      Chr(13) + Chr(10) + Chr(13) + Chr(10) +
      SourceDatabase +
      Chr(13) + Chr(10) + Chr(13) + Chr(10) +
      'Installation has been stopped to protect your data.';
    Exit;
  end;

  Log('Database backup completed successfully: "' + BackupFile + '".');
end;

function PrepareToInstall(var NeedsRestart: Boolean): String;
var
  OldV1Database: String;
  CurrentV2Database: String;
begin
  Result := '';

  OldV1Database :=
    AddBackslash(ExpandConstant('{localappdata}')) +
    OldV1DatabaseRelativePath;

  CurrentV2Database :=
    AddBackslash(ExpandConstant('{localappdata}')) +
    CurrentV2DatabaseRelativePath;

  Log('Preparing {#MyAppDisplayVersion} installation.');

  Result := BackupDatabaseIfPresent(
    OldV1Database,
    'MFCYouth-v1-before-v2.0.1-fixed'
  );

  if Result <> '' then
    Exit;

  Result := BackupDatabaseIfPresent(
    CurrentV2Database,
    'mfcyouth-v2-before-v2.0.1-fixed'
  );

  if Result <> '' then
    Exit;

  Log('Database backup checks completed. Setup may continue.');
end;
