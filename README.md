# MFC Youth Area Management System

**Current release:** `v2.0.3-beta`

### v2.0.3-beta maintenance focus

- Adds a SQLite integrity check before schema migration.
- Separates database-startup failures from unexpected runtime/UI errors.
- Improves exception logging, including inner-exception details.
- Synchronizes application, installer, manifest, and release-build version metadata.
- Tightens Event participant Middle Initial validation.
- Adds month-over-month green/red Dashboard Summary trend indicators.
- Displays `v2.0.3-beta` in the permanent bottom-right application footer.
- Keeps dashboard trend history outside the core SQLite database.

A custom-designed, fully offline Windows desktop management application for organizing MFC Youth Area records.

## Core Features

- Member management with Birth Date, contact information, address, status, Chapter, and multiple Services
- Chapter management with case-insensitive duplicate protection and safe delete rules
- Seven system-defined MFC Youth Service roles with many-to-many Member assignments
- Activity Reports with separate Activity and Description fields
- GIG contribution tracking per Member with Philippine peso totals
- Dashboard statistics and monthly trend indicators for Members, Chapters, Services, Activity Reports, and Events
- Event management with participant registration, attendance counts, payment status, and registration-fee summaries
- Local SQLite persistence under the signed-in Windows user's application-data folder
- Custom navy/gold WinForms UI, reusable controls, custom dialogs, toast feedback, and styled DataGridViews

## Technology

- C#
- .NET 8 Windows Forms
- System.Data.SQLite
- SQLite
- Parameterized SQL
- Repository-based data access
- Programmatic custom WinForms UI

## Requirements

### End Users

- Windows 10 64-bit or Windows 11 64-bit
- No separate .NET installation is required for the release installer
- No internet connection is required after the installer has been downloaded

The `win-x64` release is published **self-contained**, so the required .NET 8 runtime is bundled with the application.

### Developers

- Visual Studio 2022 with the **.NET desktop development** workload and .NET 8 SDK, or the .NET 8 SDK from the command line
- NuGet access for the first package restore, unless `System.Data.SQLite.Core` is already available in your local package cache

## Updating the Existing Repository

This package is arranged to replace the existing `MFC-Youth-Area-Management-System` repository more directly. Keep the repository's `.git` folder, remove old generated/legacy source files, then copy this package into the repository root. Visual Studio-generated `.vs`, `bin`, and `obj` folders should not be committed.

## Open and Build

1. Open `MFC Youth Database.sln` in Visual Studio 2022.
2. Allow Visual Studio to restore NuGet packages.
3. Select the `x64` solution platform.
4. Select `Debug` or `Release`.
5. Build the solution.
6. Run the project.

Command-line equivalent on a Windows development machine with the .NET 8 SDK:

```powershell
dotnet restore ".\MFC Youth Database.sln" -r win-x64
dotnet build ".\MFC Youth Database.sln" -c Release -p:Platform=x64 -r win-x64 --no-restore
```

## Publish the Release

The release configuration is intentionally **self-contained** and **not single-file**. This bundles the .NET 8 runtime while keeping native SQLite components in their normal published layout. The Inno Setup installer then packages the entire publish folder into one installer for users.

Recommended release command:

```powershell
.\scripts\publish-release.ps1
```

The script:

1. Clears stale `bin`, `obj`, and release publish output.
2. Restores packages for `win-x64`.
3. Publishes a self-contained Windows x64 application.
4. Verifies the executable reports `2.0.3-beta` and file version `2.0.3.0`.
5. Verifies the .NET runtime is actually present in the publish folder.
6. Compiles the Inno Setup installer automatically when Inno Setup 6 is installed.

Manual publish equivalent:

```powershell
dotnet publish ".\MFC Youth Area Management System.csproj" `
    -c Release `
    -r win-x64 `
    --self-contained true `
    -p:PublishSingleFile=false `
    -p:PublishTrimmed=false `
    -o ".\dist\publish-win-x64"
```

Expected installer output:

```text
dist\installer\MFCYouthSetup_v2.0.3-beta.exe
```

## Local Database

The runtime database is created automatically at:

```text
%LOCALAPPDATA%\MFCYouthAreaManagementSystem\mfcyouth.db
```

Logs are written, when possible, to:

```text
%LOCALAPPDATA%\MFCYouthAreaManagementSystem\Logs\
```

The database is not stored beside the executable and should not be committed to source control.

## Database Overview

### Chapter

Stores unique Chapter names. Chapter names use case-insensitive uniqueness. A Chapter cannot be deleted while Members are assigned to it.

### Member

Stores Member identity and contact fields, Birth Date, Status, and the required Chapter foreign key. Contact Number is stored as `TEXT` so leading zeroes are preserved.

### Service

Contains the seven system-defined Service types:

1. Unit Servant
2. Household Servant
3. Chapter Servant
4. Area Servant
5. LIT Servant
6. Campus Servant
7. MFC High Servant

They are seeded idempotently on startup.

### MemberService

Junction table implementing the many-to-many Member/Service relationship. A Member may have zero or more Services.

### ActivityReport

Stores Title, Chapter, Report Type, Activity, Report Date, Prepared By, and Description.

### GIGContribution

