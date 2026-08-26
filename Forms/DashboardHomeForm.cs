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
            _members.Value = new MemberRepository().GetTotalCount().ToString();
            _chapters.Value = new ChapterRepository().GetTotalCount().ToString();
            _services.Value = new ServiceRepository().GetTotalCount().ToString();
            _reports.Value = new ActivityReportRepository().GetTotalCount().ToString();
            _events.Value = new EventRepository().GetTotalCount().ToString();
        }
        catch (Exception ex)
        {
            AppLogger.Error("Refresh Dashboard", ex);
            _members.Value = _chapters.Value = _services.Value = _reports.Value = _events.Value = "—";
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
        private readonly Color _accentColor;

        public bool ShowDivider { get; set; }

        public string Value
        {
            get => _value.Text;
            set => _value.Text = value;
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
                RowCount = 4,
                Margin = Padding.Empty,
                Padding = Padding.Empty,
                BackColor = Color.Transparent
            };
            layout.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 100));
            layout.RowStyles.Add(new RowStyle(SizeType.Absolute, 22));
            layout.RowStyles.Add(new RowStyle(SizeType.Absolute, 8));
            layout.RowStyles.Add(new RowStyle(SizeType.Percent, 100));
            layout.RowStyles.Add(new RowStyle(SizeType.Absolute, 28));

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
