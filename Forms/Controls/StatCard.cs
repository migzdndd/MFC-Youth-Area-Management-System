using System.Drawing.Drawing2D;
using MFCYouthAreaManagementSystem.UI.Theme;
using MFCYouthAreaManagementSystem.Utilities;

namespace MFCYouthAreaManagementSystem.UI.Controls;

public class StatCard : Panel
{
    private readonly Label _value;
    private readonly Label _title;
    private readonly Label _caption;
    private readonly Panel _iconBadge;
    private readonly PictureBox _icon;
    private readonly Panel _accentStrip;

    private bool _featured;
    private Color _accentColor = ThemeColors.Accent;

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

    public string Caption
    {
        get => _caption.Text;
        set => _caption.Text = value;
    }

    public Image? Icon
    {
        get => _icon.Image;
        set => _icon.Image = value;
    }

    public Color AccentColor
    {
        get => _accentColor;
        set
        {
            _accentColor = value;
            _accentStrip.BackColor = value;
            if (_featured) _iconBadge.BackColor = value;
            Invalidate();
        }
    }

    public bool Featured
    {
        get => _featured;
        set
        {
            _featured = value;
            ApplyStyle();
        }
    }

    public StatCard()
    {
        DoubleBuffered = true;
        BackColor = ThemeColors.Surface;
        Padding = new Padding(18, 16, 18, 14);
        Margin = Padding.Empty;
        MinimumSize = new Size(150, 105);

        _accentStrip = new Panel
        {
            Dock = DockStyle.Top,
            Height = 4,
            BackColor = _accentColor,
            Margin = Padding.Empty
        };
        Controls.Add(_accentStrip);

        var layout = new TableLayoutPanel
        {
            Dock = DockStyle.Fill,
            ColumnCount = 2,
            RowCount = 3,
            Margin = Padding.Empty,
            Padding = new Padding(0, 4, 0, 0),
            BackColor = Color.Transparent
        };
        layout.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 100));
        layout.ColumnStyles.Add(new ColumnStyle(SizeType.Absolute, 54));
        layout.RowStyles.Add(new RowStyle(SizeType.Absolute, 27));
        layout.RowStyles.Add(new RowStyle(SizeType.Percent, 100));
        layout.RowStyles.Add(new RowStyle(SizeType.Absolute, 25));

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

        _caption = new Label
        {
            Dock = DockStyle.Fill,
            Font = ThemeFonts.Small,
            ForeColor = ThemeColors.TextSecondary,
            TextAlign = ContentAlignment.MiddleLeft,
            AutoEllipsis = true,
            Margin = Padding.Empty
        };

        _iconBadge = new Panel
        {
            Width = 42,
            Height = 42,
            BackColor = ThemeColors.Primary,
            Margin = new Padding(8, 7, 0, 0),
            Anchor = AnchorStyles.Top | AnchorStyles.Right
        };

        _icon = new PictureBox
        {
            Dock = DockStyle.Fill,
            SizeMode = PictureBoxSizeMode.CenterImage,
            BackColor = Color.Transparent,
            Margin = Padding.Empty
        };
        _iconBadge.Controls.Add(_icon);

        layout.Controls.Add(_title, 0, 0);
        layout.Controls.Add(_value, 0, 1);
        layout.Controls.Add(_caption, 0, 2);
        layout.Controls.Add(_iconBadge, 1, 0);
        layout.SetRowSpan(_iconBadge, 2);

        Controls.Add(layout);
        layout.BringToFront();
        _accentStrip.BringToFront();

        ApplyStyle();
    }

    private void ApplyStyle()
    {
        BackColor = _featured ? ThemeColors.Primary : ThemeColors.Surface;
        _title.ForeColor = _featured ? Color.FromArgb(201, 215, 232) : ThemeColors.TextSecondary;
        _value.ForeColor = _featured ? Color.White : ThemeColors.Primary;
        _caption.ForeColor = _featured ? Color.FromArgb(201, 215, 232) : ThemeColors.TextSecondary;
        _iconBadge.BackColor = _featured ? _accentColor : ThemeColors.Primary;
        _accentStrip.BackColor = _accentColor;
        Invalidate(true);
    }

    protected override void OnPaint(PaintEventArgs e)
    {
        base.OnPaint(e);
        e.Graphics.SmoothingMode = SmoothingMode.AntiAlias;

        var bounds = new Rectangle(0, 0, Width - 1, Height - 1);
        if (bounds.Width <= 1 || bounds.Height <= 1) return;

        using var path = UiHelper.Rounded(bounds, ThemeSizes.Radius);
        using var pen = new Pen(_featured ? ThemeColors.Secondary : ThemeColors.Border);
        e.Graphics.DrawPath(pen, path);

        // Small outline around the icon badge keeps the icon visually separated
        // without making the card feel heavy.
        var badgeBounds = _iconBadge.Bounds;
        if (badgeBounds.Width > 1 && badgeBounds.Height > 1)
        {
            using var badgePath = UiHelper.Rounded(
                new Rectangle(badgeBounds.Left, badgeBounds.Top, badgeBounds.Width - 1, badgeBounds.Height - 1),
                8);
            using var badgePen = new Pen(_featured ? Color.FromArgb(80, Color.White) : ThemeColors.Border);
            e.Graphics.DrawPath(badgePen, badgePath);
        }
    }
}
