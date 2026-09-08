# v2.0.3-beta.1 Fixes Applied

This source package applies the release-blocking fixes found during the intensive audit.

- Removed generated/stale build folders from the source package.
- Standardized the public release identity as `v2.0.3-beta.1` while keeping Windows file/assembly version `2.0.3.1`.
- Kept the version label in the permanent main-shell footer so child pages cannot cover it.
- Kept dashboard monthly trend storage outside the core SQLite database.
- Added malformed trend-history recovery that cannot block the application.
- Kept the core database schema at v4 and hardened recognition of the short-lived dashboard-only v5 schema before repair.
- Removed the obsolete SQLite dashboard snapshot repository.
- Hardened `Build-Release.cmd` PowerShell discovery.
- Added release-script source/version checks and aggressive stale-output cleanup before publishing.
- Restored broad Inno Setup discovery and made the expected installer `MFCYouthSetup_v2.0.3-beta.1.exe`.
- Version-labeled the Inno Setup window, Add/Remove Programs entry, welcome/finish pages, and output filename.
- Consolidated duplicate publish profiles.

The final Windows `.NET` publish and Inno Setup compilation still need to be run on a Windows development machine with the .NET SDK and Inno Setup 6 installed.

## 2026-09-08 Stability & Consistency Pass

No new application features were added in this pass. The existing v2.0.3-beta functionality was hardened and released as the beta.1 stability revision.

- Kept Chapter name snapshots synchronized on Chapter rename so later deletion does not make historical Reports or Event registrations revert to an older Chapter name.
- Allowed historical Activity Reports and Event registrations to be edited without forcing a replacement Chapter/Service after the original record has been deleted.
- Preserved historical Chapter/Service snapshot labels when those detached records are edited.
- Kept dashboard month snapshots current when Members, Chapters, Activity Reports, or Events are added/deleted, while keeping trend tracking optional and outside the core database.
- Discarded stale dashboard trend history when a newly replaced local database can be detected.
- Prevented failed list/detail refreshes from leaving previously loaded information visible as though it were current.
- Added a short search debounce to avoid re-querying SQLite on every keystroke while the user is still typing.
- Escaped literal `%`, `_`, and `\\` characters in search text so they are searched as characters instead of unintended SQL wildcards.
- Tightened GIG contribution deletion so the contribution must belong to the Member currently being viewed.
- Added a post-migration foreign-key relationship check at startup.
- Standardized Escape/Cancel behavior on remaining editor dialogs.
- Disposed replaced dynamic WinForms controls instead of only detaching them.
- Cleared Mode of Payment when a participant is saved as Not Paid, preventing contradictory payment records.
- Removed dead dashboard/theme code, stale generated build output, the obsolete installer script, and the duplicate publish profile from the source package.

### Installer path correction
- Restored the canonical per-user installation directory to `%LOCALAPPDATA%\Programs\MFCYouthAreaManagementSystem`.
- Prevented Inno Setup from reusing the incorrect remembered folder `%LOCALAPPDATA%\Programs\MFC Youth Area Management System`.
- The database location remains `%LOCALAPPDATA%\MFCYouthAreaManagementSystem\mfcyouth.db` and is not stored inside the program installation directory.
- Added release validation so future installer builds fail if the canonical install folder drifts again.

## Installer data-location correction

- Restored the installer behavior using the v2.0.1 final-release script as the compatibility reference.
- Program files now use the fixed `MFCYouthAreaManagementSystem` installation folder instead of deriving the folder name from the display title.
- The database remains at `%LOCALAPPDATA%\MFCYouthAreaManagementSystem\mfcyouth.db`.
- Before updating, Setup backs up both the legacy v1 and current v2 database locations.
- If the current v2 database is missing but the legacy v1 database still exists, Setup copies the legacy database into the canonical v2 location instead of allowing a new empty database to be created.
- Existing current databases are never overwritten by this recovery step.
