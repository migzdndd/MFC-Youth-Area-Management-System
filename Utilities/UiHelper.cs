using System.Drawing.Drawing2D;
using MFCYouthAreaManagementSystem.UI.Theme;

namespace MFCYouthAreaManagementSystem.Utilities;

public static class UiHelper
{
    public static GraphicsPath Rounded(Rectangle bounds, int radius)
    {
        var path = new GraphicsPath();
        if (bounds.Width <= 1 || bounds.Height <= 1)
        {
            path.AddRectangle(bounds);
            return path;
        }

        radius = Math.Max(1, Math.Min(radius, Math.Min(bounds.Width, bounds.Height) / 2));
        var diameter = radius * 2;
        path.AddArc(bounds.Left, bounds.Top, diameter, diameter, 180, 90);
        path.AddArc(bounds.Right - diameter, bounds.Top, diameter, diameter, 270, 90);
        path.AddArc(bounds.Right - diameter, bounds.Bottom - diameter, diameter, diameter, 0, 90);
        path.AddArc(bounds.Left, bounds.Bottom - diameter, diameter, diameter, 90, 90);
        path.CloseFigure();
        return path;
    }

    public static DataGridView CreateGrid()
    {
        var grid = new DataGridView
        {
            Dock = DockStyle.Fill,
            BackgroundColor = ThemeColors.Surface,
            BorderStyle = BorderStyle.None,
            ReadOnly = true,
            AllowUserToAddRows = false,
            AllowUserToDeleteRows = false,
            AllowUserToResizeRows = false,
            RowHeadersVisible = false,
            SelectionMode = DataGridViewSelectionMode.FullRowSelect,
            MultiSelect = false,
            AutoGenerateColumns = false,
            EnableHeadersVisualStyles = false,
            GridColor = ThemeColors.Border,
            CellBorderStyle = DataGridViewCellBorderStyle.SingleHorizontal,
            ColumnHeadersBorderStyle = DataGridViewHeaderBorderStyle.None,
            ColumnHeadersHeight = 44,
            ColumnHeadersHeightSizeMode = DataGridViewColumnHeadersHeightSizeMode.DisableResizing,
            AutoSizeRowsMode = DataGridViewAutoSizeRowsMode.None,
            Margin = Padding.Empty
        };
        grid.RowTemplate.Height = 42;
        grid.DefaultCellStyle.BackColor = ThemeColors.Surface;
        grid.DefaultCellStyle.ForeColor = ThemeColors.TextPrimary;
        grid.DefaultCellStyle.SelectionBackColor = ThemeColors.Selection;
        grid.DefaultCellStyle.SelectionForeColor = ThemeColors.TextPrimary;
        grid.DefaultCellStyle.Font = ThemeFonts.Body;
        grid.DefaultCellStyle.Padding = new Padding(8, 0, 8, 0);
        grid.ColumnHeadersDefaultCellStyle.BackColor = ThemeColors.Primary;
        grid.ColumnHeadersDefaultCellStyle.ForeColor = Color.White;
        grid.ColumnHeadersDefaultCellStyle.Font = ThemeFonts.BodyBold;
        grid.ColumnHeadersDefaultCellStyle.Padding = new Padding(8, 0, 8, 0);
        return grid;
    }

    public static Label Label(string text, bool muted = false) => new()
    {
        Text = text,
        AutoSize = true,
        Font = ThemeFonts.Body,
        ForeColor = muted ? ThemeColors.TextSecondary : ThemeColors.TextPrimary,
        Margin = new Padding(0, 4, 0, 4)
    };

    public static Label Heading(string text) => new()
    {
        Text = text,
        AutoSize = true,
        Font = ThemeFonts.PageTitle,
        ForeColor = ThemeColors.TextPrimary
    };

    public static Image? LoadIcon(string name)
    {
        try
        {
            var path = Path.Combine(AppContext.BaseDirectory, "Assets", "Icons", name + ".png");
            if (!File.Exists(path)) return null;
            using var stream = File.OpenRead(path);
            using var source = Image.FromStream(stream);
            return new Bitmap(source);
        }
        catch
        {
            return null;
        }
    }
    public static void ScaleNewControlForCurrentDpi(Control control, Control reference)
    {
        if (!reference.IsHandleCreated || reference.DeviceDpi <= 96) return;
        var factor = reference.DeviceDpi / 96f;
        control.Scale(new SizeF(factor, factor));
    }

}
