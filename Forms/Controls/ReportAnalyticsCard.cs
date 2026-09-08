using System.Drawing.Drawing2D;
using MFCYouthAreaManagementSystem.UI.Theme;
using MFCYouthAreaManagementSystem.Utilities;

namespace MFCYouthAreaManagementSystem.UI.Controls;

public enum ReportChartKind
{
    VerticalBars,
    HorizontalBars
}

public sealed class ReportAnalyticsCard : Panel
{
    private readonly Label _title;
    private readonly Label _caption;
    private readonly ReportChartCanvas _canvas;

    public ReportAnalyticsCard(string title, string caption, ReportChartKind kind, Color accentColor)
    {
        DoubleBuffered = true;
        BackColor = ThemeColors.Surface;
        Padding = new Padding(16, 12, 16, 12);
        Margin = Padding.Empty;
        MinimumSize = new Size(220, 210);

        var layout = new TableLayoutPanel
        {
            Dock = DockStyle.Fill,
            ColumnCount = 1,
            RowCount = 3,
            BackColor = Color.Transparent,
            Margin = Padding.Empty,
            Padding = Padding.Empty
        };
        layout.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 100));
        layout.RowStyles.Add(new RowStyle(SizeType.Absolute, 28));
        layout.RowStyles.Add(new RowStyle(SizeType.Absolute, 24));
        layout.RowStyles.Add(new RowStyle(SizeType.Percent, 100));

        _title = new Label
        {
            Text = title,
            Dock = DockStyle.Fill,
            Font = ThemeFonts.BodyBold,
            ForeColor = ThemeColors.Primary,
            TextAlign = ContentAlignment.MiddleLeft,
            AutoEllipsis = true,
            Margin = Padding.Empty
        };

        _caption = new Label
        {
            Text = caption,
            Dock = DockStyle.Fill,
            Font = ThemeFonts.Small,
            ForeColor = ThemeColors.TextSecondary,
            TextAlign = ContentAlignment.TopLeft,
            AutoEllipsis = true,
            Margin = Padding.Empty
        };

        _canvas = new ReportChartCanvas(kind, accentColor)
        {
            Dock = DockStyle.Fill,
            Margin = Padding.Empty
        };

        layout.Controls.Add(_title, 0, 0);
        layout.Controls.Add(_caption, 0, 1);
        layout.Controls.Add(_canvas, 0, 2);
        Controls.Add(layout);
    }

    public void SetData(IEnumerable<KeyValuePair<string, int>> items)
    {
        _canvas.SetData(items);
    }

    public void SetCaption(string caption)
    {
        _caption.Text = caption;
    }

    protected override void OnPaint(PaintEventArgs e)
    {
        base.OnPaint(e);
        e.Graphics.SmoothingMode = SmoothingMode.AntiAlias;

        var bounds = new Rectangle(0, 0, Width - 1, Height - 1);
        if (bounds.Width <= 1 || bounds.Height <= 1) return;

        using var path = UiHelper.Rounded(bounds, ThemeSizes.Radius);
        using var border = new Pen(ThemeColors.Border);
        e.Graphics.DrawPath(border, path);
    }

    private sealed class ReportChartCanvas : Control
    {
        private readonly ReportChartKind _kind;
        private readonly Color _accentColor;
        private List<KeyValuePair<string, int>> _data = new();

        public ReportChartCanvas(ReportChartKind kind, Color accentColor)
        {
            _kind = kind;
            _accentColor = accentColor;
            DoubleBuffered = true;
            BackColor = ThemeColors.Surface;
            Font = ThemeFonts.Small;
            SetStyle(ControlStyles.ResizeRedraw, true);
        }

        public void SetData(IEnumerable<KeyValuePair<string, int>> items)
        {
            _data = items
                .Where(item => !string.IsNullOrWhiteSpace(item.Key) && item.Value >= 0)
                .ToList();
            Invalidate();
        }

        protected override void OnPaint(PaintEventArgs e)
        {
            base.OnPaint(e);
            e.Graphics.SmoothingMode = SmoothingMode.AntiAlias;
            e.Graphics.TextRenderingHint = System.Drawing.Text.TextRenderingHint.ClearTypeGridFit;

            if (Width < 80 || Height < 80) return;
            if (_data.Count == 0 || _data.All(item => item.Value == 0))
            {
                DrawEmptyState(e.Graphics);
                return;
            }

            if (_kind == ReportChartKind.VerticalBars)
                DrawVerticalBars(e.Graphics);
            else
                DrawHorizontalBars(e.Graphics);
        }

        private void DrawEmptyState(Graphics graphics)
        {
            var text = "No matching activity yet";
            using var brush = new SolidBrush(ThemeColors.TextSecondary);
            using var format = new StringFormat
            {
                Alignment = StringAlignment.Center,
                LineAlignment = StringAlignment.Center
            };
            graphics.DrawString(text, ThemeFonts.Small, brush, ClientRectangle, format);
        }

        private void DrawVerticalBars(Graphics graphics)
        {
            var data = _data.Take(8).ToList();
            var max = Math.Max(1, data.Max(item => item.Value));
            var plot = new Rectangle(34, 8, Math.Max(1, Width - 44), Math.Max(1, Height - 43));

            using var gridPen = new Pen(ThemeColors.Border);
            using var textBrush = new SolidBrush(ThemeColors.TextSecondary);
            using var barBrush = new SolidBrush(_accentColor);

            for (var i = 0; i <= 2; i++)
            {
                var y = plot.Top + (plot.Height * i / 2f);
                graphics.DrawLine(gridPen, plot.Left, y, plot.Right, y);
                var guideValue = (int)Math.Round(max * (2 - i) / 2d);
                var guide = guideValue.ToString();
                var size = graphics.MeasureString(guide, ThemeFonts.Small);
                graphics.DrawString(guide, ThemeFonts.Small, textBrush, plot.Left - size.Width - 5, y - size.Height / 2f);
            }

            var slot = plot.Width / (float)Math.Max(1, data.Count);
            var barWidth = Math.Max(10f, Math.Min(34f, slot * 0.48f));

            for (var i = 0; i < data.Count; i++)
            {
                var item = data[i];
                var barHeight = item.Value <= 0 ? 1f : plot.Height * (item.Value / (float)max);
                var x = plot.Left + (slot * i) + ((slot - barWidth) / 2f);
                var y = plot.Bottom - barHeight;
                var rect = new RectangleF(x, y, barWidth, barHeight);
                graphics.FillRectangle(barBrush, rect);

                var valueText = item.Value.ToString();
                var valueSize = graphics.MeasureString(valueText, ThemeFonts.SmallBold);
                graphics.DrawString(valueText, ThemeFonts.SmallBold, textBrush,
                    x + (barWidth - valueSize.Width) / 2f,
                    Math.Max(0, y - valueSize.Height - 2));

                using var labelFormat = new StringFormat
                {
                    Alignment = StringAlignment.Center,
                    LineAlignment = StringAlignment.Near,
                    Trimming = StringTrimming.EllipsisCharacter,
                    FormatFlags = StringFormatFlags.NoWrap
                };
                var labelRect = new RectangleF(plot.Left + slot * i, plot.Bottom + 6, slot, Height - plot.Bottom - 6);
                graphics.DrawString(item.Key, ThemeFonts.Small, textBrush, labelRect, labelFormat);
            }
        }

        private void DrawHorizontalBars(Graphics graphics)
        {
            var data = _data.Take(6).ToList();
            var max = Math.Max(1, data.Max(item => item.Value));
            var total = Math.Max(1, _data.Sum(item => item.Value));
            var labelWidth = Math.Min(118, Math.Max(82, Width / 3));
            var valueWidth = 66;
            var plotLeft = labelWidth + 8;
            var plotWidth = Math.Max(35, Width - plotLeft - valueWidth - 4);
            var rowHeight = Height / (float)Math.Max(1, data.Count);

            using var textBrush = new SolidBrush(ThemeColors.TextSecondary);
            using var valueBrush = new SolidBrush(ThemeColors.TextPrimary);
            using var barBrush = new SolidBrush(_accentColor);
            using var trackBrush = new SolidBrush(Color.FromArgb(235, 239, 244));

            for (var i = 0; i < data.Count; i++)
            {
                var item = data[i];
                var centerY = (rowHeight * i) + (rowHeight / 2f);
                var trackHeight = Math.Max(9f, Math.Min(16f, rowHeight * 0.28f));
                var trackY = centerY - trackHeight / 2f;
                var barWidth = item.Value <= 0 ? 0f : plotWidth * item.Value / max;

                using var labelFormat = new StringFormat
                {
                    Alignment = StringAlignment.Near,
                    LineAlignment = StringAlignment.Center,
                    Trimming = StringTrimming.EllipsisCharacter,
                    FormatFlags = StringFormatFlags.NoWrap
                };
                var labelRect = new RectangleF(0, rowHeight * i, labelWidth, rowHeight);
                graphics.DrawString(item.Key, ThemeFonts.Small, textBrush, labelRect, labelFormat);

                var trackRect = new RectangleF(plotLeft, trackY, plotWidth, trackHeight);
                graphics.FillRectangle(trackBrush, trackRect);
                if (barWidth > 0)
                    graphics.FillRectangle(barBrush, new RectangleF(plotLeft, trackY, Math.Max(2f, barWidth), trackHeight));

                using var valueFormat = new StringFormat
                {
                    Alignment = StringAlignment.Far,
                    LineAlignment = StringAlignment.Center
                };
                var percentage = item.Value * 100d / total;
                var valueText = $"{item.Value} ({percentage:0}%)";
                var valueRect = new RectangleF(plotLeft + plotWidth + 4, rowHeight * i, valueWidth, rowHeight);
                graphics.DrawString(valueText, ThemeFonts.SmallBold, valueBrush, valueRect, valueFormat);
            }
        }
    }
}
