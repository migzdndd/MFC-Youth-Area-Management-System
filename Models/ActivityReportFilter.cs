namespace MFCYouthAreaManagementSystem.Models;

public sealed class ActivityReportFilter
{
    public string Search { get; init; } = string.Empty;
    public long? ChapterID { get; init; }
    public string? ReportType { get; init; }
    public DateTime? DateFrom { get; init; }
    public DateTime? DateTo { get; init; }
}
