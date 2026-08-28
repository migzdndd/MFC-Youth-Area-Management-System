using System.Drawing.Drawing2D;
using MFCYouthAreaManagementSystem.UI.Theme;

namespace MFCYouthAreaManagementSystem.UI.Controls;

public sealed class SidebarArtworkPanel : Panel
{
    private const string ArtworkRelativePath = "Assets/Sidebar/SidebarDecoration.png";
    private Image? _artwork;

    public SidebarArtworkPanel()
    {
        Dock = DockStyle.Fill;
        Margin = Padding.Empty;
        Padding = Padding.Empty;
        BackColor = ThemeColors.Primary;

        SetStyle(
            ControlStyles.AllPaintingInWmPaint |
            ControlStyles.UserPaint |
            ControlStyles.OptimizedDoubleBuffer |
            ControlStyles.ResizeRedraw,
            true);

        LoadArtwork();
    }

    private void LoadArtwork()
    {
        var path = Path.Combine(AppContext.BaseDirectory, ArtworkRelativePath);
        if (!File.Exists(path)) return;

        try
        {

            using var stream = File.OpenRead(path);
            using var source = Image.FromStream(stream);
            _artwork = new Bitmap(source);
        }
        catch
        {

            _artwork = null;
        }
    }

    protected override void OnPaint(PaintEventArgs e)
    {
        base.OnPaint(e);

        if (_artwork != null)
        {
            DrawCustomArtwork(e.Graphics);
            return;
        }

        DrawFallbackChevrons(e.Graphics);
    }

    private void DrawCustomArtwork(Graphics graphics)
    {
        if (_artwork == null || ClientSize.Width <= 0 || ClientSize.Height <= 0) return;

        graphics.InterpolationMode = InterpolationMode.HighQualityBicubic;
        graphics.PixelOffsetMode = PixelOffsetMode.HighQuality;
        graphics.CompositingQuality = CompositingQuality.HighQuality;

        var widthScale = ClientSize.Width / (float)_artwork.Width;
        var heightScale = ClientSize.Height / (float)_artwork.Height;
        var scale = Math.Min(widthScale, heightScale);

        var drawWidth = Math.Max(1, (int)Math.Round(_artwork.Width * scale));
        var drawHeight = Math.Max(1, (int)Math.Round(_artwork.Height * scale));
        var x = (ClientSize.Width - drawWidth) / 2;
        var y = ClientSize.Height - drawHeight;

        graphics.DrawImage(_artwork, new Rectangle(x, y, drawWidth, drawHeight));
    }

    private void DrawFallbackChevrons(Graphics graphics)
    {
        if (ClientSize.Width <= 0 || ClientSize.Height <= 0) return;

        graphics.SmoothingMode = SmoothingMode.AntiAlias;

        var width = ClientSize.Width;
        var height = ClientSize.Height;
        var center = width / 2f;

        using var accentBrush = new SolidBrush(ThemeColors.Accent);

        DrawChevronBand(graphics, accentBrush, center, width, height, 0.18f, 0.50f, 0.18f);
        DrawChevronBand(graphics, accentBrush, center, width, height, 0.48f, 0.80f, 0.18f);
        var lower = new[]
        {
            new PointF(0, height * 0.78f),
            new PointF(center, height),
            new PointF(width, height * 0.78f),
            new PointF(width, height),
            new PointF(0, height)
        };
        graphics.FillPolygon(accentBrush, lower);
    }

    private static void DrawChevronBand(
        Graphics graphics,
        Brush brush,
        float center,
        float width,
        float height,
        float topRatio,
        float pointRatio,
        float thicknessRatio)
    {
        var top = height * topRatio;
        var point = height * pointRatio;
        var thickness = height * thicknessRatio;

        var polygon = new[]
        {
            new PointF(0, top),
            new PointF(center, point),
            new PointF(width, top),
            new PointF(width, top + thickness),
            new PointF(center, point + thickness),
            new PointF(0, top + thickness)
        };

        graphics.FillPolygon(brush, polygon);
    }

    protected override void Dispose(bool disposing)
    {
        if (disposing)
        {
            _artwork?.Dispose();
            _artwork = null;
        }

        base.Dispose(disposing);
    }
}
