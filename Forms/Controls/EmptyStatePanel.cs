using MFCYouthAreaManagementSystem.UI.Theme;

namespace MFCYouthAreaManagementSystem.UI.Controls;

public class EmptyStatePanel : Panel
{
    private readonly string _defaultTitle;
    private readonly string _defaultText;
    private readonly Label _titleLabel;
    private readonly Label _textLabel;

    public EmptyStatePanel(string title, string text)
    {
        _defaultTitle = title;
        _defaultText = text;

        Dock = DockStyle.Fill;
        BackColor = ThemeColors.Surface;
        Padding = new Padding(24);

        var outer = new TableLayoutPanel
        {
            Dock = DockStyle.Fill,
            ColumnCount = 1,
            RowCount = 3,
            Margin = Padding.Empty,
            Padding = Padding.Empty
        };
        outer.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 100));
        outer.RowStyles.Add(new RowStyle(SizeType.Percent, 50));
        outer.RowStyles.Add(new RowStyle(SizeType.AutoSize));
        outer.RowStyles.Add(new RowStyle(SizeType.Percent, 50));

        var inner = new TableLayoutPanel
        {
            AutoSize = true,
            AutoSizeMode = AutoSizeMode.GrowAndShrink,
            Anchor = AnchorStyles.None,
            ColumnCount = 1,
            RowCount = 2,
            Margin = Padding.Empty,
            Padding = Padding.Empty,
            MaximumSize = new Size(520, 0)
        };
        inner.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 100));
        inner.RowStyles.Add(new RowStyle(SizeType.AutoSize));
        inner.RowStyles.Add(new RowStyle(SizeType.AutoSize));

        _titleLabel = new Label
        {
            Text = title,
            AutoSize = true,
            MaximumSize = new Size(520, 0),
            Font = ThemeFonts.SectionTitle,
            ForeColor = ThemeColors.TextPrimary,
            Margin = new Padding(0, 0, 0, 8),
            TextAlign = ContentAlignment.MiddleCenter,
            Anchor = AnchorStyles.None
        };
        inner.Controls.Add(_titleLabel, 0, 0);

        _textLabel = new Label
        {
            Text = text,
            AutoSize = true,
            MaximumSize = new Size(520, 0),
            Font = ThemeFonts.Body,
            ForeColor = ThemeColors.TextSecondary,
            TextAlign = ContentAlignment.MiddleCenter,
            Margin = Padding.Empty,
            Anchor = AnchorStyles.None
        };
        inner.Controls.Add(_textLabel, 0, 1);

        outer.Controls.Add(inner, 0, 1);
        Controls.Add(outer);
    }

    public void ResetMessage()
    {
        _titleLabel.Text = _defaultTitle;
        _textLabel.Text = _defaultText;
    }

    public void ShowMessage(string title, string text)
    {
        _titleLabel.Text = title;
        _textLabel.Text = text;
    }
}
