namespace MFCYouthAreaManagementSystem.Models;
public sealed class ActivityReport
{
    public long ReportID { get; set; }
    public string Title { get; set; } = "";
    public long? ChapterID { get; set; }
    public string ChapterName { get; set; } = "";
    public string ReportType { get; set; } = "";
    public string Activity { get; set; } = "";
    public DateTime ReportDate { get; set; }
    public string PreparedBy { get; set; } = "";
    public string Description { get; set; } = "";
}
