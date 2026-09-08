MFC Youth Area Management System v2.0.3-beta.1 - Public Beta Installer

Installer source:
  Installer/MFCYouthSetup_v2.0.3-beta.1.iss

Required artwork:
  Installer/MFCYouth-Main.ico
  Installer/Resources/WizardImage.png
  Installer/Resources/WizardSmallImage.png

The installer expects a self-contained Windows x64 publish in:
  dist/publish-win-x64/

Recommended build path:
  Run Build-Release.cmd from the repository root.

The release script verifies:
  - ProductVersion 2.0.3-beta.1
  - FileVersion 2.0.3.1
  - Required self-contained .NET runtime files
  - SQLite.Interop.dll
  - Approved installer artwork hashes

Installer output:
  dist/installer/MFCYouthSetup_v2.0.3-beta.1.exe
