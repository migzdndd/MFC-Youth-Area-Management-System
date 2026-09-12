using System.Drawing.Drawing2D;
using MFCYouthAreaManagementSystem.Models;
using MFCYouthAreaManagementSystem.Repositories;
using MFCYouthAreaManagementSystem.UI.Controls;
using MFCYouthAreaManagementSystem.UI.Theme;
using MFCYouthAreaManagementSystem.Utilities;

namespace MFCYouthAreaManagementSystem.Forms;

public sealed class DashboardHomeForm : Form
{
    private readonly DashboardMetricCell _members = new("M", "Total Members", "People currently on record", ThemeColors.Accent);
    private readonly DashboardMetricCell _chapters = new("C", "Chapters", "Registered chapters", Color.FromArgb(65, 125, 184));
    private readonly DashboardMetricCell _services = new("S", "Services", "Available service roles", Color.FromArgb(94, 117, 177));
    private readonly DashboardMetricCell _reports = new("R", "Activity Reports", "Reports currently filed", ThemeColors.Success);
    private readonly DashboardMetricCell _events = new("E", "Events", "Events currently recorded", ThemeColors.Warning);
    private readonly TableLayoutPanel _upcomingEventsList = CreateEventListHost();
    private readonly TableLayoutPanel _pastEventsList = CreateEventListHost();
    private TableLayoutPanel _summaryMetrics = null!;
    private const int EventPreviewLimit = 4;

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
            BackColor = ThemeColors.Background,
            AutoScroll = true
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
        var eventOverview = BuildEventOverview();
        root.Controls.Add(eventOverview, 0, 2);

