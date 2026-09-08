# Changelog

## In Development - Reports & Analytics Improvements

### Reports & Analytics Phase 1

- Added combined Search, Chapter, Report Type, and Period filtering for Activity Reports.
- Added live summary cards for matching reports, current-month reports, represented chapters, and represented report types.
- Kept report filtering compatible with historical/custom report types already stored in SQLite.

### Reports & Analytics Phase 2

- Added a six-month Activity Report volume chart that follows the active filters.
- Added Report Type distribution analytics for the most common report categories in the selected results.
- Added Chapter activity comparison analytics for the most active Chapters in the selected results.
- Implemented the analytics charts with lightweight custom WinForms drawing and no new third-party dependency.
- Kept database schema version 4 unchanged; the analytics are calculated from existing Activity Report records.

### Reports & Analytics Phase 3

- Added **Export PDF** to Activity Reports, exporting the exact records matched by the active Search, Chapter, Report Type, and Period filters.
- Added a professional multi-page PDF layout with MFC Youth branding, export scope, live summary metrics, a six-month analytics snapshot, top Report Types, and top Chapters.
- Included every exported report's Date, Title, Chapter, Report Type, Prepared By, Activity, and Description with automatic text wrapping and pagination.
- Added `Ctrl+Shift+E` as the Activity Reports PDF-export shortcut.
- Kept PDF generation fully offline by using the Windows built-in **Microsoft Print to PDF** printer instead of adding another NuGet/runtime dependency.
- Kept database schema version 4 unchanged; PDF export is read-only and does not modify stored records.

### Reports & Analytics Phase 4

- Polished Activity Reports action states so Edit/Delete require a selected row, Export PDF requires matching results, and Clear Filters is only active when filters are applied.
- Added a dedicated "No Reports Match These Filters" empty state while preserving the original first-report empty state.
- Improved Report Type and Chapter analytics with percentage values and clearer top-results captions while keeping calculations tied to the full filtered dataset.
- Hardened PDF export completion detection for the Windows PDF print driver.
- Improved PDF pagination with continued-section headings and protection against orphaned Activity/Description labels.
- Kept application version `2.0.3-beta.1`, database schema version 4, package dependencies, and installer configuration unchanged.

## v2.0.3-beta.1 - Stability Revision & Release Label Repair

### Release Engineering

- Standardized the public application version as `v2.0.3-beta.1`.
- Updated Windows assembly/file version metadata to `2.0.3.1`.
- Synchronized the application footer, manifest, release build script, installer script, installer filename, and installer backup labels.
- Removed stale generated build output and obsolete release configuration files from the source package.
- Kept database schema version 4 unchanged and added no new application features.

### Source Audit

- Revalidated the existing v2.0.3 stability fixes, historical Chapter preservation, search escaping/debouncing, dashboard trend storage, and database relationship checks.
- Removed the unused `DashboardSnapshotRepository` that referenced the retired `DashboardMonthlySnapshot` table.

## v2.0.3-beta - Stability, Bug Fixes & Dashboard Trends

### Stability

- Added a SQLite `PRAGMA quick_check` before database migrations so a damaged database is not migrated blindly.
- Separated database initialization failures from unexpected application runtime failures.
- Added last-resort UI and non-UI exception logging.
- Made dashboard page switching safer so a failed new page does not intentionally discard the currently visible page first.
- Improved local error logs to preserve complete exception and inner-exception details.

### Validation

- Corrected Event participant Middle Initial validation to accept one letter with an optional period.

### Dashboard

- Added month-over-month trend indicators to the Dashboard Summary for Members, Chapters, Services, Activity Reports, and Events.
- Positive net changes display a green upward indicator; negative net changes display a red downward indicator.
- Unchanged totals and the initial tracking month use a neutral state rather than fabricated historical data.

### Release Engineering

- Synchronized application, assembly, manifest, installer, and build-script versions to `2.0.3-beta` for the public release identity while retaining numeric file version `2.0.3.0`.
- Updated the release build script and installer paths for Public Beta v2.0.3-beta.
- Updated release documentation and supported-version guidance.

### Data

- Dashboard trend history is stored in a small local support file and does not change the SQLite schema.
- Database schema remains version 4; existing Member, Chapter, Service, Activity Report, GIG, Event, and Event participant records are untouched.
- If the earlier dashboard-trend test build marked a database as schema 5, startup repairs it only after confirming that it exactly matches that temporary dashboard-only schema; otherwise the database is left untouched and treated as newer.

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

### Installer path correction
- Restored the canonical per-user installation directory to `%LOCALAPPDATA%\Programs\MFCYouthAreaManagementSystem`.
- Prevented Inno Setup from reusing the incorrect remembered folder `%LOCALAPPDATA%\Programs\MFC Youth Area Management System`.
- The database location remains `%LOCALAPPDATA%\MFCYouthAreaManagementSystem\mfcyouth.db` and is not stored inside the program installation directory.
- Added release validation so future installer builds fail if the canonical install folder drifts again.
