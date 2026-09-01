# MFC Youth Area Management System Public Beta v2.0.3-beta

v2.0.3-beta is a maintenance and dashboard-improvement release focused on stability, safer startup behavior, clearer error reporting, validation consistency, monthly summary trends, and reliable release packaging.

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
- Databases touched by the earlier dashboard-trend test build are repaired back to schema version 4 only when the exact temporary dashboard-only schema is recognized; core records are not changed by that repair.
- Existing Member, Chapter, Service, Activity Report, GIG, Event, and Event participant data is preserved.
- The installer continues to create a timestamped safety backup when an existing database is found.

## Beta Notice

This release remains part of the Public Beta period. Bugs or unexpected behavior may still be present, and feedback remains useful before the official stable release.
