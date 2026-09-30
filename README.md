# MFC Youth Area Management System

<<<<<<< HEAD
A cloud-based web application and management platform engineered for **Missionary Families for Christ (MFC) Youth & Kids Ministries**. The system streamlines youth membership tracking, household pastoral groupings, chapter administration, event registrations, service cataloging, and ministry analytics.

---

## Executive Summary

The **MFC Youth Area Management System** serves as a central operational platform for servant leaders, chapter heads, and area coordinators. Designed around Christian community governance and statutory data privacy compliance, the application enables secure pastoral tracking, event management, and ministry record-keeping across chapters and areas.

---

## Key Features & Capabilities

### Member & Pastoral Profile Management
- **Youth & Kids Directory**: Complete records for MFC Kids (ages 4–12) and MFC Youth (ages 13–21), including contact details, residential addresses, emergency contacts, and chapter assignments.
- **Pastoral Grouping & Households**: Track household membership, household heads, and pastoral growth milestones across area chapters.
- **Extended Ministry Attributes**: Comprehensive support for school/campus fields, LIT (Leaders in Training), Creative Ministries, and High Servant designations.

### Servant Leader Portal & Role-Based Access Control (RBAC)
- **Role-Based Permissions**: Granular authorization levels for Chapter Servants, Area Coordinators, High Servants, LIT Ministry Heads, and Campus Admins.
- **Secure Authentication**: Built on Supabase Auth with encrypted sessions, servant leader registration passcodes, and Multi-Factor Authentication (MFA) enforcement options.
- **Interactive Dashboards**: Role-tailored dashboards providing area-wide member stats, chapter breakdowns, and quick action shortcuts.

### Event & Activity Management
- **Event Registrations**: Manage youth camps, conferences, household assemblies, and leadership training events.
- **Attendance & Fee Tracking**: Record event participation, fee statuses (free vs paid), and activity logs.

### GIG (God Is Generous) & Financial Service Catalog
- **Service & Resource Tracking**: Log community contributions, service catalog items, and financial stewardship records.
- **Pastoral Analytics**: Generate area reports and summary metrics for community coordination.

### System Transparency & Maintenance
- **Interactive Changelogs**: Built-in release notes and system update timeline.
- **Access & Help System**: Integrated floating access guide for servant leader onboarding.
- **Automated Security Updates**: Managed dependency updates via GitHub Dependabot for root, frontend, backend, and CI workflows.

---

## Technical Architecture

```
                                +-----------------------------------+
                                |     Client Browser (Web App)      |
                                |  Vanilla HTML5 / CSS3 / Alpine.js |
                                +-----------------+-----------------+
                                                  |
                                                  | HTTPS / REST
                                                  v
                                +-----------------+-----------------+
                                |  Vercel Serverless Functions API  |
                                |       Node.js 24.x (/api/*)       |
                                +-----------------+-----------------+
                                                  |
                                                  | Service Role / RLS
                                                  v
                                +-----------------+-----------------+
                                |        Supabase Cloud DB          |
                                |   PostgreSQL + Security Rules     |
                                +-----------------------------------+
```

### Technology Stack
- **Frontend**: Standard HTML5, modular CSS3 (using modern design tokens, custom properties, and optimized responsive media query layers), Vanilla JavaScript (ES Modules), and Alpine.js for lightweight UI reactivity.
- **Backend API**: Node.js (Vercel Serverless Functions running on Node 24.x runtime).
- **Database & Auth**: Supabase PostgreSQL with Row Level Security (RLS) policies, multi-stage schema migrations, and encrypted session handling.
- **Deployment & Routing**: Single-project monorepo architecture configured via `vercel.json` for unified static asset delivery and serverless API execution.

---

## Repository Architecture

```
MFC-Youth-Area-Management-System-Web/
├── .github/                  # GitHub configuration & Dependabot security updates
│   └── dependabot.yml
├── Backend/                  # Vercel Serverless API functions & Supabase migrations
│   ├── api/                  # API endpoints (Auth, Members, Chapters, Events, Reports)
│   ├── supabase/             # SQL schema migrations (001_initial_schema to 011_...)
│   └── package.json
├── Frontend/                 # Web application assets & page views
│   ├── css/                  # Global stylesheet (style.css design system)
│   ├── js/                   # Core application logic, auth handlers, & UI modules
│   ├── index.html            # Main login & authentication portal
│   ├── dashboard.html        # Area management dashboard
│   ├── members.html          # Youth directory & pastoral profiles
│   ├── chapters.html         # Chapter & household administration
│   ├── events.html           # Event registration & activity tracking
│   ├── services.html         # Service catalog & GIG contribution logs
│   ├── reports.html          # Analytics & reporting interface
│   ├── changelogs.html       # System release notes & update logs
│   └── package.json
├── docs/                     # Technical, architectural, & deployment documentation
├── .env.example              # Environment variable template
├── SETUP_AND_DEPLOYMENT_GUIDE.md # Complete deployment walkthrough
├── vercel.json               # Monorepo rewrite rules & single-project routing
└── package.json              # Root package metadata
```
=======
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
>>>>>>> 2db330e5d4161a3256b7a45d51e1b116f0c53950
