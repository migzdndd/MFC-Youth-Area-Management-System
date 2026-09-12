# Stability Audit — v2.0.3-beta.2

## Scope

Release-readiness audit of the offline C# WinForms + SQLite application after Mobile Access Phases 1–4 and Web → Offline parity Implementations 1–4.

## Source / Git Checks

- No unresolved Git merge conflicts found.
- No `<<<<<<<`, `=======`, or `>>>>>>>` merge markers remain in source.
- `git diff --check` reports no whitespace errors that block the release.
- The uploaded baseline was clean against `origin/main` before release-version preparation.
- Local `.vs`, `bin`, `obj`, and `dist` folders are excluded from the release source ZIP.

## Compiler-Related Cleanup

The previous local Release build completed with 0 compiler errors and two CS8602 nullable warnings:

- `Forms/EventsForm.cs` — nullable `CellStyle` access.
- `Utilities/ActivityReportPdfExporter.cs` — nullable `PrintPageEventArgs.Graphics` access.

Both paths are now guarded defensively in the beta.2 source.

A final Windows `dotnet build`/`dotnet publish` must still be run after these release-prep edits because the audit environment does not contain the .NET SDK.

## Database Migration Audit

- Current SQLite schema version: **5**.
- Fresh schema creation through v1 → v5 completed successfully in SQLite simulation.
- Representative schema-v4 data migrated to v5 without losing Members, Chapters, Services, Member-Service assignments, GIG contributions, Activity Reports, Events, or Event participants.
- Existing primary keys and Chapter assignments were preserved.
- `Member.ChapterID` is nullable in schema v5.
- `PRAGMA foreign_key_check` returned no violations after migration.
- Guarded assignment (`WHERE ChapterID IS NULL`) prevents a stale Add Members dialog from silently moving an already-assigned Member.
- The short-lived dashboard-only schema-v5 shape was detected and successfully repaired to v4 before applying the legitimate v5 migration in simulation.

## Repository / SQL Smoke Checks

Representative SQLite smoke tests passed for:

- Member search by name.
- Combined Member Search + Status + Chapter filtering.
- Search by assigned Service.
- Unassigned Member retrieval.
- Chapter member counts.
- Event summary query.
- Activity Report query.
- Chapter rename snapshot synchronization.
- Chapter deletion snapshot preservation after Members are moved/unassigned.

## Release Cleanup

- Removed the unused `DashboardSnapshotRepository` that referenced the retired `DashboardMonthlySnapshot` table.
- Updated active release metadata to `v2.0.3-beta.2` / file version `2.0.3.2`.
- Added the `MFCYouthSetup_v2.0.3-beta.2.iss` installer definition.
- Updated release script guards for SQLite schema v5.
- Updated README, installer documentation, security-support table, changelog, and release notes.

## Scope Note

This release remains an offline-first Windows application. Responsive/mobile-access work refers to compact/DPI-aware Windows UI behavior and preparation for future web/mobile access. Cloud sync, `GlobalID`/`SyncOutbox`, login/accounts, and area isolation are not implemented in this source and are not advertised as beta.2 features.

## Final Local Release Validation Required

Before publishing the GitHub Release, run on Windows:

1. `dotnet build` in Release configuration and confirm 0 errors (preferably 0 warnings).
2. Run `Build-Release.cmd` or `scripts\publish-release.ps1`.
3. Confirm ProductVersion `2.0.3-beta.2` and FileVersion `2.0.3.2`.
4. Install over a copy of an existing schema-v4 user database and verify schema v5 migration.
5. Confirm Member, Chapter, Service, GIG, Report, Event, and participant records remain present.
6. Test the Member read-only View, combined filters, validation, unassigned Member workflow, and compact 760×600 layouts.
