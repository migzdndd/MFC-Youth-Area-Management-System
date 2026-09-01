namespace MFCYouthAreaManagementSystem.Utilities;

public static class ApplicationConstants
{
    public const string AppName = "MFC Youth Area Management System";
    public const string AppVersionNumber = "2.0.3";
    public const string ReleaseChannel = "beta";
    public const string AppVersion = "v" + AppVersionNumber + "-" + ReleaseChannel;
    public static readonly string[] MemberStatuses = { "Active", "Inactive" };
    public static readonly string[] ReportTypes = { "Household", "Chapter Assembly", "Youth Camp", "Area Event" };
    public static readonly string[] PaymentStatuses = { "Paid", "Not Paid" };
    public static readonly string[] DefaultServices =
    {
        "Unit Servant", "Household Servant", "Chapter Servant", "Area Servant",
        "LIT Servant", "Campus Servant", "MFC High Servant"
    };
}
