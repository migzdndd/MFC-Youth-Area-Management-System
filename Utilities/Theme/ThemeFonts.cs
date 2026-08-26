namespace MFCYouthAreaManagementSystem.UI.Theme;

public static class ThemeFonts
{
    private static readonly string PreferredFamily = ResolvePreferredFamily();

    public static readonly Font AppBrand = new(PreferredFamily, 12, FontStyle.Bold);
    public static readonly Font PageTitle = new(PreferredFamily, 20, FontStyle.Bold);
    public static readonly Font SectionTitle = new(PreferredFamily, 13, FontStyle.Bold);
    public static readonly Font Body = new(PreferredFamily, 10.5f, FontStyle.Regular);
    public static readonly Font BodyBold = new(PreferredFamily, 10.5f, FontStyle.Bold);
    public static readonly Font Small = new(PreferredFamily, 9, FontStyle.Regular);
    public static readonly Font Stat = new(PreferredFamily, 24, FontStyle.Bold);

    private static string ResolvePreferredFamily()
    {
        try
        {
            using var family = new FontFamily("Segoe UI Variable Text");
            return family.Name;
        }
        catch
        {
            return "Segoe UI";
        }
    }
}
