using System.Drawing.Drawing2D;
using MFCYouthAreaManagementSystem.UI.Theme;
using MFCYouthAreaManagementSystem.Utilities;

namespace MFCYouthAreaManagementSystem.UI.Controls;

public enum ModernButtonStyle { Primary, Secondary, Danger, Ghost }

public class ModernButton : Button
{
    private bool _hover;
    private bool _pressed;
    private ModernButtonStyle _buttonStyle = ModernButtonStyle.Primary;
    private int _radius = 9;

    public ModernButtonStyle ButtonStyle
    {
        get => _buttonStyle;
        set
        {
            if (_buttonStyle == value) return;
            _buttonStyle = value;
            Invalidate();
        }
    }

    public int Radius
    {
        get => _radius;
        set
        {
            var normalized = Math.Max(0, value);
            if (_radius == normalized) return;
            _radius = normalized;
            Invalidate();
        }
    }

    public ModernButton()
    {
        Height = ThemeSizes.ButtonHeight;
        AutoSize = false;
        FlatStyle = FlatStyle.Flat;
        FlatAppearance.BorderSize = 0;
        FlatAppearance.MouseOverBackColor = Color.Transparent;
        FlatAppearance.MouseDownBackColor = Color.Transparent;
        UseVisualStyleBackColor = false;
        BackColor = Color.Transparent;
        Cursor = Cursors.Hand;
        Font = ThemeFonts.BodyBold;
        Padding = new Padding(14, 0, 14, 0);

        SetStyle(
            ControlStyles.UserPaint |
            ControlStyles.AllPaintingInWmPaint |
            ControlStyles.OptimizedDoubleBuffer |
            ControlStyles.ResizeRedraw |
            ControlStyles.SupportsTransparentBackColor,
            true);
        DoubleBuffered = true;
        UpdateStyles();
    }

    protected override void OnMouseEnter(EventArgs e)
    {
        base.OnMouseEnter(e);
        _hover = true;
        Invalidate();
    }

    protected override void OnMouseLeave(EventArgs e)
    {
        base.OnMouseLeave(e);
        _hover = false;
        _pressed = false;
        Invalidate();
    }

    protected override void OnMouseDown(MouseEventArgs e)
    {
        base.OnMouseDown(e);
        if (e.Button == MouseButtons.Left)
        {
            _pressed = true;
            Invalidate();
        }
    }

    protected override void OnMouseUp(MouseEventArgs e)
    {
        base.OnMouseUp(e);
        _pressed = false;
        Invalidate();
    }

    protected override void OnEnabledChanged(EventArgs e)
    {
        base.OnEnabledChanged(e);
        Invalidate();
    }

    protected override void OnVisibleChanged(EventArgs e)
    {
        base.OnVisibleChanged(e);
        if (Visible) Invalidate();
    }

    protected override void OnParentChanged(EventArgs e)
    {
        base.OnParentChanged(e);
        Invalidate();
    }

    protected override void OnTextChanged(EventArgs e)
    {
        base.OnTextChanged(e);
        Invalidate();
    }

    protected override void OnPaintBackground(PaintEventArgs e)
    {
        // Custom-painted transparent/ghost buttons must explicitly erase the
        // previous frame. Without this, old text pixels can remain visible
        // after switching embedded Forms until a hover forces an opaque repaint.
        using var background = new SolidBrush(GetEffectiveParentBackColor());
        e.Graphics.FillRectangle(background, ClientRectangle);
    }

    protected override void OnPaint(PaintEventArgs e)
    {
        OnPaintBackground(e);

        e.Graphics.SmoothingMode = SmoothingMode.AntiAlias;
        e.Graphics.PixelOffsetMode = PixelOffsetMode.HighQuality;

        var bounds = ClientRectangle;
        bounds.Inflate(-1, -1);
        if (bounds.Width <= 0 || bounds.Height <= 0) return;

        using var path = UiHelper.Rounded(bounds, Radius);

        var fillColor = ResolveFillColor();
        using (var brush = new SolidBrush(fillColor))
            e.Graphics.FillPath(brush, path);

        if (ButtonStyle == ModernButtonStyle.Secondary)
        {
            using var border = new Pen(ThemeColors.Border);
            e.Graphics.DrawPath(border, path);
        }
        else if (ButtonStyle == ModernButtonStyle.Ghost && _hover)
        {
            using var border = new Pen(ThemeColors.Border);
            e.Graphics.DrawPath(border, path);
        }

        var foreColor = ButtonStyle is ModernButtonStyle.Primary or ModernButtonStyle.Danger
            ? Color.White
            : ThemeColors.TextPrimary;

        if (!Enabled)
            foreColor = ThemeColors.TextSecondary;

        TextRenderer.DrawText(
            e.Graphics,
            Text,
            Font,
            ClientRectangle,
            foreColor,
            TextFormatFlags.HorizontalCenter |
            TextFormatFlags.VerticalCenter |
            TextFormatFlags.SingleLine |
            TextFormatFlags.EndEllipsis |
            TextFormatFlags.NoPadding);
    }

    private Color ResolveFillColor()
    {
        if (!Enabled)
            return Color.FromArgb(210, 214, 220);

        if (ButtonStyle == ModernButtonStyle.Ghost)
        {
            if (_pressed) return ThemeColors.Selection;
            if (_hover) return ThemeColors.Hover;
            // Use an opaque parent-matching color rather than Color.Transparent.
            // This is the core fix for the stale/overlapping label artifact.
            return GetEffectiveParentBackColor();
        }

        var color = ButtonStyle switch
        {
            ModernButtonStyle.Primary => ThemeColors.Primary,
            ModernButtonStyle.Danger => ThemeColors.Danger,
            ModernButtonStyle.Secondary => ThemeColors.PrimarySoft,
            _ => GetEffectiveParentBackColor()
        };

        if (_pressed) return ControlPaint.Dark(color, 0.12f);
        if (_hover) return ControlPaint.Light(color, 0.08f);
        return color;
    }

    private Color GetEffectiveParentBackColor()
    {
        Control? current = Parent;
        while (current != null)
        {
            var color = current.BackColor;
            if (color.A == 255)
                return color;
            current = current.Parent;
        }

        return ThemeColors.Background;
    }
}
