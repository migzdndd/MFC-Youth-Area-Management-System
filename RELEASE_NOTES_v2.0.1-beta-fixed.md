# MFC Youth Area Management System v2.0.1-beta-fixed

## Maintenance Fix Release

This release keeps the v2.0 feature set and applies fixes for Chapter deletion, database relationship handling, version metadata, and deployment.

### Fixed

- Fixed Chapter deletion failures caused by historical foreign-key references.
- Activity Reports keep their Chapter name snapshot when a Chapter is deleted.
- Event participant registrations keep their Chapter name snapshot when a Chapter is deleted.
- Database schema version 4 repairs the affected relationships with `ON DELETE SET NULL`.
- Chapter deletion explicitly detaches historical records before removing the Chapter.
- Application version metadata now reports `2.0.1-beta-fixed` / `2.0.1.0` instead of the default `1.0.0` values.
- Git commit hashes are no longer appended to the displayed product version.
- Corrected Inno Setup paths and timestamp handling.

### Deployment Change

The Windows x64 release is now published **self-contained**. The .NET 8 runtime is bundled into the release, so end users do not need to install .NET separately.

The release intentionally remains multi-file inside the installation directory because `System.Data.SQLite.Core` includes native components. Users still receive a single Inno Setup installer.

### User Data

The application database remains at:

```text
%LOCALAPPDATA%\MFCYouthAreaManagementSystem\mfcyouth.db
```

The installer does not delete this database. When an existing database is found, the installer creates a timestamped safety backup before replacing application files.