        WireSummaryMetricsResponsive(root.RowStyles[1]);
        ResponsiveLayoutHelper.WireResponsiveTableLayout(
            this,
            eventOverview,
            root.RowStyles[2],
            normalColumns: 2,
            compactColumns: 1,
            normalHeight: 330,
            compactHeight: 590);
        // Load Dashboard data before the first visible paint. Using Shown here
        // allowed a brief placeholder/zero-state frame whenever the user
        // navigated back to Dashboard.
        Load += (_, _) => RefreshStats();
    }

    private void WireSummaryMetricsResponsive(RowStyle summaryRowStyle)
    {
        var controls = _summaryMetrics.Controls.Cast<Control>().ToArray();

        void Apply()
        {
            var logicalWidth = ResponsiveLayoutHelper.LogicalClientWidth(this);
            if (logicalWidth <= 0) logicalWidth = 1180;

            // Five cards become too narrow well before the global compact breakpoint.
            // Reflow earlier so card titles, trend labels, and captions remain readable.
            var columns = logicalWidth >= 1180 ? 5 : logicalWidth >= 840 ? 3 : 2;
            var summaryHeight = columns switch
            {
                5 => 232,
                3 => 382,
                _ => 548
            };
            var rows = Math.Max(1, (int)Math.Ceiling(controls.Length / (double)columns));

            _summaryMetrics.SuspendLayout();
            try
            {
                _summaryMetrics.Controls.Clear();
                _summaryMetrics.ColumnStyles.Clear();
                _summaryMetrics.RowStyles.Clear();
                _summaryMetrics.ColumnCount = columns;
                _summaryMetrics.RowCount = rows;

                for (var column = 0; column < columns; column++)
                    _summaryMetrics.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 100f / columns));
                for (var row = 0; row < rows; row++)
                    _summaryMetrics.RowStyles.Add(new RowStyle(SizeType.Percent, 100f / rows));

                for (var i = 0; i < controls.Length; i++)
                {
                    var control = controls[i];
                    var column = i % columns;
                    var row = i / columns;
                    control.Margin = ResponsiveLayoutHelper.ScaleLogical(
                        this,
                        new Padding(
                            column == 0 ? 0 : 6,
                            row == 0 ? 0 : 6,
                            column == columns - 1 ? 0 : 6,
                            row == rows - 1 ? 0 : 6));
                    _summaryMetrics.Controls.Add(control, column, row);
                }
            }
            finally
            {
                _summaryMetrics.ResumeLayout(true);
            }

            summaryRowStyle.SizeType = SizeType.Absolute;
            summaryRowStyle.Height = ResponsiveLayoutHelper.ScaleLogical(this, summaryHeight);
        }

        // Do not run Apply() during construction. At that point an embedded
        // Form still has its temporary/default size, which caused the summary
        // cards to build in the wrong column layout and visibly jump after the
        // Dashboard host assigned its real bounds. The host creates/sizes the
        // control before showing it, so HandleCreated now receives the correct
        // client width for the first layout.
        HandleCreated += (_, _) => Apply();
        Resize += (_, _) => Apply();
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

        var metrics = new TableLayoutPanel
        {
            Dock = DockStyle.Fill,
            ColumnCount = 5,
            RowCount = 1,
            Margin = Padding.Empty,
            Padding = Padding.Empty,
            BackColor = ThemeColors.Background
        };

        _summaryMetrics = metrics;

        for (var i = 0; i < 5; i++)
            metrics.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 20));
        metrics.RowStyles.Add(new RowStyle(SizeType.Percent, 100));

        var cells = new[] { _members, _chapters, _services, _reports, _events };
        for (var i = 0; i < cells.Length; i++)
        {
            cells[i].Dock = DockStyle.Fill;
            metrics.Controls.Add(cells[i], i, 0);
        }

        section.Controls.Add(metrics, 0, 1);

        return section;
    }


    private TableLayoutPanel BuildEventOverview()
    {
        var overview = new TableLayoutPanel
        {
            Dock = DockStyle.Fill,
            ColumnCount = 2,
            RowCount = 1,
            Margin = Padding.Empty,
            Padding = new Padding(0, 14, 0, 0),
            BackColor = ThemeColors.Background
        };
        overview.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 50));
        overview.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 50));
        overview.RowStyles.Add(new RowStyle(SizeType.Percent, 100));

        overview.Controls.Add(
            BuildEventPreviewCard(
                "Upcoming Events",
                "Next scheduled Area events",
                _upcomingEventsList),
            0,
            0);

        overview.Controls.Add(
            BuildEventPreviewCard(
                "Past Events",
                "Most recently completed Area events",
                _pastEventsList),
            1,
            0);

        return overview;
    }

    private static Control BuildEventPreviewCard(string title, string subtitle, TableLayoutPanel listHost)
    {
        var card = new DashboardSummarySurface
        {
            Dock = DockStyle.Fill,
            Margin = Padding.Empty,
            Padding = new Padding(18, 14, 18, 14)
        };

        var layout = new TableLayoutPanel
        {
            Dock = DockStyle.Fill,
            ColumnCount = 1,
            RowCount = 3,
            Margin = Padding.Empty,
            Padding = Padding.Empty,
            BackColor = Color.Transparent
        };
        layout.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 100));
        layout.RowStyles.Add(new RowStyle(SizeType.Absolute, 30));
        layout.RowStyles.Add(new RowStyle(SizeType.Absolute, 26));
        layout.RowStyles.Add(new RowStyle(SizeType.Percent, 100));

        layout.Controls.Add(new Label
        {
            Text = title,
            Dock = DockStyle.Fill,
            Font = ThemeFonts.SectionTitle,
            ForeColor = ThemeColors.Primary,
            TextAlign = ContentAlignment.MiddleLeft,
            AutoEllipsis = false,
            Margin = Padding.Empty
        }, 0, 0);

        layout.Controls.Add(new Label
        {
            Text = subtitle,
            Dock = DockStyle.Fill,
            Font = ThemeFonts.Small,
            ForeColor = ThemeColors.TextSecondary,
            TextAlign = ContentAlignment.TopLeft,
            AutoEllipsis = false,
            Margin = Padding.Empty
        }, 0, 1);

        layout.Controls.Add(listHost, 0, 2);
        card.Controls.Add(layout);
        return card;
    }

    private static TableLayoutPanel CreateEventListHost() => new()
    {
        Dock = DockStyle.Fill,
        ColumnCount = 1,
        RowCount = 1,
        Margin = Padding.Empty,
        Padding = new Padding(0, 6, 0, 0),
        BackColor = Color.Transparent,
        AutoScroll = true
    };

    private static Control BuildEventPreviewRow(AreaEvent areaEvent)
    {
        var row = new TableLayoutPanel
        {
            Dock = DockStyle.Fill,
            ColumnCount = 2,
            RowCount = 2,
            Margin = new Padding(0, 0, 0, 6),
            Padding = new Padding(12, 7, 12, 7),
            BackColor = ThemeColors.Background
        };
        row.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 62));
        row.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 38));
        row.RowStyles.Add(new RowStyle(SizeType.Percent, 52));
        row.RowStyles.Add(new RowStyle(SizeType.Percent, 48));

        row.Controls.Add(new Label
        {
            Text = areaEvent.EventName,
            Dock = DockStyle.Fill,
            Font = ThemeFonts.BodyBold,
            ForeColor = ThemeColors.TextPrimary,
            TextAlign = ContentAlignment.BottomLeft,
            AutoEllipsis = false,
            Margin = Padding.Empty
        }, 0, 0);

        row.Controls.Add(new Label
        {
            Text = areaEvent.EventDateTime.ToString("MMM d, yyyy h:mm tt"),
            Dock = DockStyle.Fill,
            Font = ThemeFonts.SmallBold,
            ForeColor = areaEvent.IsUpcoming ? ThemeColors.ActionBlue : ThemeColors.TextSecondary,
            TextAlign = ContentAlignment.BottomRight,
            AutoEllipsis = true,
            Margin = Padding.Empty
        }, 1, 0);

        row.Controls.Add(new Label
        {
            Text = string.IsNullOrWhiteSpace(areaEvent.Venue) ? "Venue not specified" : areaEvent.Venue,
            Dock = DockStyle.Fill,
            Font = ThemeFonts.Small,
            ForeColor = ThemeColors.TextSecondary,
            TextAlign = ContentAlignment.TopLeft,
            AutoEllipsis = true,
            Margin = Padding.Empty
        }, 0, 1);

        row.Controls.Add(new Label
        {
            Text = areaEvent.RegisteredCount == 1 ? "1 registered" : $"{areaEvent.RegisteredCount} registered",
            Dock = DockStyle.Fill,
            Font = ThemeFonts.Small,
            ForeColor = ThemeColors.TextSecondary,
            TextAlign = ContentAlignment.TopRight,
            AutoEllipsis = true,
            Margin = Padding.Empty
        }, 1, 1);

        return row;
    }

    private static void PopulateEventList(TableLayoutPanel host, IReadOnlyList<AreaEvent> events, string emptyText)
    {
        host.SuspendLayout();
        try
        {
            host.Controls.Clear();
            host.RowStyles.Clear();
            host.ColumnStyles.Clear();
            host.ColumnCount = 1;
            host.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 100));

            if (events.Count == 0)
            {
                host.RowCount = 1;
                host.RowStyles.Add(new RowStyle(SizeType.Percent, 100));
                host.Controls.Add(new Label
                {
                    Text = emptyText,
                    Dock = DockStyle.Fill,
                    Font = ThemeFonts.Body,
                    ForeColor = ThemeColors.TextSecondary,
                    TextAlign = ContentAlignment.MiddleCenter,
                    AutoEllipsis = true,
                    Margin = Padding.Empty
                }, 0, 0);
                return;
            }

            host.RowCount = events.Count;
            for (var i = 0; i < events.Count; i++)
            {
                host.RowStyles.Add(new RowStyle(SizeType.Percent, 100f / events.Count));
                host.Controls.Add(BuildEventPreviewRow(events[i]), 0, i);
            }
        }
        finally
        {
            host.ResumeLayout(true);
        }
    }

    private void UpdateEventOverview(IReadOnlyCollection<AreaEvent> events)
    {
        var now = DateTime.Now;
        var upcoming = events
            .Where(areaEvent => areaEvent.EventDateTime >= now)
            .OrderBy(areaEvent => areaEvent.EventDateTime)
            .ThenBy(areaEvent => areaEvent.EventID)
            .Take(EventPreviewLimit)
            .ToList();

        var past = events
            .Where(areaEvent => areaEvent.EventDateTime < now)
            .OrderByDescending(areaEvent => areaEvent.EventDateTime)
            .ThenByDescending(areaEvent => areaEvent.EventID)
            .Take(EventPreviewLimit)
            .ToList();

        PopulateEventList(_upcomingEventsList, upcoming, "No upcoming Events scheduled.");
        PopulateEventList(_pastEventsList, past, "No past Events recorded yet.");
    }

    public void RefreshStats()
    {
        try
        {
            var members = new MemberRepository().GetTotalCount();
            var chapters = new ChapterRepository().GetTotalCount();
            var services = new ServiceRepository().GetTotalCount();
            var reports = new ActivityReportRepository().GetTotalCount();
            var eventRows = new EventRepository().GetAll();
            var events = eventRows.Count;

            _members.Value = members.ToString();
            _chapters.Value = chapters.ToString();
            _services.Value = services.ToString();
            _reports.Value = reports.ToString();
            _events.Value = events.ToString();
            UpdateEventOverview(eventRows);

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
            PopulateEventList(_upcomingEventsList, Array.Empty<AreaEvent>(), "Upcoming Events could not load.");
            PopulateEventList(_pastEventsList, Array.Empty<AreaEvent>(), "Past Events could not load.");
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
        private readonly DashboardTrendRangeBar _range;
        private readonly Color _accentColor;

        public string Value
        {
            get => _value.Text;
            set => _value.Text = value;
        }

        public void SetTrend(int currentValue, int? previousValue)
        {
            if (!previousValue.HasValue)
            {
                _trend.Text = "Tracking";
                _trend.ForeColor = ThemeColors.TextSecondary;
                _range.SetProgress(0.12, _accentColor);
                return;
            }

            if (previousValue.Value == 0)
            {
                if (currentValue > 0)
                {
                    _trend.Text = "▲ New";
                    _trend.ForeColor = ThemeColors.Success;
                    _range.SetProgress(1.0, ThemeColors.Success);
                }
                else
                {
                    _trend.Text = "• 0.0%";
                    _trend.ForeColor = ThemeColors.TextSecondary;
                    _range.SetProgress(0, _accentColor);
                }
                return;
            }

            var difference = currentValue - previousValue.Value;
            var percentChange = difference / (double)previousValue.Value * 100d;
            var magnitude = Math.Min(1d, Math.Abs(percentChange) / 100d);
            if (Math.Abs(percentChange) > 0.0001d)
                magnitude = Math.Max(0.06d, magnitude);

            if (percentChange > 0)
            {
                _trend.Text = $"▲ +{percentChange:0.#}%";
                _trend.ForeColor = ThemeColors.Success;
                _range.SetProgress(magnitude, ThemeColors.Success);
            }
            else if (percentChange < 0)
            {
                _trend.Text = $"▼ {percentChange:0.#}%";
                _trend.ForeColor = ThemeColors.Danger;
                _range.SetProgress(magnitude, ThemeColors.Danger);
            }
            else
            {
                _trend.Text = "• 0.0%";
                _trend.ForeColor = ThemeColors.TextSecondary;
                _range.SetProgress(0, _accentColor);
            }
        }

        public void ClearTrend()
        {
            _trend.Text = "Unavailable";
            _trend.ForeColor = ThemeColors.TextSecondary;
            _range.SetProgress(0.12, _accentColor);
        }

        public DashboardMetricCell(string glyph, string title, string caption, Color accentColor)
        {
            _accentColor = accentColor;
            DoubleBuffered = true;
            BackColor = ThemeColors.Background;
            Padding = new Padding(14, 12, 14, 14);
            Margin = Padding.Empty;
            MinimumSize = new Size(170, 138);

            var layout = new TableLayoutPanel
            {
                Dock = DockStyle.Fill,
                ColumnCount = 1,
                RowCount = 4,
                Margin = Padding.Empty,
                Padding = new Padding(4, 2, 4, 4),
                BackColor = Color.Transparent
            };
            layout.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 100));
            layout.RowStyles.Add(new RowStyle(SizeType.Absolute, 32));
            layout.RowStyles.Add(new RowStyle(SizeType.Absolute, 44));
            layout.RowStyles.Add(new RowStyle(SizeType.Absolute, 30));
            layout.RowStyles.Add(new RowStyle(SizeType.Percent, 100));

            var titleRow = new TableLayoutPanel
            {
                Dock = DockStyle.Fill,
                ColumnCount = 3,
                RowCount = 1,
                Margin = Padding.Empty,
                Padding = Padding.Empty,
                BackColor = Color.Transparent
            };
            titleRow.ColumnStyles.Add(new ColumnStyle(SizeType.Absolute, 34));
            titleRow.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 100));
            titleRow.ColumnStyles.Add(new ColumnStyle(SizeType.AutoSize));
            titleRow.RowStyles.Add(new RowStyle(SizeType.Percent, 100));

            var badge = new DashboardMetricBadge(glyph, _accentColor)
            {
                Dock = DockStyle.Fill,
                Margin = new Padding(0, 1, 6, 1)
            };
            titleRow.Controls.Add(badge, 0, 0);

            titleRow.Controls.Add(new Label
            {
                Text = title,
                Dock = DockStyle.Fill,
                Font = ThemeFonts.BodyBold,
                ForeColor = Color.FromArgb(55, 65, 81),
                TextAlign = ContentAlignment.MiddleLeft,
                AutoEllipsis = false,
                Margin = Padding.Empty
            }, 1, 0);

            _trend = new Label
            {
                Text = "Tracking",
                Dock = DockStyle.Fill,
                Font = ThemeFonts.SmallBold,
                ForeColor = ThemeColors.TextSecondary,
                TextAlign = ContentAlignment.MiddleRight,
                AutoEllipsis = false,
                AutoSize = true,
                Anchor = AnchorStyles.Right,
                Margin = Padding.Empty
            };
            titleRow.Controls.Add(_trend, 2, 0);
            layout.Controls.Add(titleRow, 0, 0);

            _value = new Label
            {
                Text = "0",
                Dock = DockStyle.Fill,
                Font = ThemeFonts.Stat,
                ForeColor = Color.FromArgb(31, 41, 55),
                TextAlign = ContentAlignment.MiddleLeft,
                AutoEllipsis = true,
                Margin = Padding.Empty
            };
            layout.Controls.Add(_value, 0, 1);

            layout.Controls.Add(new Label
            {
                Text = caption,
                Dock = DockStyle.Fill,
                Font = ThemeFonts.Small,
                ForeColor = ThemeColors.TextSecondary,
                TextAlign = ContentAlignment.TopLeft,
                AutoEllipsis = false,
                Margin = Padding.Empty
            }, 0, 2);

            _range = new DashboardTrendRangeBar
            {
                Dock = DockStyle.Top,
                Height = 8,
                Margin = new Padding(0, 8, 0, 0)
            };
            _range.SetProgress(0.12, _accentColor);
            layout.Controls.Add(_range, 0, 3);

            Controls.Add(layout);
        }

        protected override void OnPaint(PaintEventArgs e)
        {
            base.OnPaint(e);
            e.Graphics.SmoothingMode = SmoothingMode.AntiAlias;

            var radius = Math.Max(10, ResponsiveLayoutHelper.ScaleLogical(this, 20));
            var cardBounds = new Rectangle(3, 2, Math.Max(1, Width - 10), Math.Max(1, Height - 10));
            if (cardBounds.Width <= 2 || cardBounds.Height <= 2) return;

            var shadowBounds = cardBounds;
            shadowBounds.Offset(0, Math.Max(2, ResponsiveLayoutHelper.ScaleLogical(this, 4)));

            using (var shadowPath = UiHelper.Rounded(shadowBounds, radius))
            using (var shadowBrush = new SolidBrush(Color.FromArgb(22, 0, 0, 0)))
                e.Graphics.FillPath(shadowBrush, shadowPath);

            using (var cardPath = UiHelper.Rounded(cardBounds, radius))
            using (var cardBrush = new SolidBrush(Color.White))
                e.Graphics.FillPath(cardBrush, cardPath);

            using (var cardPath = UiHelper.Rounded(cardBounds, radius))
            using (var borderPen = new Pen(Color.FromArgb(235, 238, 242)))
                e.Graphics.DrawPath(borderPen, cardPath);
        }
    }

    private sealed class DashboardMetricBadge : Control
    {
        private readonly string _glyph;
        private readonly Color _accentColor;

        public DashboardMetricBadge(string glyph, Color accentColor)
        {
            _glyph = glyph;
            _accentColor = accentColor;

            // Custom WinForms controls must explicitly opt in to transparent
            // backgrounds before Color.Transparent is assigned.
            SetStyle(
                ControlStyles.SupportsTransparentBackColor |
                ControlStyles.UserPaint |
                ControlStyles.AllPaintingInWmPaint |
                ControlStyles.OptimizedDoubleBuffer,
                true);

            BackColor = Color.Transparent;
            MinimumSize = new Size(28, 28);
        }

        protected override void OnPaint(PaintEventArgs e)
        {
            base.OnPaint(e);
            e.Graphics.SmoothingMode = SmoothingMode.AntiAlias;

            var size = Math.Min(Width, Height) - 2;
            if (size <= 2) return;

            var bounds = new Rectangle(
                (Width - size) / 2,
                (Height - size) / 2,
                size,
                size);

            using var fill = new SolidBrush(_accentColor);
            e.Graphics.FillEllipse(fill, bounds);

            using var font = new Font(
                ThemeFonts.SmallBold.FontFamily,
                Math.Max(8f, ThemeFonts.SmallBold.Size),
                FontStyle.Bold);
            TextRenderer.DrawText(
                e.Graphics,
                _glyph,
                font,
                bounds,
                Color.White,
                TextFormatFlags.HorizontalCenter |
                TextFormatFlags.VerticalCenter |
                TextFormatFlags.NoPadding);
        }
    }

    private sealed class DashboardTrendRangeBar : Control
    {
        private double _progress;
        private Color _fillColor = ThemeColors.Success;

        public DashboardTrendRangeBar()
        {
            // Custom WinForms controls must explicitly opt in to transparent
            // backgrounds before Color.Transparent is assigned.
            SetStyle(
                ControlStyles.SupportsTransparentBackColor |
                ControlStyles.UserPaint |
                ControlStyles.AllPaintingInWmPaint |
                ControlStyles.OptimizedDoubleBuffer,
                true);

            BackColor = Color.Transparent;
            MinimumSize = new Size(30, 8);
        }

        public void SetProgress(double progress, Color fillColor)
        {
            _progress = Math.Clamp(progress, 0d, 1d);
            _fillColor = fillColor;
            Invalidate();
        }

        protected override void OnPaint(PaintEventArgs e)
        {
            base.OnPaint(e);
            e.Graphics.SmoothingMode = SmoothingMode.AntiAlias;

            var trackBounds = new Rectangle(0, 0, Math.Max(1, Width - 1), Math.Max(1, Height - 1));
            var radius = Math.Max(1, trackBounds.Height / 2);

            using (var trackPath = UiHelper.Rounded(trackBounds, radius))
            using (var trackBrush = new SolidBrush(Color.FromArgb(229, 231, 235)))
                e.Graphics.FillPath(trackBrush, trackPath);

            if (_progress <= 0d) return;

            var fillWidth = Math.Max(trackBounds.Height, (int)Math.Round(trackBounds.Width * _progress));
            fillWidth = Math.Min(trackBounds.Width, fillWidth);
            var fillBounds = new Rectangle(trackBounds.Left, trackBounds.Top, fillWidth, trackBounds.Height);

            using var fillPath = UiHelper.Rounded(fillBounds, radius);
            using var fillBrush = new SolidBrush(_fillColor);
            e.Graphics.FillPath(fillBrush, fillPath);
        }
    }

}
