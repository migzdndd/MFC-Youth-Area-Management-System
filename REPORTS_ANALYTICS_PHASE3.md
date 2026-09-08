# Reports & Analytics Phase 3 - PDF Export

Phase 3 adds professional PDF export to the Activity Reports page without changing the SQLite schema.

## What is exported

The PDF uses the same active filters shown in the Activity Reports page:

- Search
- Chapter
- Report Type
- Period

The document contains:

- Export scope
- Matching Report count
- Current-month count
- Distinct Chapter count
- Distinct Report Type count
- Six-month Activity Report snapshot
- Top Report Types
- Top Chapters
- Full Activity Report details, including Activity and Description
- Generated timestamp and page numbering

## Offline PDF generation

The app uses the Windows built-in **Microsoft Print to PDF** printer through `System.Drawing.Printing`. No additional PDF NuGet package, cloud service, web API, or database migration is required.

If Microsoft Print to PDF is disabled in Windows, the app shows a clear message instead of attempting an export.

## User flow

1. Open **Activity Reports**.
2. Apply any Search, Chapter, Report Type, or Period filters.
3. Click **Export PDF** or press `Ctrl+Shift+E`.
4. Choose a `.pdf` file location.
5. The app creates the filtered multi-page report.

## Data safety

PDF export only reads Activity Report records. It does not insert, update, delete, migrate, or otherwise modify SQLite data.
