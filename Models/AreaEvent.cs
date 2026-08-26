namespace MFCYouthAreaManagementSystem.Models;

public sealed class AreaEvent
{
    public long EventID { get; set; }
    public string EventName { get; set; } = string.Empty;
    public string EventDescription { get; set; } = string.Empty;
    public decimal? RegistrationFee { get; set; }
    public int PeopleAttended { get; set; }
    public string Venue { get; set; } = string.Empty;
    public DateTime EventDateTime { get; set; }
    public int RegisteredCount { get; set; }
    public int PaidCount { get; set; }
    public decimal TotalRegistrationFees { get; set; }
}
