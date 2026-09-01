MFC Youth Area Management System v2.0.3-beta - Public Beta Installer

Installer source:
  Installer/MFCYouthSetup_v2.0.3-beta.iss

Required artwork:
  Installer/MFCYouth-Main.ico
  Installer/Resources/WizardImage.png
  Installer/Resources/WizardSmallImage.png

The installer expects a self-contained Windows x64 publish in:
  dist/publish-win-x64/

Recommended build path:
  Run Build-Release.cmd from the repository root.

The release script verifies:
  - ProductVersion 2.0.3-beta
  - FileVersion 2.0.3.0
  - Required self-contained .NET runtime files
  - SQLite.Interop.dll
  - Approved installer artwork hashes

Installer output:
  dist/installer/MFCYouthSetup_v2.0.3-beta.exe
