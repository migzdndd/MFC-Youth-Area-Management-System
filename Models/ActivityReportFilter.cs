namespace MFCYouthAreaManagementSystem.Models;

public sealed class ActivityReportFilter
{
    public string Search { get; init; } = string.Empty;
    public long? ChapterID { get; init; }

    // Historical reports can outlive their Chapter. In that case ChapterID is
    // NULL and the preserved ChapterNameSnapshot is used for filtering.
    public string? HistoricalChapterName { get; init; }

    public string? ReportType { get; init; }
    public DateTime? DateFrom { get; init; }
    public DateTime? DateTo { get; init; }
}
