using System.Globalization;
using System.Net.Mail;
using System.Text.RegularExpressions;

namespace MFCYouthAreaManagementSystem.Utilities;

public static class ValidationHelper
{
    private static readonly Regex ContactRegex = new("^\\d{11}$", RegexOptions.Compiled);
    private static readonly Regex MiddleInitialRegex = new("^[A-Za-z]\\.?$", RegexOptions.Compiled);

    public static string Clean(string? value) => (value ?? string.Empty).Trim();
    public static bool IsRequiredValid(string? value) => !string.IsNullOrWhiteSpace(value);
    public static bool IsValidContact(string? value) => ContactRegex.IsMatch(Clean(value));
    public static bool IsValidMiddleInitial(string? value)
    {
        var clean = Clean(value);
        return clean.Length == 0 || MiddleInitialRegex.IsMatch(clean);
    }

    public static bool IsValidOptionalEmail(string? value)
    {
        value = Clean(value);
        if (value.Length == 0) return true;
        try
        {
            var address = new MailAddress(value);
            return string.Equals(address.Address, value, StringComparison.OrdinalIgnoreCase);
        }
        catch
        {
            return false;
        }
    }

    public static bool TryParsePositiveAmount(string? value, out decimal amount)
    {
        var clean = Clean(value);
        var styles = NumberStyles.Number | NumberStyles.AllowCurrencySymbol;
        if (decimal.TryParse(clean, styles, CultureInfo.CurrentCulture, out amount) && amount > 0) return true;
        if (decimal.TryParse(clean, styles, CultureInfo.GetCultureInfo("en-PH"), out amount) && amount > 0) return true;
        if (decimal.TryParse(clean, styles, CultureInfo.InvariantCulture, out amount) && amount > 0) return true;
        amount = 0;
        return false;
    }
}
