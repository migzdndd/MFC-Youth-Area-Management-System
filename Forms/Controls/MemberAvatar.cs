using MFCYouthAreaManagementSystem.UI.Theme;

namespace MFCYouthAreaManagementSystem.UI.Controls;

public class MemberAvatar : Panel
{
    private readonly Label _label;

    public string Initials
    {
        get => _label.Text;
        set => _label.Text = value;
    }

    public MemberAvatar()
    {
        Size = new Size(72, 72);
        BackColor = ThemeColors.Primary;
        _label = new Label
        {
            Dock = DockStyle.Fill,
            TextAlign = ContentAlignment.MiddleCenter,
            ForeColor = Color.White,
            Font = new Font("Segoe UI", 18, FontStyle.Bold)
        };
        Controls.Add(_label);
    }

    protected override void OnResize(EventArgs e)
    {
        base.OnResize(e);
        if (ClientSize.Width <= 0 || ClientSize.Height <= 0) return;
        using var path = new System.Drawing.Drawing2D.GraphicsPath();
        path.AddEllipse(ClientRectangle);
        var oldRegion = Region;
        Region = new Region(path);
        oldRegion?.Dispose();
    }
}
