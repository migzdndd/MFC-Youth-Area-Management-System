# Changelog

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
