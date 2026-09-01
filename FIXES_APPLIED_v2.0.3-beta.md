# v2.0.3-beta Fixes Applied

This source package applies the release-blocking fixes found during the intensive audit.

- Removed generated/stale build folders from the source package.
- Standardized the public release identity as `v2.0.3-beta` while keeping Windows file/assembly version `2.0.3.0`.
- Kept the version label in the permanent main-shell footer so child pages cannot cover it.
- Kept dashboard monthly trend storage outside the core SQLite database.
- Added malformed trend-history recovery that cannot block the application.
- Kept the core database schema at v4 and hardened recognition of the short-lived dashboard-only v5 schema before repair.
- Removed the obsolete SQLite dashboard snapshot repository.
- Hardened `Build-Release.cmd` PowerShell discovery.
- Added release-script source/version checks and aggressive stale-output cleanup before publishing.
- Restored broad Inno Setup discovery and made the expected installer `MFCYouthSetup_v2.0.3-beta.exe`.
- Version-labeled the Inno Setup window, Add/Remove Programs entry, welcome/finish pages, and output filename.
- Consolidated duplicate publish profiles.

The final Windows `.NET` publish and Inno Setup compilation still need to be run on a Windows development machine with the .NET SDK and Inno Setup 6 installed.
