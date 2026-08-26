namespace MFCYouthAreaManagementSystem.Models;

public sealed class EventParticipant
{
    public long ParticipantID { get; set; }
    public long EventID { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? MiddleInitial { get; set; }
    public int Age { get; set; }
    public string ContactNumber { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public long? ChapterID { get; set; }
    public string ChapterName { get; set; } = string.Empty;
    public long? ServiceID { get; set; }
    public string ServiceName { get; set; } = string.Empty;
    public string? ModeOfPayment { get; set; }
    public string PaymentStatus { get; set; } = "Not Paid";

    public string FullName
    {
        get
        {
            var middle = string.IsNullOrWhiteSpace(MiddleInitial) ? string.Empty : $" {MiddleInitial!.Trim()}";
            return $"{FirstName}{middle} {LastName}".Trim();
        }
    }
}
