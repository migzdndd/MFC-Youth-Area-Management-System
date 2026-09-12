# MFC Youth Area Management System v2.0.3-beta.2

## Public Beta Checkpoint

This release packages the completed Windows-side mobile compatibility work together with the first four Web → Offline feature-parity implementations. The application remains an offline-first Windows desktop app; this is not an Android or iOS installer.

## Highlights

- Completed responsive and DPI-aware Mobile Access Phases 1–4.
- Added a dedicated read-only Member Details view.
- Added GIG contribution total and history to Member Details.
- Expanded Member search across name, email, contact number, Chapter, and assigned Service.
- Added combined Status and Chapter filters plus Clear Filters.
- Strengthened Add/Edit Member validation and duplicate Contact/Email checks.
- Added support for Members with no assigned Chapter.
- Added a searchable multi-select **+ Add Members** workflow from Chapters.
- Preserved existing Activity Report type improvements and Upcoming/Past Events behavior.

## Database

- SQLite schema advances from **v4 to v5**.
- `Member.ChapterID` is now nullable so a Member can be registered before Chapter assignment.
- The migration preserves existing Member IDs, Chapter assignments, Member-Service assignments, GIG contributions, Reports, Events, Event participants, and timestamps.
- Existing databases remain stored at `%LOCALAPPDATA%\MFCYouthAreaManagementSystem\mfcyouth.db`.
- The installer creates a timestamped database safety backup before updating when an existing database is found.

## Release Engineering

- Application version: `2.0.3-beta.2`
- Windows Assembly/File version: `2.0.3.2`
- Installer: `MFCYouthSetup_v2.0.3-beta.2.exe`
- Target: self-contained `win-x64` / .NET 8 Windows Forms

## Audit Cleanup

- Removed the stale unused `DashboardSnapshotRepository` that referenced the retired `DashboardMonthlySnapshot` table.
- Hardened two nullable code paths in Event grid formatting and Activity Report PDF rendering.
- Release source package excludes local `.vs`, `bin`, `obj`, and `dist` build artifacts.

## Known Scope

The web/PWA/cloud synchronization and account system are not part of this release. Mobile compatibility here refers to the responsive Windows UI and preparation for later remote/web/mobile access.
