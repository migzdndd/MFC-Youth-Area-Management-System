using System.Drawing.Drawing2D;
using MFCYouthAreaManagementSystem.UI.Theme;
using MFCYouthAreaManagementSystem.Utilities;

namespace MFCYouthAreaManagementSystem.UI.Controls;

public class StatCard : Panel
{
    private readonly Label _value;
    private readonly Label _title;

    public string Value
    {
        get => _value.Text;
        set => _value.Text = value;
    }

    public string Title
    {
        get => _title.Text;
        set => _title.Text = value;
    }

    public StatCard()
    {
        BackColor = ThemeColors.Surface;
        Padding = new Padding(18, 16, 18, 16);
        Margin = new Padding(0, 0, 16, 16);
        MinimumSize = new Size(160, 120);

        var layout = new TableLayoutPanel
        {
            Dock = DockStyle.Fill,
            ColumnCount = 1,
            RowCount = 2,
            Margin = Padding.Empty,
            Padding = Padding.Empty,
            BackColor = Color.Transparent
        };
        layout.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 100));
        layout.RowStyles.Add(new RowStyle(SizeType.Absolute, 30));
        layout.RowStyles.Add(new RowStyle(SizeType.Percent, 100));

        _title = new Label
        {
            Dock = DockStyle.Fill,
            Font = ThemeFonts.BodyBold,
            ForeColor = ThemeColors.TextSecondary,
            TextAlign = ContentAlignment.MiddleLeft,
            AutoEllipsis = true,
            Margin = Padding.Empty
        };

        _value = new Label
        {
            Dock = DockStyle.Fill,
            Font = ThemeFonts.Stat,
            ForeColor = ThemeColors.Primary,
            TextAlign = ContentAlignment.MiddleLeft,
            AutoEllipsis = true,
            Margin = Padding.Empty
        };

        layout.Controls.Add(_title, 0, 0);
        layout.Controls.Add(_value, 0, 1);
        Controls.Add(layout);
    }

    protected override void OnPaint(PaintEventArgs e)
    {
        base.OnPaint(e);
        e.Graphics.SmoothingMode = SmoothingMode.AntiAlias;
        using var path = UiHelper.Rounded(new Rectangle(0, 0, Width - 1, Height - 1), ThemeSizes.Radius);
        using var pen = new Pen(ThemeColors.Border);
        e.Graphics.DrawPath(pen, path);
    }
}
