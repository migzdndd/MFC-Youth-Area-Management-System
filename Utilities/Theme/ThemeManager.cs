namespace MFCYouthAreaManagementSystem.UI.Theme;
public static class ThemeManager
{
    public static void ApplyForm(Form form){form.BackColor=ThemeColors.Background;form.ForeColor=ThemeColors.TextPrimary;form.Font=ThemeFonts.Body;}
}
