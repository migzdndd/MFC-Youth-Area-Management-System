# MFC Youth Area Management System

**Current release:** `v2.0.4-beta`  
**Desktop UI:** WPF / MVVM-oriented navigation  
**Runtime:** .NET 8 Windows x64, self-contained  
**Database:** SQLite schema `6`  
**Mode:** Offline-first

The MFC Youth Area Management System is a Windows desktop application for managing Area Members, Chapters, Services, Activity Reports, GIG contributions, Events, participant registration, payment status, and recorded attendance.

## Current WPF Feature Set

### Dashboard
- Total Members and Active Members
- Chapters and Services
- Activity Reports and Events
- Event Registrations and Recorded Attendance
- Recent/upcoming Events
- Members-by-Chapter overview
- Rolling monthly trend history stored separately from the SQLite database

### Members
- Search, Status filtering, and Chapter filtering
- Add and Edit Member
- Read-only Member Details
- Delete confirmation
- Optional Chapter assignment / genuinely unassigned Members
- Contact-number and email duplicate protection
- Service assignment
- GIG Tracker access

### Chapters
- Search Chapters
- Add and Rename Chapter
- Member Count and Active Member Count
- Manage Chapter Members
- Assign only currently-unassigned Members directly to a Chapter
- Safe deletion with historical snapshot preservation

### Services
- Seven seeded MFC Youth Service roles
- Assigned Member counts
- Search and view Members assigned to a Service
- Member-to-Service assignment from the Members workflow

### Activity Reports
- Add, Edit, Delete, Search, and filter
- Current and historical Chapter filtering
- Report Types: Core Household, Household, Assembly, Fellowship
- Optional linked Event with historical Event-name snapshot preservation
- Date filtering
- Six-month report volume analytics
- Report Type mix and Chapter activity analytics
- Filtered PDF export through Microsoft Print to PDF

### Events
- Add, Edit, Delete, Search, and Event Details
- Participant registration and editing
- Chapter and Service snapshots
- Payment Status and Mode of Payment
- Recorded Attendance state
- Registered / Attended / Paid / Collected summary totals

### GIG Tracker
- Contribution history
- Add/Edit/Delete contributions
- Total contribution amount
- Non-future contribution dates
- Positive-amount validation

## Data and Migration Safety

Runtime data is stored at:

```text
%LOCALAPPDATA%\MFCYouthAreaManagementSystem\mfcyouth.db
```

Logs are stored at:

```text
%LOCALAPPDATA%\MFCYouthAreaManagementSystem\Logs\
```

The app keeps the existing incremental migration chain through SQLite schema version `6`. Existing supported databases are migrated in place; startup also performs SQLite integrity checks, foreign-key checks, and the conservative data-integrity audit before normal use.

Schema 6 includes:
- nullable `Member.ChapterID`
- optional Activity Report → Event relationship
- Event name snapshots for historical Reports
- recorded Event Participant attendance

The local SQLite database is not claimed to be encrypted.

## Technology

- C# 12
- .NET 8 WPF
- SQLite / `System.Data.SQLite.Core 1.0.119`
- Repository-based data access
- XAML views and reusable WPF resources
- Offline PDF export using Windows Microsoft Print to PDF

## Project Structure

```text
Assets/                     Local assets
Database/                   Database initialization, migration, integrity audit
Database/Repositories/      SQLite repositories
Installer/                  Inno Setup scripts and installer resources
Models/                      Domain models
Properties/                  App manifest and publish profiles
Services/                    WPF/application services
Styles/                      Shared WPF theme resources
Utilities/                   Validation, logging, formatting, PDF and trend helpers
ViewModels/                  WPF view models and commands
Views/                       Primary WPF pages
Views/Dialogs/               WPF editor/detail dialogs
scripts/                     Release publishing automation
App.xaml                     WPF application resources and DataTemplates
App.xaml.cs                  WPF startup and database initialization
```

The old WinForms presentation layer is no longer part of the source package. The WPF conversion is authoritative.

## Developer Requirements

- Windows 10/11 x64
- Visual Studio 2022 with **.NET desktop development**, or .NET 8 SDK
- NuGet access for first restore unless dependencies are already cached
- Inno Setup 6 only when compiling the installer

## Build

```powershell
dotnet restore ".\MFC Youth Database.sln" -r win-x64
dotnet build ".\MFC Youth Database.sln" -c Release -p:Platform=x64 -r win-x64 --no-restore
```

Expected release gate: **0 build errors**. Review meaningful warnings before publishing.

## Publish

Recommended:

```powershell
.\scripts\publish-release.ps1
```

or:

```powershell
dotnet publish ".\MFC Youth Area Management System.csproj" `
  -c Release `
  -r win-x64 `
  --self-contained true `
  -p:PublishSingleFile=false `
  -p:PublishTrimmed=false `
  -o ".\dist\publish-win-x64"
```

The release script verifies the expected version, schema level, self-contained runtime files, SQLite native runtime, installer resources, and the final installer when Inno Setup is available.

## Release Packaging

Generated folders are deliberately excluded from the clean source package:

```text
bin/
obj/
dist/
```

This prevents stale WinForms binaries or old installers from being confused with the converted WPF source. Run the release script on the Windows development machine to create a fresh publish folder and installer from this source.

## Current Limitations / Future Work

- No authentication or role-permission system yet
- No database encryption yet
- No Member photos yet
- No Excel import/export yet
- Backup/Restore UI remains deferred
- Cloud synchronization / web-hybrid integration remains a later roadmap phase

## Privacy

Member, Event, payment-status, and organizational data are stored locally. Protect the Windows account and database file appropriately, and never commit a real runtime database to a public repository.
