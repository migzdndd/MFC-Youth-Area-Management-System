using System.Drawing.Printing;
using MFCYouthAreaManagementSystem.Models;
using MFCYouthAreaManagementSystem.UI.Theme;

namespace MFCYouthAreaManagementSystem.Utilities;

public sealed record ActivityReportPdfExportContext(
    string Search,
    string Chapter,
    string ReportType,
    string Period,
    DateTime GeneratedAt);

/// <summary>
/// Exports Activity Reports through the Windows built-in "Microsoft Print to PDF" printer.
/// This keeps PDF generation offline and avoids adding another application/runtime dependency.
/// </summary>
public static class ActivityReportPdfExporter
{
    private const string PdfPrinterName = "Microsoft Print to PDF";

    public static bool IsPdfPrinterAvailable()
    {
        try
        {
            return PrinterSettings.InstalledPrinters
                .Cast<string>()
                .Any(name => string.Equals(name, PdfPrinterName, StringComparison.OrdinalIgnoreCase));
        }
        catch
        {
            return false;
        }
    }

    public static void Export(
        string outputPath,
        IReadOnlyList<ActivityReport> reports,
        ActivityReportPdfExportContext context)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(outputPath);
        ArgumentNullException.ThrowIfNull(reports);
        ArgumentNullException.ThrowIfNull(context);

        if (reports.Count == 0)
            throw new InvalidOperationException("There are no Activity Reports to export.");

        if (!IsPdfPrinterAvailable())
            throw new InvalidOperationException(
                "Microsoft Print to PDF is not available on this Windows installation. " +
                "Enable it in Windows Features, then try exporting again.");

        var fullPath = Path.GetFullPath(outputPath);
        var directory = Path.GetDirectoryName(fullPath);
        if (string.IsNullOrWhiteSpace(directory))
            throw new InvalidOperationException("The selected PDF location is invalid.");
        Directory.CreateDirectory(directory);
        if (File.Exists(fullPath)) File.Delete(fullPath);

        using var renderer = new ActivityReportPrintRenderer(reports, context);
        using var document = new PrintDocument
        {
            DocumentName = "MFC Youth Activity Reports & Analytics",
            PrintController = new StandardPrintController()
        };

        document.PrinterSettings.PrinterName = PdfPrinterName;
        document.PrinterSettings.PrintToFile = true;
        document.PrinterSettings.PrintFileName = fullPath;

        if (!document.PrinterSettings.IsValid)
            throw new InvalidOperationException("Microsoft Print to PDF could not be initialized.");

        document.DefaultPageSettings.Landscape = false;
        document.DefaultPageSettings.Color = true;
        document.DefaultPageSettings.Margins = new Margins(55, 55, 55, 55);

        var a4 = document.PrinterSettings.PaperSizes
            .Cast<PaperSize>()
            .FirstOrDefault(size => size.Kind == PaperKind.A4 ||
                                    size.PaperName.Contains("A4", StringComparison.OrdinalIgnoreCase));
        if (a4 != null) document.DefaultPageSettings.PaperSize = a4;

        document.BeginPrint += renderer.OnBeginPrint;
        document.PrintPage += renderer.OnPrintPage;
        document.Print();

