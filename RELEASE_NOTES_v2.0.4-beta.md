# MFC Youth Area Management System — v2.0.4-beta

## Release identity

- Public version: `v2.0.4-beta`
- File/assembly version: `2.0.4.0`
- SQLite schema: `6`
- Platform: Windows x64, self-contained .NET 8
- Desktop presentation: WPF

## WPF conversion stabilization

This source completes the presentation-layer conversion from the former WinForms UI to WPF while retaining the existing SQLite database, repositories, migration history, validation rules, historical snapshots, and offline-first behavior.

The incomplete transitional WPF shell has been replaced with functional workflows for Members, Chapters, Services, Events, Event Participants, Activity Reports, GIG contributions, and the Dashboard. Obsolete WinForms presentation files and WinForms-only UI helpers are no longer part of the authoritative source tree.

## Restored feature parity

- Member add/edit/view/delete, search/filtering, Chapter assignment, Service assignment, and GIG tracking
- Chapter add/rename/delete, Member/Active Member counts, Chapter member viewing, and direct assignment of unassigned Members
- Service member counts and Service-member views
- Event add/edit/delete/details and participant registration
- participant payment mode/status and recorded attendance
- Activity Report CRUD, filtering, historical Chapters, optional Event linking, analytics, and filtered PDF export
- Dashboard totals, recent/upcoming Events, Members-by-Chapter distribution, and rolling monthly trend history

## Database compatibility

Schema remains version `6`. The migration and integrity infrastructure is preserved, including special handling for the short-lived historical dashboard-only schema-v5 database shape. Existing data is not intentionally reset during migration.

## Packaging note

This clean source package intentionally omits generated `bin`, `obj`, and `dist` folders. Any installer from before the completed WPF conversion is stale and must not be treated as representing this source. Build and publish a fresh installer through `scripts/publish-release.ps1` on the Windows development machine.
