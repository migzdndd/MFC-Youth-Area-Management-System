# MFC Youth Area Management System Public Beta v2.0.3-beta.1

v2.0.3-beta.1 is a stability revision of the v2.0.3 Public Beta release focused on stability, safer startup behavior, clearer error reporting, validation consistency, monthly summary trends, and reliable release packaging.

## beta.1 Revision

- Standardizes the visible application label as `v2.0.3-beta.1`.
- Uses Windows assembly/file version `2.0.3.1`.
- Synchronizes the release script and Inno Setup installer with the beta.1 identity.
- Keeps database schema version 4 unchanged; no new application features are introduced.

## Improvements

- Runs a SQLite integrity check before database migration.
- Distinguishes database startup failures from unexpected runtime/UI failures.
- Logs complete exception details, including nested exceptions.
- Corrects Middle Initial validation for Event participants.
- Synchronizes version metadata across the project, executable, manifest, installer, and release script.
- Adds month-over-month Dashboard Summary trend indicators for Members, Chapters, Services, Activity Reports, and Events.
- Uses green upward indicators for increases, red downward indicators for decreases, and neutral text when totals are unchanged or a previous-month baseline is not yet available.

## Data Safety

- No database schema change is introduced. Schema version remains 4.
- Dashboard trend history is stored separately from the core SQLite database so an optional UI feature cannot block database startup.
- Databases touched by the earlier dashboard-trend test build are automatically repaired back to schema version 4 without changing core records.
- Existing Member, Chapter, Service, Activity Report, GIG, Event, and Event participant data is preserved.
- The installer continues to create a timestamped safety backup when an existing database is found.

## Beta Notice

This release remains part of the Public Beta period. Bugs or unexpected behavior may still be present, and feedback remains useful before the official stable release.
