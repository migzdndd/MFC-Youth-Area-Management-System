# Stability & Conversion Audit — v2.0.4-beta

## Target

- UI framework: WPF
- Target framework: `net8.0-windows`
- Runtime: `win-x64`, self-contained
- Application version: `2.0.4-beta`
- File version: `2.0.4.0`
- SQLite schema: `6`

## Conversion checks completed in source

- WPF is the sole active presentation framework in the source package.
- Legacy WinForms Forms/Controls and WinForms-only presentation helpers were removed.
- No application C# source references `System.Windows.Forms`.
- No remaining `TODO`, `FIXME`, `NotImplementedException`, or "To be implemented" markers were left in active application source.
- The stale `DashboardSnapshotRepository` is removed. Historical `DashboardMonthlySnapshot` references remain only inside the intentional schema-v5 detection/repair migration logic.
- Member, Chapter, Service, Activity Report, Event, participant, GIG, and Dashboard workflows have active WPF implementations.
- Incorrect transitional Activity Report bindings (`ReportMonth` / `SubmittedBy`) were replaced with the actual schema/model properties (`ReportDate` / `PreparedBy`).
- Release/package source no longer ships stale generated `bin`, `obj`, or `dist` output.

## Data safety retained

Startup continues to perform:

1. legacy database-location migration when needed
2. SQLite `PRAGMA quick_check`
3. incremental schema migration through v6
4. `PRAGMA foreign_key_check`
5. conservative data-integrity audit/repair
6. a second foreign-key verification
7. idempotent Service seeding

## Build verification limitation

This conversion environment does not provide a usable Windows .NET SDK/MSBuild/Inno Setup toolchain, so an actual WPF compile and installer build cannot be truthfully claimed here. Static source/XAML/package checks were performed instead.

Before publishing, run on the Windows development machine:

```powershell
dotnet clean ".\MFC Youth Area Management System.csproj"
Remove-Item .\bin,.\obj,.\dist -Recurse -Force -ErrorAction SilentlyContinue
dotnet restore ".\MFC Youth Area Management System.csproj" -r win-x64
dotnet build ".\MFC Youth Area Management System.csproj" -c Release -r win-x64
.\scripts\publish-release.ps1
```

Release gate: **Build succeeded, 0 errors**, followed by module smoke testing.

## Recommended smoke test

- Dashboard opens on a fresh database and on an upgraded existing database
- Member add/edit/view/delete, filters, Services, GIG
- Chapter add/rename/manage/delete safeguards
- Service member viewer
- Activity Report add/edit/delete/filter/Event link/PDF export
- Event add/edit/details/delete
- participant add/edit/delete, Paid/Not Paid, payment mode, attendance
- dashboard totals and Chapter distribution update after changes
- app reopens with all data preserved
