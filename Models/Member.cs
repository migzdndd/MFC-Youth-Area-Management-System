namespace MFCYouthAreaManagementSystem.Models;

public sealed class Member
{
    public long MemberID { get; set; }
    public string LastName { get; set; } = "";
    public string FirstName { get; set; } = "";
    public string? MiddleName { get; set; }
    public DateTime BirthDate { get; set; }
    public string ContactNumber { get; set; } = "";
    public string Address { get; set; } = "";
    public string? EmailAddress { get; set; }
    public string Status { get; set; } = "Active";
    public long ChapterID { get; set; }
    public string ChapterName { get; set; } = "";
    public string Services { get; set; } = "No Service Assigned";
    public string FullName => string.Join(" ", new[] { FirstName, MiddleName, LastName }.Where(x => !string.IsNullOrWhiteSpace(x)));
}
