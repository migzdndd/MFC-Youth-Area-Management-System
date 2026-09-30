namespace MFCYouthAreaManagementSystem.Models;
public sealed class GIGContribution
{
    public long ContributionID { get; set; }
    public long MemberID { get; set; }
    public DateTime ContributionDate { get; set; }
    public decimal Amount { get; set; }
    public string? Remarks { get; set; }
}
