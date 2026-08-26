using MFCYouthAreaManagementSystem.UI.Theme;

namespace MFCYouthAreaManagementSystem.UI.Controls;

public class NavigationButton : Button
{
    private bool _active;

    public bool Active
    {
        get => _active;
        set
        {
            if (_active == value) return;
            _active = value;
            BackColor = _active ? ThemeColors.Secondary : Color.Transparent;
            Invalidate();
        }
    }

    public NavigationButton()
    {
        Height = 46;
        Dock = DockStyle.Top;
        FlatStyle = FlatStyle.Flat;
        FlatAppearance.BorderSize = 0;
        FlatAppearance.MouseOverBackColor = ThemeColors.Secondary;
        FlatAppearance.MouseDownBackColor = ThemeColors.Secondary;
        TextAlign = ContentAlignment.MiddleLeft;
        Padding = new Padding(18, 0, 8, 0);
        Font = ThemeFonts.BodyBold;
        Cursor = Cursors.Hand;
        BackColor = Color.Transparent;
        ForeColor = Color.FromArgb(218, 226, 238);
        UseVisualStyleBackColor = false;

        SetStyle(
            ControlStyles.AllPaintingInWmPaint |
            ControlStyles.OptimizedDoubleBuffer |
            ControlStyles.ResizeRedraw |
            ControlStyles.SupportsTransparentBackColor,
            true);
        DoubleBuffered = true;
    }

    protected override void OnVisibleChanged(EventArgs e)
    {
        base.OnVisibleChanged(e);
        if (Visible) Invalidate();
    }

    protected override void OnPaint(PaintEventArgs e)
    {
        base.OnPaint(e);
        if (!_active) return;

        using var brush = new SolidBrush(ThemeColors.Accent);
        e.Graphics.FillRectangle(brush, 0, 8, 4, Math.Max(1, Height - 16));
    }
}
