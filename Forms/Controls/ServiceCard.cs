using MFCYouthAreaManagementSystem.Models;
using MFCYouthAreaManagementSystem.UI.Theme;
using MFCYouthAreaManagementSystem.Utilities;

namespace MFCYouthAreaManagementSystem.UI.Controls;

public sealed class ServiceCard : Panel
{
    public Service Service { get; }
    public event EventHandler? ViewClicked;

    public ServiceCard(Service service)
    {
        Service = service;
        Width = 270;
        Height = 158;
        BackColor = ThemeColors.Surface;
        Padding = new Padding(18, 16, 18, 14);
        Margin = new Padding(0, 0, 16, 16);

        var layout = new TableLayoutPanel
        {
            Dock = DockStyle.Fill,
            ColumnCount = 1,
            RowCount = 3,
            Margin = Padding.Empty,
            Padding = Padding.Empty,
            BackColor = Color.Transparent
        };
        layout.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 100));
        layout.RowStyles.Add(new RowStyle(SizeType.Absolute, 38));
        layout.RowStyles.Add(new RowStyle(SizeType.Percent, 100));
        layout.RowStyles.Add(new RowStyle(SizeType.Absolute, 42));

        var title = new Label
        {
            Text = service.ServiceName,
            Dock = DockStyle.Fill,
            Font = ThemeFonts.SectionTitle,
            ForeColor = ThemeColors.TextPrimary,
            TextAlign = ContentAlignment.MiddleLeft,
            AutoEllipsis = true,
            Margin = Padding.Empty
        };

        var count = new Label
        {
            Text = $"{service.MemberCount} Member{(service.MemberCount == 1 ? string.Empty : "s")}",
            Dock = DockStyle.Fill,
            Font = ThemeFonts.SectionTitle,
            ForeColor = ThemeColors.Primary,
            TextAlign = ContentAlignment.MiddleLeft,
            AutoEllipsis = true,
            Margin = Padding.Empty
        };

        var view = new ModernButton
        {
            Text = "View Members",
            Dock = DockStyle.Fill,
            ButtonStyle = ModernButtonStyle.Ghost,
            Margin = Padding.Empty
        };
        view.Click += (_, e) => ViewClicked?.Invoke(this, e);

        layout.Controls.Add(title, 0, 0);
        layout.Controls.Add(count, 0, 1);
        layout.Controls.Add(view, 0, 2);
        Controls.Add(layout);
    }

    protected override void OnPaint(PaintEventArgs e)
    {
        base.OnPaint(e);
        e.Graphics.SmoothingMode = System.Drawing.Drawing2D.SmoothingMode.AntiAlias;
        using var path = UiHelper.Rounded(new Rectangle(0, 0, Width - 1, Height - 1), ThemeSizes.Radius);
        using var pen = new Pen(ThemeColors.Border);
        e.Graphics.DrawPath(pen, path);
    }
}
