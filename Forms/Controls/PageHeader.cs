using MFCYouthAreaManagementSystem.UI.Theme;

namespace MFCYouthAreaManagementSystem.UI.Controls;

public class PageHeader : Panel
{
    private readonly Label _title;
    private readonly Label _description;

    public string TitleText
    {
        get => _title.Text;
        set => _title.Text = value;
    }

    public string DescriptionText
    {
        get => _description.Text;
        set => _description.Text = value;
    }

    public PageHeader(string title, string description)
    {
        Dock = DockStyle.Fill;
        MinimumSize = new Size(0, ThemeSizes.PageHeaderHeight);
        BackColor = Color.Transparent;
        Margin = Padding.Empty;
        Padding = new Padding(0, 6, 0, 8);

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
        layout.RowStyles.Add(new RowStyle(SizeType.Percent, 58));
        layout.RowStyles.Add(new RowStyle(SizeType.Percent, 42));

        _title = new Label
        {
            Text = title,
            Dock = DockStyle.Fill,
            Font = ThemeFonts.PageTitle,
            ForeColor = ThemeColors.TextPrimary,
            TextAlign = ContentAlignment.MiddleLeft,
            AutoEllipsis = true,
            Margin = Padding.Empty
        };

        _description = new Label
        {
            Text = description,
            Dock = DockStyle.Fill,
            Font = ThemeFonts.Body,
            ForeColor = ThemeColors.TextSecondary,
            TextAlign = ContentAlignment.TopLeft,
            AutoEllipsis = true,
            Margin = Padding.Empty,
            Padding = new Padding(1, 2, 0, 0)
        };

        layout.Controls.Add(_title, 0, 0);
        layout.Controls.Add(_description, 0, 1);
        Controls.Add(layout);
    }
}