        WaitForPdfOutput(fullPath);
        if (!File.Exists(fullPath) || new FileInfo(fullPath).Length == 0)
            throw new IOException("Windows did not create the PDF file at the selected location.");
    }

    private static void WaitForPdfOutput(string fullPath)
    {
        // The Windows PDF print driver can finish writing a fraction of a second
        // after PrintDocument.Print() returns. Give it a short bounded window so
        // a successful export is not incorrectly reported as a failure.
        for (var attempt = 0; attempt < 20; attempt++)
        {
            if (File.Exists(fullPath))
            {
                try
                {
                    if (new FileInfo(fullPath).Length > 0) return;
                }
                catch (IOException)
                {
                    // The spooler may still have the file open. Retry briefly.
                }
            }

            System.Threading.Thread.Sleep(50);
        }
    }

    private sealed class ActivityReportPrintRenderer : IDisposable
    {
        private readonly IReadOnlyList<ActivityReport> _reports;
        private readonly ActivityReportPdfExportContext _context;
        private readonly Font _brandFont = new("Segoe UI", 16, FontStyle.Bold);
        private readonly Font _titleFont = new("Segoe UI", 11.5f, FontStyle.Bold);
        private readonly Font _sectionFont = new("Segoe UI", 10, FontStyle.Bold);
        private readonly Font _bodyFont = new("Segoe UI", 9.25f, FontStyle.Regular);
        private readonly Font _bodyBoldFont = new("Segoe UI", 9.25f, FontStyle.Bold);
        private readonly Font _smallFont = new("Segoe UI", 8, FontStyle.Regular);
        private readonly Font _smallBoldFont = new("Segoe UI", 8, FontStyle.Bold);
        private readonly Font _metricFont = new("Segoe UI", 16, FontStyle.Bold);
        private readonly Font _metricLabelFont = new("Segoe UI", 7.5f, FontStyle.Bold);
        private readonly List<DocumentItem> _detailItems = new();
        private int _detailIndex;
        private int _pageNumber;
        private bool _itemsBuilt;

        public ActivityReportPrintRenderer(
            IReadOnlyList<ActivityReport> reports,
            ActivityReportPdfExportContext context)
        {
            _reports = reports;
            _context = context;
        }

        public void OnBeginPrint(object? sender, PrintEventArgs e)
        {
            _detailIndex = 0;
            _pageNumber = 0;
            _itemsBuilt = false;
            _detailItems.Clear();
        }

        public void OnPrintPage(object? sender, PrintPageEventArgs e)
        {
            _pageNumber++;
            var graphics = e.Graphics;
            graphics.TextRenderingHint = System.Drawing.Text.TextRenderingHint.AntiAliasGridFit;

            var bounds = new RectangleF(
                e.MarginBounds.Left,
                e.MarginBounds.Top,
                e.MarginBounds.Width,
                e.MarginBounds.Height);

            if (!_itemsBuilt)
            {
                BuildDetailItems(graphics, bounds.Width);
                _itemsBuilt = true;
            }

            var y = DrawHeader(graphics, bounds);
            var bottom = bounds.Bottom - 24f;
            using var sectionBrush = Brush(ThemeColors.Primary);

            if (_pageNumber == 1)
            {
                y = DrawScope(graphics, bounds, y);
                y = DrawMetrics(graphics, bounds, y);
                y = DrawAnalyticsSnapshot(graphics, bounds, y);
                y += 5f;
                graphics.DrawString("Detailed Activity Reports", _sectionFont, sectionBrush, bounds.Left, y);
                y += _sectionFont.GetHeight(graphics) + 8f;
            }
            else
            {
                graphics.DrawString("Detailed Activity Reports (continued)", _sectionFont, sectionBrush, bounds.Left, y);
                y += _sectionFont.GetHeight(graphics) + 8f;
            }

            DrawDetailItems(graphics, bounds, ref y, bottom);
            DrawFooter(graphics, bounds);

            e.HasMorePages = _detailIndex < _detailItems.Count;
        }

        private float DrawHeader(Graphics graphics, RectangleF bounds)
        {
            const float headerHeight = 62f;
            using var primary = Brush(ThemeColors.Primary);
            using var gold = Brush(ThemeColors.Accent);
            using var white = new SolidBrush(Color.White);
            using var mutedWhite = new SolidBrush(Color.FromArgb(220, 235, 242, 250));

            graphics.FillRectangle(primary, bounds.Left, bounds.Top, bounds.Width, headerHeight);
            graphics.FillRectangle(gold, bounds.Left, bounds.Top + headerHeight - 5f, bounds.Width, 5f);
            graphics.DrawString("MFC YOUTH", _smallBoldFont, mutedWhite, bounds.Left + 16f, bounds.Top + 10f);
            graphics.DrawString("Activity Reports & Analytics", _brandFont, white, bounds.Left + 16f, bounds.Top + 24f);

            return bounds.Top + headerHeight + 13f;
        }

        private float DrawScope(Graphics graphics, RectangleF bounds, float y)
        {
            const float height = 72f;
            using var surface = Brush(Color.FromArgb(248, 250, 252));
            using var border = Pen(Color.FromArgb(220, 226, 234));
            using var text = Brush(ThemeColors.TextPrimary);
            using var secondary = Brush(ThemeColors.TextSecondary);

            var rect = new RectangleF(bounds.Left, y, bounds.Width, height);
            graphics.FillRectangle(surface, rect);
            graphics.DrawRectangle(border, rect.X, rect.Y, rect.Width, rect.Height);
            graphics.DrawString("EXPORT SCOPE", _smallBoldFont, text, rect.Left + 12f, rect.Top + 8f);

            var colWidth = (rect.Width - 36f) / 2f;
            var leftX = rect.Left + 12f;
            var rightX = rect.Left + 24f + colWidth;
            var firstRow = rect.Top + 27f;
            var secondRow = rect.Top + 48f;

            DrawScopeValue(graphics, "Search", DisplayValue(_context.Search, "None"), leftX, firstRow, colWidth - 8f, secondary, text);
            DrawScopeValue(graphics, "Chapter", DisplayValue(_context.Chapter, "All Chapters"), rightX, firstRow, colWidth - 8f, secondary, text);
            DrawScopeValue(graphics, "Report Type", DisplayValue(_context.ReportType, "All Types"), leftX, secondRow, colWidth - 8f, secondary, text);
            DrawScopeValue(graphics, "Period", DisplayValue(_context.Period, "All Time"), rightX, secondRow, colWidth - 8f, secondary, text);

            return rect.Bottom + 10f;
        }

        private void DrawScopeValue(
            Graphics graphics,
            string label,
            string value,
            float x,
            float y,
            float width,
            Brush labelBrush,
            Brush valueBrush)
        {
            graphics.DrawString(label + ":", _smallBoldFont, labelBrush, x, y);
            var labelWidth = graphics.MeasureString(label + ":", _smallBoldFont).Width + 4f;
            var clean = FitText(graphics, value, _smallFont, Math.Max(30f, width - labelWidth));
            graphics.DrawString(clean, _smallFont, valueBrush, x + labelWidth, y);
        }

        private float DrawMetrics(Graphics graphics, RectangleF bounds, float y)
        {
            const float height = 65f;
            const float gap = 8f;
            var cardWidth = (bounds.Width - gap * 3f) / 4f;
            var today = _context.GeneratedAt.Date;
            var monthStart = new DateTime(today.Year, today.Month, 1);
            var metrics = new[]
            {
                new Metric("MATCHING REPORTS", _reports.Count.ToString(), ThemeColors.ActionBlue),
                new Metric("THIS MONTH", _reports.Count(r => r.ReportDate.Date >= monthStart && r.ReportDate.Date <= today).ToString(), ThemeColors.Success),
                new Metric("CHAPTERS", DistinctCount(_reports.Select(r => r.ChapterName)).ToString(), ThemeColors.Accent),
                new Metric("REPORT TYPES", DistinctCount(_reports.Select(r => r.ReportType)).ToString(), ThemeColors.Warning)
            };

            for (var i = 0; i < metrics.Length; i++)
            {
                var rect = new RectangleF(bounds.Left + i * (cardWidth + gap), y, cardWidth, height);
                DrawMetricCard(graphics, rect, metrics[i]);
            }

            return y + height + 10f;
        }

        private void DrawMetricCard(Graphics graphics, RectangleF rect, Metric metric)
        {
            using var surface = Brush(Color.White);
            using var border = Pen(Color.FromArgb(220, 226, 234));
            using var accent = Brush(metric.Accent);
            using var value = Brush(ThemeColors.TextPrimary);
            using var label = Brush(ThemeColors.TextSecondary);

            graphics.FillRectangle(surface, rect);
            graphics.DrawRectangle(border, rect.X, rect.Y, rect.Width, rect.Height);
            graphics.FillRectangle(accent, rect.X, rect.Y, 4f, rect.Height);
            graphics.DrawString(metric.Value, _metricFont, value, rect.Left + 12f, rect.Top + 8f);
            graphics.DrawString(metric.Label, _metricLabelFont, label, rect.Left + 12f, rect.Top + 39f);
        }

        private float DrawAnalyticsSnapshot(Graphics graphics, RectangleF bounds, float y)
        {
            const float height = 142f;
            using var border = Pen(Color.FromArgb(220, 226, 234));
            using var surface = Brush(Color.White);
            using var primaryText = Brush(ThemeColors.TextPrimary);
            using var secondaryText = Brush(ThemeColors.TextSecondary);

            var rect = new RectangleF(bounds.Left, y, bounds.Width, height);
            graphics.FillRectangle(surface, rect);
            graphics.DrawRectangle(border, rect.X, rect.Y, rect.Width, rect.Height);
            graphics.DrawString("ANALYTICS SNAPSHOT", _smallBoldFont, primaryText, rect.Left + 12f, rect.Top + 8f);

            var contentTop = rect.Top + 30f;
            var chartWidth = rect.Width * 0.49f;
            var chartRect = new RectangleF(rect.Left + 12f, contentTop, chartWidth - 18f, 96f);
            DrawMonthlyBars(graphics, chartRect, primaryText, secondaryText);

            var listX = rect.Left + chartWidth + 12f;
            var listWidth = rect.Right - listX - 12f;
            var halfWidth = (listWidth - 12f) / 2f;
            DrawRanking(graphics, "Top Report Types", TopGroups(_reports.Select(r => r.ReportType), 3, "Unspecified"),
                new RectangleF(listX, contentTop, halfWidth, 98f), primaryText, secondaryText);
            DrawRanking(graphics, "Top Chapters", TopGroups(_reports.Select(r => r.ChapterName), 3, "Unassigned"),
                new RectangleF(listX + halfWidth + 12f, contentTop, halfWidth, 98f), primaryText, secondaryText);

            return rect.Bottom + 10f;
        }

        private void DrawMonthlyBars(Graphics graphics, RectangleF rect, Brush primaryText, Brush secondaryText)
        {
            graphics.DrawString("6-Month Activity", _smallBoldFont, primaryText, rect.Left, rect.Top);

            var anchor = _reports.Count > 0 ? _reports.Max(r => r.ReportDate.Date) : _context.GeneratedAt.Date;
            var anchorMonth = new DateTime(anchor.Year, anchor.Month, 1);
            var months = Enumerable.Range(0, 6)
                .Select(offset => anchorMonth.AddMonths(offset - 5))
                .Select(month => new MonthValue(
                    month.ToString("MMM", System.Globalization.CultureInfo.InvariantCulture),
                    _reports.Count(r => r.ReportDate.Year == month.Year && r.ReportDate.Month == month.Month)))
                .ToArray();

            var max = Math.Max(1, months.Max(item => item.Value));
            var chartTop = rect.Top + 21f;
            var chartBottom = rect.Bottom - 18f;
            var chartHeight = Math.Max(20f, chartBottom - chartTop);
            var slot = rect.Width / months.Length;
            var barWidth = Math.Max(8f, slot * 0.48f);

            using var bar = Brush(ThemeColors.ActionBlue);
            using var axis = Pen(Color.FromArgb(220, 226, 234));
            graphics.DrawLine(axis, rect.Left, chartBottom, rect.Right, chartBottom);

            for (var i = 0; i < months.Length; i++)
            {
                var item = months[i];
                var height = item.Value == 0 ? 2f : (item.Value / (float)max) * (chartHeight - 8f);
                var x = rect.Left + i * slot + (slot - barWidth) / 2f;
                graphics.FillRectangle(bar, x, chartBottom - height, barWidth, height);

                var countText = item.Value.ToString();
                var countWidth = graphics.MeasureString(countText, _smallBoldFont).Width;
                graphics.DrawString(countText, _smallBoldFont, primaryText, x + (barWidth - countWidth) / 2f, chartBottom - height - 13f);

                var labelWidth = graphics.MeasureString(item.Label, _smallFont).Width;
                graphics.DrawString(item.Label, _smallFont, secondaryText, x + (barWidth - labelWidth) / 2f, chartBottom + 2f);
            }
        }

        private void DrawRanking(
            Graphics graphics,
            string title,
            IReadOnlyList<KeyValuePair<string, int>> items,
            RectangleF rect,
            Brush primaryText,
            Brush secondaryText)
        {
            graphics.DrawString(title, _smallBoldFont, primaryText, rect.Left, rect.Top);
            var y = rect.Top + 21f;

            if (items.Count == 0)
            {
                graphics.DrawString("No data", _smallFont, secondaryText, rect.Left, y);
                return;
            }

            for (var i = 0; i < items.Count; i++)
            {
                var item = items[i];
                var percentage = _reports.Count == 0 ? 0d : item.Value * 100d / _reports.Count;
                var count = $"{item.Value} ({percentage:0}%)";
                var countWidth = graphics.MeasureString(count, _smallBoldFont).Width;
                var labelWidth = Math.Max(30f, rect.Width - countWidth - 22f);
                var label = FitText(graphics, $"{i + 1}. {item.Key}", _smallFont, labelWidth);
                graphics.DrawString(label, _smallFont, primaryText, rect.Left, y);
                graphics.DrawString(count, _smallBoldFont, secondaryText, rect.Right - countWidth, y);
                y += 20f;
            }
        }

        private void BuildDetailItems(Graphics graphics, float pageWidth)
        {
            var textWidth = Math.Max(120f, pageWidth - 24f);

            for (var i = 0; i < _reports.Count; i++)
            {
                var report = _reports[i];
                _detailItems.Add(new DocumentItem(DocumentItemKind.ReportStart, string.Empty));

                var title = $"{i + 1}. {DisplayValue(report.Title, "Untitled Report")}";
                foreach (var line in WrapText(graphics, title, _titleFont, textWidth))
                    _detailItems.Add(new DocumentItem(DocumentItemKind.Title, line));

                var metadata = $"{report.ReportDate:MMM d, yyyy} | {DisplayValue(report.ChapterName, "Unassigned")} | " +
                               $"{DisplayValue(report.ReportType, "Unspecified")} | Prepared by: {DisplayValue(report.PreparedBy, "Unspecified")}";
                foreach (var line in WrapText(graphics, metadata, _smallFont, textWidth))
                    _detailItems.Add(new DocumentItem(DocumentItemKind.Metadata, line));

                _detailItems.Add(new DocumentItem(DocumentItemKind.Spacer, string.Empty));
                _detailItems.Add(new DocumentItem(DocumentItemKind.Label, "Activity"));
                foreach (var line in WrapText(graphics, DisplayValue(report.Activity, "No activity details provided."), _bodyFont, textWidth))
                    _detailItems.Add(new DocumentItem(DocumentItemKind.Body, line));

                _detailItems.Add(new DocumentItem(DocumentItemKind.Spacer, string.Empty));
                _detailItems.Add(new DocumentItem(DocumentItemKind.Label, "Description"));
                foreach (var line in WrapText(graphics, DisplayValue(report.Description, "No description provided."), _bodyFont, textWidth))
                    _detailItems.Add(new DocumentItem(DocumentItemKind.Body, line));

                _detailItems.Add(new DocumentItem(DocumentItemKind.Divider, string.Empty));
            }
        }

        private void DrawDetailItems(Graphics graphics, RectangleF bounds, ref float y, float bottom)
        {
            using var primary = Brush(ThemeColors.Primary);
            using var text = Brush(ThemeColors.TextPrimary);
            using var secondary = Brush(ThemeColors.TextSecondary);
            using var divider = Pen(Color.FromArgb(220, 226, 234));

            var x = bounds.Left + 10f;
            var maxWidth = bounds.Width - 20f;

            while (_detailIndex < _detailItems.Count)
            {
                var item = _detailItems[_detailIndex];

                if (item.Kind == DocumentItemKind.ReportStart)
                {
                    if (y + 64f > bottom) return;
                    _detailIndex++;
                    continue;
                }

                if (item.Kind == DocumentItemKind.Spacer)
                {
                    if (y + 5f > bottom) return;
                    y += 5f;
                    _detailIndex++;
                    continue;
                }

                if (item.Kind == DocumentItemKind.Divider)
                {
                    if (y + 13f > bottom) return;
                    y += 6f;
                    graphics.DrawLine(divider, x, y, x + maxWidth, y);
                    y += 7f;
                    _detailIndex++;
                    continue;
                }

                var (font, brush, spacing) = item.Kind switch
                {
                    DocumentItemKind.Title => (_titleFont, primary, 3f),
                    DocumentItemKind.Metadata => (_smallFont, secondary, 2f),
                    DocumentItemKind.Label => (_bodyBoldFont, text, 2f),
                    _ => (_bodyFont, text, 2.5f)
                };
                var lineHeight = font.GetHeight(graphics) + spacing;

                // Keep section labels with at least the first line of their body
                // instead of leaving "Activity" or "Description" orphaned at
                // the bottom of a page.
                if (item.Kind == DocumentItemKind.Label && _detailIndex + 1 < _detailItems.Count &&
                    _detailItems[_detailIndex + 1].Kind == DocumentItemKind.Body)
                {
                    var nextLineHeight = _bodyFont.GetHeight(graphics) + 2.5f;
                    if (y + lineHeight + nextLineHeight > bottom) return;
                }
                else if (y + lineHeight > bottom)
                {
                    return;
                }

                graphics.DrawString(item.Text, font, brush, new RectangleF(x, y, maxWidth, lineHeight + 2f));
                y += lineHeight;
                _detailIndex++;
            }
        }

        private void DrawFooter(Graphics graphics, RectangleF bounds)
        {
            using var secondary = Brush(ThemeColors.TextSecondary);
            using var line = Pen(Color.FromArgb(220, 226, 234));
            var y = bounds.Bottom - 17f;
            graphics.DrawLine(line, bounds.Left, y - 5f, bounds.Right, y - 5f);
            graphics.DrawString($"Generated {_context.GeneratedAt:MMM d, yyyy h:mm tt}", _smallFont, secondary, bounds.Left, y);

            var pageText = $"Page {_pageNumber}";
            var pageWidth = graphics.MeasureString(pageText, _smallFont).Width;
            graphics.DrawString(pageText, _smallFont, secondary, bounds.Right - pageWidth, y);
        }

        private static IReadOnlyList<KeyValuePair<string, int>> TopGroups(
            IEnumerable<string> values,
            int take,
            string fallback) =>
            values
                .Select(value => DisplayValue(value, fallback))
                .GroupBy(value => value, StringComparer.OrdinalIgnoreCase)
                .Select(group => new KeyValuePair<string, int>(group.Key, group.Count()))
                .OrderByDescending(item => item.Value)
                .ThenBy(item => item.Key, StringComparer.OrdinalIgnoreCase)
                .Take(take)
                .ToList();

        private static int DistinctCount(IEnumerable<string> values) =>
            values
                .Select(value => value?.Trim() ?? string.Empty)
                .Where(value => value.Length > 0)
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .Count();

        private static IEnumerable<string> WrapText(Graphics graphics, string text, Font font, float maxWidth)
        {
            var normalized = (text ?? string.Empty).Replace("\r\n", "\n").Replace('\r', '\n').Replace('\t', ' ');
            foreach (var paragraph in normalized.Split('\n'))
            {
                var cleanParagraph = paragraph.Trim();
                if (cleanParagraph.Length == 0)
                {
                    yield return string.Empty;
                    continue;
                }

                var words = cleanParagraph.Split(' ', StringSplitOptions.RemoveEmptyEntries);
                var line = string.Empty;

                foreach (var word in words)
                {
                    var candidate = line.Length == 0 ? word : line + " " + word;
                    if (graphics.MeasureString(candidate, font).Width <= maxWidth)
                    {
                        line = candidate;
                        continue;
                    }

                    if (line.Length > 0)
                    {
                        yield return line;
                        line = string.Empty;
                    }

                    if (graphics.MeasureString(word, font).Width <= maxWidth)
                    {
                        line = word;
                        continue;
                    }

                    var parts = BreakLongWord(graphics, word, font, maxWidth).ToList();
                    for (var i = 0; i < parts.Count; i++)
                    {
                        if (i < parts.Count - 1)
                            yield return parts[i];
                        else
                            line = parts[i];
                    }
                }

                if (line.Length > 0) yield return line;
            }
        }

        private static IEnumerable<string> BreakLongWord(Graphics graphics, string word, Font font, float maxWidth)
        {
            var current = string.Empty;
            foreach (var ch in word)
            {
                var candidate = current + ch;
                if (current.Length > 0 && graphics.MeasureString(candidate, font).Width > maxWidth)
                {
                    yield return current;
                    current = ch.ToString();
                }
                else
                {
                    current = candidate;
                }
            }
            if (current.Length > 0) yield return current;
        }

        private static string FitText(Graphics graphics, string value, Font font, float maxWidth)
        {
            var clean = value.Trim();
            if (graphics.MeasureString(clean, font).Width <= maxWidth) return clean;

            const string suffix = "...";
            while (clean.Length > 1 && graphics.MeasureString(clean + suffix, font).Width > maxWidth)
                clean = clean[..^1];
            return clean.TrimEnd() + suffix;
        }

        private static string DisplayValue(string? value, string fallback)
        {
            var clean = value?.Trim();
            return string.IsNullOrWhiteSpace(clean) ? fallback : clean;
        }

        private static SolidBrush Brush(Color color) => new(color);
        private static Pen Pen(Color color) => new(color, 1f);

        public void Dispose()
        {
            _brandFont.Dispose();
            _titleFont.Dispose();
            _sectionFont.Dispose();
            _bodyFont.Dispose();
            _bodyBoldFont.Dispose();
            _smallFont.Dispose();
            _smallBoldFont.Dispose();
            _metricFont.Dispose();
            _metricLabelFont.Dispose();
        }

        private sealed record Metric(string Label, string Value, Color Accent);
        private sealed record MonthValue(string Label, int Value);
        private sealed record DocumentItem(DocumentItemKind Kind, string Text);
        private enum DocumentItemKind { ReportStart, Title, Metadata, Label, Body, Spacer, Divider }
    }
}
