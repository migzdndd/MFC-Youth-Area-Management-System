# MFC Youth Area Management System Public Beta v2.0.3

v2.0.3 is a maintenance release focused on stability, safer startup behavior, clearer error reporting, validation consistency, and reliable release packaging.

## Improvements

- Runs a SQLite integrity check before database migration.
- Distinguishes database startup failures from unexpected runtime/UI failures.
- Logs complete exception details, including nested exceptions.
- Corrects Middle Initial validation for Event participants.
- Synchronizes version metadata across the project, executable, manifest, installer, and release script.

## Data Safety

- No database schema change is introduced. Schema version remains 4.
- Existing Member, Chapter, Service, Activity Report, GIG, Event, and Event participant data is preserved.
- The installer continues to create a timestamped safety backup when an existing database is found.

## Beta Notice

This release remains part of the Public Beta period. Bugs or unexpected behavior may still be present, and feedback remains useful before the official stable release.