Stores each Member contribution Date, Amount, and optional Remarks. Totals are calculated dynamically with `SUM(Amount)`.

### AreaEvent

Stores Event Name, Event Description, optional per-person Registration Fee, People Attended, Venue, and Event Date/Time.

### EventParticipant

Stores Event registrations including name, optional Middle Initial, Age, Contact Number, Address, Chapter, Service, Mode of Payment, and Paid/Not Paid status. Chapter and Service selections are taken from the existing local database. Snapshot names are preserved so historical Event records remain readable if organizational records change later.

The Event summary calculates:

- Registered Participants
- People Attended
- Paid Participants
- Total Registration Fees Collected

Total Registration Fees Collected is the Event Registration Fee multiplied by the number of participants marked Paid. An Event with no Registration Fee displays a collected total of ₱0.00.

## Schema Versioning

The application uses `PRAGMA user_version` for schema versioning. Version 1 creates the original Member, Chapter, Service, Activity Report, and GIG schema. Version 2 adds Events and Event Participants. Version 3 introduces historical Chapter-name snapshots for Activity Reports and allows deleted Chapter references to become `NULL`. Version 4 hardens and repairs the Activity Report and Event Participant relationships so historical records survive Chapter deletion. Startup never intentionally deletes or replaces an existing database to perform a migration.

## Validation Rules

- First Name, Last Name, Birth Date, Contact Number, Address, Status, and Chapter are required for Members.
- Contact Number must contain exactly 11 digits.
- Email is optional and receives basic format validation when supplied.
- Chapter names are required and case-insensitively unique.
- All Activity Report fields are required.
- GIG Amount must be numeric and greater than zero.
- Event Name, Event Description, and Venue are required.
- Event Registration Fee is optional; when supplied it must be greater than zero.
- Participant First Name, Last Name, Age, Contact Number, Address, Chapter, Service, and Payment Status are required.
- Participant Contact Number must contain exactly 11 digits.
- Mode of Payment is required when Payment Status is Paid.
- Required text is trimmed and whitespace-only values are rejected.

## UI and Navigation

The application uses one main shell with:

- Custom title bar
- Custom left navigation
- Dashboard content area
- Embedded primary pages
- Modal detail/edit workflows

Primary pages:

- Dashboard
- Members
- Chapters
- Services
- Activity Reports
- Events

GIG tracking is opened from a selected Member.

## Keyboard Shortcuts

Where applicable:

- `Ctrl+N` creates a new record
- `F5` refreshes the current list
- `Enter` opens/edits the selected record
- `Delete` begins delete confirmation

## Project Structure

```text
Assets/                 Bundled local icons and assets
Database/               SQLite connection, initialization, and migration
Database/Repositories/  Parameterized data-access repositories
Forms/                  Dashboard and feature pages/dialogs
Forms/Controls/         Reusable custom WinForms controls and dialogs
Models/                 Domain models
Properties/             Application manifest and project properties
Utilities/              Validation, formatting, logging, and UI helpers
Utilities/Theme/        Centralized colors, fonts, and sizing
```

## Data Privacy and Storage

This application stores personal information locally on the Windows computer. The SQLite database is **not claimed to be encrypted**. Anyone with sufficient access to the local Windows account or database file may be able to inspect it. Use normal Windows account security and file permissions appropriate to the organization's environment.

## Offline Behavior

No runtime web service, cloud database, external API, account sign-in, or internet connection is required. Core CRUD, search, reporting data, Service assignment, GIG tracking, Events, participant registration, attendance counts, and payment summaries operate against the local SQLite database.

## Current Scope and Limitations

- No authentication or role-permission system yet
- No database encryption yet
- No Member photos
- No Excel/PDF import/export yet
- No backup/restore UI yet

## Future Expansion

The current data/repository structure can be extended later for attendance history, Chapter transfer history, Service history, photos, accounts, permissions, backup/restore, spreadsheet import/export, PDF/printable reports, and contribution reporting.


## v2.0.2 Chapter deletion fix

This package includes the v3/v4 Chapter-reference migrations. Activity Reports now preserve a Chapter name snapshot and use `ON DELETE SET NULL`, so an empty Chapter can be deleted even when historical Activity Reports or Event Participants reference it. Members must still be moved before deleting a Chapter.

### v2.0.2 Chapter Delete Repair

Release `v2.0.2` includes the hardened Chapter deletion repair for upgraded databases. Historical Activity Reports and Event participants keep their Chapter-name snapshots while their Chapter foreign keys are detached before a Chapter is removed. Database schema version 4 rebuilds the affected relationships with `ON DELETE SET NULL`.

This package also fixes application version metadata and changes the Windows x64 release to a self-contained deployment so end users do not receive a separate .NET runtime installation prompt.

## Guaranteed self-contained release path

For the public installer, use `Build-Release.cmd` or `scripts\publish-release.ps1`. The release script forces `win-x64` self-contained publishing, verifies that the .NET runtime files are physically present in `dist\publish-win-x64`, verifies the native SQLite runtime, and only then compiles the Inno Setup installer. This prevents accidentally packaging a framework-dependent executable that asks end users to install .NET.

The installer artwork is pinned to `installer\Resources\WizardImage.png` and `installer\Resources\WizardSmallImage.png`. The release script verifies the approved image hashes before building the installer.
