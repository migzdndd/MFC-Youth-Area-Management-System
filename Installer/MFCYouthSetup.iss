#define MyAppName "MFC Youth Area Management System"
#define MyAppVersion "2.1.0"
#define MyAppDisplayVersion "v2.1.0"
#define MyAppPublisher "Missionary Families for Christ - MFC Youth"
#define MyAppExeName "MFCYouthAreaManagementSystem.exe"
#define MyAppURL "https://github.com/migzdndd/MFC-Youth-Area-Management-System"

[Setup]
; ===========================================================================
; MFC Youth Area Management System
; Inno Setup Installer Script for Windows Desktop Release
; ===========================================================================
AppId={{5E97D453-6598-4B86-A065-C626DE58444B}}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppVerName={#MyAppName} {#MyAppDisplayVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
AppUpdatesURL={#MyAppURL}
DefaultDirName={autopf}\MFC Youth Area Management System
DisableProgramGroupPage=yes
DefaultGroupName={#MyAppName}
OutputDir=..\dist-installer
OutputBaseFilename=MFCYouthSetup_{#MyAppVersion}
Compression=lzma2/ultra64
SolidCompression=yes
WizardStyle=modern
ArchitecturesInstallIn64BitMode=x64compatible
PrivilegesRequired=lowest
SetupIconFile=..\MFCYouth.ico
UninstallDisplayIcon={app}\{#MyAppExeName}

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked

[Files]
; Dist output directory from Electron / Desktop packaging
Source: "..\dist\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{group}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; IconFilename: "{app}\MFCYouth.ico"
Name: "{group}\{cm:UninstallProgram,{#MyAppName}}"; Filename: "{uninstallexe}"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; Tasks: desktopicon; IconFilename: "{app}\MFCYouth.ico"

[Run]
Filename: "{app}\{#MyAppExeName}"; Description: "{cm:LaunchProgram,{#StringChange(MyAppName, '&', '&&')}}"; Flags: nowait postinstall skipifsilent
