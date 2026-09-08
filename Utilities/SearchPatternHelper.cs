namespace MFCYouthAreaManagementSystem.Utilities;

public static class SearchPatternHelper
{
    public static string Contains(string value)
    {
        var clean = value ?? string.Empty;
        return "%" + clean
            .Replace("\\", "\\\\", StringComparison.Ordinal)
            .Replace("%", "\\%", StringComparison.Ordinal)
            .Replace("_", "\\_", StringComparison.Ordinal) + "%";
    }
}
