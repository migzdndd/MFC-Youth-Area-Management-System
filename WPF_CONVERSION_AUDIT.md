# WPF Conversion Completion Notes

The September 17 transitional package contained a mature but excluded WinForms application beside an early WPF shell. This conversion resolves that mixed state.

## Removed transitional conflicts

- removed legacy `Forms/` presentation source after workflow porting
- removed WinForms-only UI helpers and theme-font/form helpers
- removed global `System.Windows.Forms` import
- removed stale dashboard snapshot repository
- removed accidental redirected Git-warning file
- removed stale generated build/publish output from the clean package

## WPF-authoritative modules

- Dashboard
- Members
- Member Details
- Member Editor
- Service Assignment
- GIG Tracker
- Chapters
- Chapter Members / Add Unassigned Members
- Services / Service Members
- Activity Reports / Report Editor / Analytics / PDF export
- Events / Event Editor / Event Details
- Event Participant Editor

The existing SQLite repositories and schema-v6 migration chain remain the source of truth for persistent data.


## Build Fix 1 — System.Drawing.Common

A Windows build exposed a missing compile-time dependency in `ActivityReportPdfExporter.cs`.
The WPF conversion intentionally removed WinForms, but the existing PDF renderer still uses
Windows `System.Drawing` types (`Graphics`, `Font`, `Pen`, `SolidBrush`, and printing APIs).

`System.Drawing.Common` 8.0.0 is now referenced explicitly. This keeps the application WPF-only
while preserving the existing Microsoft Print to PDF export implementation.


## Build Fix 2 — Nullable Chapter filter typing

A Windows WPF build exposed `CS0173` in `MembersViewModel.cs` because a conditional
expression mixed a non-nullable `long` ChapterID with `null` while being assigned
to `var`. The local Chapter filter variable is now explicitly declared as `long?`,
which is the intended repository filter type.
