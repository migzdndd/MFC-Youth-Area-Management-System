namespace MFCYouthAreaManagementSystem.Utilities;

public static class ApplicationConstants
{
    public const string AppName = "MFC Youth Area Management System";
    public const string AppVersion = "2.0.0";
    public static readonly string[] MemberStatuses = { "Active", "Inactive" };
    public static readonly string[] ReportTypes = { "Household", "Chapter Assembly", "Youth Camp", "Area Event" };
    public static readonly string[] PaymentStatuses = { "Paid", "Not Paid" };
    public static readonly string[] DefaultServices =
    {
        "Unit Servant", "Household Servant", "Chapter Servant", "Area Servant",
        "LIT Servant", "Campus Servant", "MFC High Servant"
    };
}
