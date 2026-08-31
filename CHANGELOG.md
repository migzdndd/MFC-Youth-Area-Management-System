# Changelog

## v2.0.3 - Stability, Bug Fixes & Polish

### Stability

- Added a SQLite `PRAGMA quick_check` before database migrations so a damaged database is not migrated blindly.
- Separated database initialization failures from unexpected application runtime failures.
- Added last-resort UI and non-UI exception logging.
- Made dashboard page switching safer so a failed new page does not intentionally discard the currently visible page first.
- Improved local error logs to preserve complete exception and inner-exception details.

### Validation

- Corrected Event participant Middle Initial validation to accept one letter with an optional period.

### Release Engineering

- Synchronized application, assembly, manifest, installer, and build-script versions to `2.0.3`.
- Updated the release build script and installer paths for Public Beta v2.0.3.
- Updated release documentation and supported-version guidance.

### Data

- No schema change is required for v2.0.3. Database schema version remains 4.
- Existing local databases are preserved and continue to migrate through the existing versioned migration path.

## v2.0.2 - Maintenance Update

- Hardened Chapter deletion for upgraded databases.
- Preserved historical Activity Report and Event participant Chapter-name snapshots when a Chapter is removed.
- Rebuilt affected database relationships with `ON DELETE SET NULL` in schema version 4.
- Updated Services **View Members** action styling to blue for clearer visual consistency.

## v2.0.0 - Major Update

### Added

- Redesigned .NET 8 Windows Forms application architecture.
- Custom MFC Youth-inspired dashboard UI and reusable controls.
- Database initialization, schema migration/versioning, and local logging.
- Expanded Member Details and validation workflows.
- Multiple Service assignment management.
- GIG contribution tracking and totals.
- Complete Events management module.
- Event participant registration and payment-status tracking.
- Event attendance and registration-fee summaries.
- Windows x64 self-contained release packaging and GitHub Actions release workflow.

### Changed

- Replaced the previous public-beta source structure with the new maintainable project structure.
- Improved Chapter, Service, Activity Report, and Member workflows.
- Improved navigation, search, dialogs, table styling, DPI behavior, and UI repaint/layout handling.
- Moved runtime database storage to the user's local application-data directory.
- Standardized parameterized SQLite access and repository-based database operations.

### Data

- Database schema version 2 adds Events and Event Participants.
- Existing supported databases are migrated rather than intentionally deleted or replaced.

## v1.0.2-beta

- Added Chapters and Services management.
- Added Member Service assignment workflows and service statistics.
- Improved Member management, validation, dialogs, and SQLite stability.

## v1.0.1-beta

- Improved Activity Reports stability and CRUD behavior.
- Improved database queries, application constants, installer behavior, and code cleanup.

## v1.0.0-beta

- Initial public beta release.
