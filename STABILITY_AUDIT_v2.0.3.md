# v2.0.3 Stability Audit

Baseline: Public Beta v2.0.2 source package uploaded on 2026-08-29.

## Changes applied

- Synchronized project, assembly, file, informational, manifest, installer, and release-script versions to 2.0.3.
- Added `PRAGMA quick_check` before database migration to stop startup when SQLite reports integrity problems.
- Separated database-initialization failures from application runtime failures.
- Added last-resort WinForms UI exception logging and non-UI exception logging.
- Improved application logs to preserve full exception and inner-exception details.
- Made dashboard page switching safer by keeping the current page until the next page is shown successfully.
- Corrected Event participant Middle Initial validation to one letter with an optional period.
- Updated installer, README, changelog, security guidance, and release notes for Public Beta v2.0.3.
- Removed obsolete installer-script ignore rules so current installer source can be tracked normally.

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

Database schema version remains **4**. v2.0.3 does not introduce a schema migration.

## Release validation performed

- No TODO/FIXME/NotImplementedException markers found in active C#, PowerShell, or current installer source.
- `git diff --check` reports no whitespace errors in the working changes.
- Installer artwork SHA-256 values match the hashes expected by the release build script.
- Current release metadata is consistently set to `2.0.3` / `2.0.3.0` in active release files.

## Build validation limitation

A Windows/.NET build was not executed in the ChatGPT execution environment because the .NET SDK, PowerShell, and Inno Setup compiler are not installed there.

Before publishing the release, run `Build-Release.cmd` on the Windows development machine. The script is configured to verify the executable version, self-contained .NET runtime files, SQLite native runtime, approved installer artwork, and installer output.
