using MFCYouthAreaManagementSystem.UI.Theme;

namespace MFCYouthAreaManagementSystem.Utilities;

/// <summary>
/// Shared layout helpers for the Phone Compatibility / Mobile Access roadmap phase.
///
/// This does not make the WinForms desktop app installable on phones yet. It creates
/// the responsive foundation we need before designing the future web/PWA companion:
/// smaller-window support, compact navigation, touch-friendlier table rows, and one
/// place for future mobile breakpoints.
/// </summary>
public static class ResponsiveLayoutHelper
{
    public const int CompactShellBreakpoint = 980;
    public const int CompactSidebarWidth = 76;
    public const int CompactSidebarBrandHeight = 76;
    public const int CompactPagePadding = 14;
    public const int CompactNavigationPadding = 0;
    public const int TouchGridRowHeight = 48;
    public const int TouchGridHeaderHeight = 48;

    public static bool IsCompactShell(Control control) =>
        control.ClientSize.Width > 0 && control.ClientSize.Width < CompactShellBreakpoint;

    public static Padding PagePaddingFor(Control control) =>
        IsCompactShell(control) ? new Padding(CompactPagePadding) : new Padding(ThemeSizes.PagePadding);

    public static void ApplyTouchFriendlyGrid(DataGridView grid)
    {
        grid.RowTemplate.Height = TouchGridRowHeight;
        grid.RowTemplate.MinimumHeight = TouchGridRowHeight;
        grid.ColumnHeadersHeight = TouchGridHeaderHeight;
        grid.ScrollBars = ScrollBars.Both;
        grid.DefaultCellStyle.Padding = new Padding(10, 0, 10, 0);
        grid.ColumnHeadersDefaultCellStyle.Padding = new Padding(10, 0, 10, 0);
    }
}
