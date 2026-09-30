using System.Globalization;

namespace MFCYouthAreaManagementSystem.Utilities;

public static class FormattingHelper
{
    public static string Peso(decimal amount) => amount.ToString("C2", CultureInfo.GetCultureInfo("en-PH"));
    public static string Date(DateTime value) => value.ToString("MMMM d, yyyy");
    public static string DateTimeDisplay(DateTime value) => value.ToString("MMMM d, yyyy h:mm tt");
    public static int Age(DateTime birthDate)
    {
        var today = DateTime.Today;
        var age = today.Year - birthDate.Year;
        if (birthDate.Date > today.AddYears(-age)) age--;
        return Math.Max(age, 0);
    }
}
