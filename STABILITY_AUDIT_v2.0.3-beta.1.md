# v2.0.3-beta.1 Stability Audit

Baseline for this pass: `Source-Code-2.0.3-beta,1.zip`, inspected and corrected on 2026-09-08.

## Changes applied

- Synchronized project, assembly, file, informational, manifest, installer, and release-script versions to the v2.0.3-beta.1 release identity while retaining numeric file version 2.0.3.1.
- Added `PRAGMA quick_check` before database migration to stop startup when SQLite reports integrity problems.
- Separated database-initialization failures from application runtime failures.
- Added last-resort WinForms UI exception logging and non-UI exception logging.
- Improved application logs to preserve full exception and inner-exception details.
- Made dashboard page switching safer by keeping the current page until the next page is shown successfully.
- Corrected Event participant Middle Initial validation to one letter with an optional period.
- Updated installer, README, changelog, security guidance, and release notes for Public Beta v2.0.3-beta.1.
- Removed obsolete installer-script ignore rules so current installer source can be tracked normally.
- Fixed Chapter rename/delete snapshot consistency for historical Activity Reports and Event participants.
- Allowed preserved historical records to be edited without forcing reassignment after their original Chapter or Service is gone.
- Added foreign-key relationship validation after migration.
- Debounced live searches, escaped literal search wildcards, and prevented stale list data from remaining visible after failed refreshes.
- Improved monthly trend capture after total-changing operations and added stale trend-history detection when the database file is replaced.
- Tightened GIG deletion ownership checks, payment-state consistency, dialog Cancel behavior, and dynamic-control disposal.
- Removed obsolete dashboard/theme code and stale source-package/release-profile artifacts.

## Database validation performed

The migration SQL was executed against temporary SQLite databases using the same schema statements from `DatabaseMigrator.cs`.

- v1 migration: success
- v2 migration: success
- v3 migration: success
- v4 migration: success
- `PRAGMA quick_check`: `ok`
- `PRAGMA foreign_key_check`: no violations in the Chapter-delete preservation scenario
- Historical Activity Report Chapter snapshot preserved after Chapter deletion
- Historical Event participant Chapter snapshot preserved after Chapter deletion

Database schema version remains **4**. v2.0.3-beta.1 does not introduce a schema migration.

## Release validation performed

- No TODO/FIXME/NotImplementedException markers found in active C#, PowerShell, or current installer source.
- Project, manifest, and publish-profile XML parse successfully.
- All 56 statically extractable repository SQL statements prepare successfully against the final schema v4.
- Gross delimiter validation completed across all active C# source files after the fixes.
- Cleaned source package contains 93 files and no `bin`, `obj`, `dist`, `.vs`, `.git`, EXE, DLL, or PDB build artifacts.
- Installer artwork SHA-256 values match the hashes expected by the release build script.
- Current release metadata is consistently set to `2.0.3-beta.1` / `2.0.3.1` in active release files.
- Release tooling clears stale publish/installer output before building and validates project, assembly, file, informational, manifest, installer public/numeric versions, executable runtime, SQLite native files, installer artwork, and final installer output.
- Inno Setup output filename and installer safety-backup labels derive from the `MyAppVersion` macro to reduce future version-label drift.
- Dashboard trend JSON corruption is recoverable and cannot block core database startup.

## Build validation limitation

A Windows/.NET build was not executed in the ChatGPT execution environment because the .NET SDK, PowerShell, and Inno Setup compiler are not installed there.

Before publishing the release, run `Build-Release.cmd` on the Windows development machine. The script is configured to verify the executable version, self-contained .NET runtime files, SQLite native runtime, approved installer artwork, and installer output.
