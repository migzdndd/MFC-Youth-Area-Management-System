using System.Drawing.Drawing2D;
using MFCYouthAreaManagementSystem.Repositories;
using MFCYouthAreaManagementSystem.UI.Controls;
using MFCYouthAreaManagementSystem.UI.Theme;
using MFCYouthAreaManagementSystem.Utilities;

namespace MFCYouthAreaManagementSystem.Forms;

public sealed class DashboardHomeForm : Form
{
    private readonly DashboardMetricCell _members = new("Total Members", "People currently on record", ThemeColors.Accent);
    private readonly DashboardMetricCell _chapters = new("Chapters", "Registered chapters", Color.FromArgb(65, 125, 184));
    private readonly DashboardMetricCell _services = new("Services", "Available service roles", Color.FromArgb(94, 117, 177));
    private readonly DashboardMetricCell _reports = new("Activity Reports", "Reports currently filed", ThemeColors.Success);
    private readonly DashboardMetricCell _events = new("Events", "Events currently recorded", ThemeColors.Warning);

    public DashboardHomeForm()
    {
        BackColor = ThemeColors.Background;
        Font = ThemeFonts.Body;
        AutoScaleMode = AutoScaleMode.Dpi;
        Padding = Padding.Empty;

        var root = new TableLayoutPanel
        {
            Dock = DockStyle.Fill,
            ColumnCount = 1,
            RowCount = 3,
            Margin = Padding.Empty,
            Padding = Padding.Empty,
            BackColor = ThemeColors.Background
        };
        root.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 100));
        root.RowStyles.Add(new RowStyle(SizeType.Absolute, ThemeSizes.PageHeaderHeight));
        root.RowStyles.Add(new RowStyle(SizeType.Absolute, 232));
        root.RowStyles.Add(new RowStyle(SizeType.Percent, 100));
        Controls.Add(root);

        root.Controls.Add(
            new PageHeader("Dashboard", "A quick overview of your MFC Youth Area records."),
            0,
            0);

        root.Controls.Add(BuildSummary(), 0, 1);

        Shown += (_, _) => RefreshStats();
    }

    private Control BuildSummary()
    {
        var section = new TableLayoutPanel
        {
            Dock = DockStyle.Fill,
            ColumnCount = 1,
            RowCount = 2,
            Margin = Padding.Empty,
            Padding = new Padding(0, 10, 0, 0),
            BackColor = ThemeColors.Background
        };
        section.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 100));
        section.RowStyles.Add(new RowStyle(SizeType.Absolute, 54));
        section.RowStyles.Add(new RowStyle(SizeType.Percent, 100));

        var heading = new TableLayoutPanel
        {
            Dock = DockStyle.Fill,
            ColumnCount = 1,
            RowCount = 2,
            Margin = Padding.Empty,
            Padding = Padding.Empty,
            BackColor = ThemeColors.Background
        };
        heading.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 100));
        heading.RowStyles.Add(new RowStyle(SizeType.Absolute, 30));
        heading.RowStyles.Add(new RowStyle(SizeType.Percent, 100));

        heading.Controls.Add(new Label
        {
            Text = "Area Summary",
            Dock = DockStyle.Fill,
            Font = ThemeFonts.SectionTitle,
            ForeColor = ThemeColors.Primary,
            TextAlign = ContentAlignment.BottomLeft,
            Margin = Padding.Empty
        }, 0, 0);

        heading.Controls.Add(new Label
        {
            Text = "Current totals across your area records",
            Dock = DockStyle.Fill,
            Font = ThemeFonts.Small,
            ForeColor = ThemeColors.TextSecondary,
            TextAlign = ContentAlignment.TopLeft,
            Margin = Padding.Empty
        }, 0, 1);

        section.Controls.Add(heading, 0, 0);

        var surface = new DashboardSummarySurface
        {
            Dock = DockStyle.Fill,
            Margin = Padding.Empty
        };

        var metrics = new TableLayoutPanel
        {
            Dock = DockStyle.Fill,
            ColumnCount = 5,
            RowCount = 1,
            Margin = Padding.Empty,
            Padding = new Padding(2),
            BackColor = Color.Transparent
        };

        for (var i = 0; i < 5; i++)
            metrics.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 20));
        metrics.RowStyles.Add(new RowStyle(SizeType.Percent, 100));

        var cells = new[] { _members, _chapters, _services, _reports, _events };
        for (var i = 0; i < cells.Length; i++)
        {
            cells[i].Dock = DockStyle.Fill;
            cells[i].Margin = Padding.Empty;
            cells[i].ShowDivider = i < cells.Length - 1;
            metrics.Controls.Add(cells[i], i, 0);
        }

        surface.Controls.Add(metrics);
        section.Controls.Add(surface, 0, 1);

        return section;
    }

    public void RefreshStats()
    {
        try
        {
            var members = new MemberRepository().GetTotalCount();
            var chapters = new ChapterRepository().GetTotalCount();
            var services = new ServiceRepository().GetTotalCount();
            var reports = new ActivityReportRepository().GetTotalCount();
            var events = new EventRepository().GetTotalCount();

            _members.Value = members.ToString();
            _chapters.Value = chapters.ToString();
            _services.Value = services.ToString();
            _reports.Value = reports.ToString();
            _events.Value = events.ToString();

            try
            {
                var now = DateTime.Now;
                var currentMonth = now.ToString("yyyy-MM", System.Globalization.CultureInfo.InvariantCulture);
                var previousMonth = now.AddMonths(-1).ToString("yyyy-MM", System.Globalization.CultureInfo.InvariantCulture);

                var previous = DashboardTrendStore.GetForMonth(previousMonth);
                var current = new DashboardTrendSnapshot(currentMonth, members, chapters, services, reports, events);

                // Trend history is intentionally stored outside SQLite. Dashboard
                // presentation data must never make the core database fail startup.
                DashboardTrendStore.Upsert(current);

                _members.SetTrend(members, previous?.Members);
                _chapters.SetTrend(chapters, previous?.Chapters);
                _services.SetTrend(services, previous?.Services);
                _reports.SetTrend(reports, previous?.ActivityReports);
                _events.SetTrend(events, previous?.Events);
            }
            catch (Exception ex)
            {
                // The totals remain usable even when the optional trend-history
                // support file cannot be read or written.
                AppLogger.Error("Dashboard trend tracking", ex);
                _members.ClearTrend();
                _chapters.ClearTrend();
                _services.ClearTrend();
                _reports.ClearTrend();
                _events.ClearTrend();
            }
        }
        catch (Exception ex)
        {
            AppLogger.Error("Refresh Dashboard", ex);
            _members.Value = _chapters.Value = _services.Value = _reports.Value = _events.Value = "—";
            _members.ClearTrend();
            _chapters.ClearTrend();
            _services.ClearTrend();
            _reports.ClearTrend();
            _events.ClearTrend();
        }
    }

    private sealed class DashboardSummarySurface : Panel
    {
        public DashboardSummarySurface()
        {
            DoubleBuffered = true;
            BackColor = ThemeColors.Surface;
            Padding = Padding.Empty;
            Margin = Padding.Empty;
            Resize += (_, _) => UpdateRegion();
        }

        private void UpdateRegion()
        {
            if (Width <= 2 || Height <= 2) return;
            using var path = UiHelper.Rounded(new Rectangle(0, 0, Width, Height), ThemeSizes.Radius);
            Region?.Dispose();
            Region = new Region(path);
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

            // One restrained brand accent ties the summary to the sidebar
            // without turning every metric into a separate colored card.
            using var accent = new Pen(ThemeColors.Accent, 4);
            e.Graphics.DrawLine(accent, ThemeSizes.Radius + 4, 2, 64, 2);
        }
    }

    private sealed class DashboardMetricCell : Panel
    {
        private readonly Label _value;
        private readonly Label _trend;
        private readonly Color _accentColor;

        public bool ShowDivider { get; set; }

        public string Value
        {
            get => _value.Text;
            set => _value.Text = value;
        }

        public void SetTrend(int currentValue, int? previousValue)
        {
            if (!previousValue.HasValue)
            {
                _trend.Text = "• Monthly tracking started";
                _trend.ForeColor = ThemeColors.TextSecondary;
                return;
            }

            var difference = currentValue - previousValue.Value;
            if (difference > 0)
            {
                _trend.Text = $"▲ +{difference:N0} vs last month";
                _trend.ForeColor = ThemeColors.Success;
            }
            else if (difference < 0)
            {
                _trend.Text = $"▼ {difference:N0} vs last month";
                _trend.ForeColor = ThemeColors.Danger;
            }
            else
            {
                _trend.Text = "• No change vs last month";
                _trend.ForeColor = ThemeColors.TextSecondary;
            }
        }

        public void ClearTrend()
        {
            _trend.Text = "• Trend unavailable";
            _trend.ForeColor = ThemeColors.TextSecondary;
        }

        public DashboardMetricCell(string title, string caption, Color accentColor)
        {
            _accentColor = accentColor;
            DoubleBuffered = true;
            BackColor = Color.Transparent;
            Padding = new Padding(20, 18, 16, 14);
            Margin = Padding.Empty;
            MinimumSize = new Size(150, 118);

            var layout = new TableLayoutPanel
            {
                Dock = DockStyle.Fill,
                ColumnCount = 1,
                RowCount = 5,
                Margin = Padding.Empty,
                Padding = Padding.Empty,
                BackColor = Color.Transparent
            };
            layout.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 100));
            layout.RowStyles.Add(new RowStyle(SizeType.Absolute, 22));
            layout.RowStyles.Add(new RowStyle(SizeType.Absolute, 8));
            layout.RowStyles.Add(new RowStyle(SizeType.Percent, 100));
            layout.RowStyles.Add(new RowStyle(SizeType.Absolute, 22));
            layout.RowStyles.Add(new RowStyle(SizeType.Absolute, 24));

            layout.Controls.Add(new Label
            {
                Text = title,
                Dock = DockStyle.Fill,
                Font = ThemeFonts.BodyBold,
                ForeColor = ThemeColors.TextSecondary,
                TextAlign = ContentAlignment.MiddleLeft,
                AutoEllipsis = true,
                Margin = Padding.Empty
            }, 0, 0);

            var marker = new Panel
            {
                Width = 30,
                Height = 3,
                BackColor = _accentColor,
                Anchor = AnchorStyles.Left,
                Margin = new Padding(0, 2, 0, 3)
            };
            layout.Controls.Add(marker, 0, 1);

            _value = new Label
            {
                Text = "0",
                Dock = DockStyle.Fill,
                Font = ThemeFonts.Stat,
                ForeColor = ThemeColors.Primary,
                TextAlign = ContentAlignment.MiddleLeft,
                AutoEllipsis = true,
                Margin = Padding.Empty
            };
            layout.Controls.Add(_value, 0, 2);

            layout.Controls.Add(new Label
            {
                Text = caption,
                Dock = DockStyle.Fill,
                Font = ThemeFonts.Small,
                ForeColor = ThemeColors.TextSecondary,
                TextAlign = ContentAlignment.TopLeft,
                AutoEllipsis = true,
                Margin = Padding.Empty
            }, 0, 3);

            _trend = new Label
            {
                Text = "• Monthly tracking started",
                Dock = DockStyle.Fill,
                Font = ThemeFonts.SmallBold,
                ForeColor = ThemeColors.TextSecondary,
                TextAlign = ContentAlignment.MiddleLeft,
                AutoEllipsis = true,
                Margin = Padding.Empty
            };
            layout.Controls.Add(_trend, 0, 4);

            Controls.Add(layout);
        }

        protected override void OnPaint(PaintEventArgs e)
        {
            base.OnPaint(e);

            if (ShowDivider)
            {
                using var divider = new Pen(ThemeColors.Border);
                e.Graphics.DrawLine(divider, Width - 1, 18, Width - 1, Height - 18);
            }
        }
    }
}
