#define MyAppName "MFC Youth Area Management System"
#define MyAppVersion "Public Beta v1.0.1"
#define MyAppFileVersion "1.0.1.0"
#define MyAppPublisher "Miguel Riovaldez - MFC Youth NCR Central"
#define MyAppExeName "MFC Youth Area Management System.exe"

[Setup]
AppId={{8F7F5A1C-0C9A-4A5E-8F3A-3DDBF5C8A001}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppVerName=MFC Youth Area Management System Public Beta v1.0.1
InfoBeforeFile=Resources\BetaNotice.txt

AppPublisher={#MyAppPublisher}
AppPublisherURL=https://github.com/migzdndd/MFC-Youth-Area-Management-System
AppSupportURL=https://github.com/migzdndd/MFC-Youth-Area-Management-System/issues
AppUpdatesURL=https://github.com/migzdndd/MFC-Youth-Area-Management-System/releases

DefaultDirName={localappdata}\Programs\{#MyAppName}
DefaultGroupName={#MyAppName}

OutputDir=D:\data\Self Projects\MFC Youth Database Management App\Application\Beta Releases
OutputBaseFilename=MFCYouthSetup_v1.0.1-beta

Compression=lzma2
CompressionThreads=auto
SolidCompression=yes
WizardStyle=modern

PrivilegesRequired=lowest

ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible

SetupIconFile=MFCYouth.ico

VersionInfoVersion={#MyAppFileVersion}
VersionInfoCompany={#MyAppPublisher}
VersionInfoDescription={#MyAppName}
VersionInfoProductName={#MyAppName}
VersionInfoCopyright=© 2026 Miguel Riovaldez

UninstallDisplayIcon={app}\{#MyAppExeName}

DisableProgramGroupPage=yes

SetupLogging=no

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "Create a desktop shortcut"; GroupDescription: "Additional icons:"; Flags: unchecked

[Files]
; Main application
Source: "..\bin\Release\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs; Excludes: "*.pdb,*.xml,*.vshost.exe,*.config.bak,.gitignore,Thumbs.db,Desktop.ini,*.log"

[Icons]
Name: "{autoprograms}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"

Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; Tasks: desktopicon

[Run]
Filename: "{app}\{#MyAppExeName}"; Description: "Launch {#MyAppName}"; Flags: nowait postinstall skipifsilent
