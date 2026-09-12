using MFCYouthAreaManagementSystem.Models;
using MFCYouthAreaManagementSystem.Repositories;
using MFCYouthAreaManagementSystem.UI.Controls;
using MFCYouthAreaManagementSystem.UI.Theme;
using MFCYouthAreaManagementSystem.Utilities;

namespace MFCYouthAreaManagementSystem.Forms;

public sealed class ActivityReportsForm : Form
{
    private readonly Dashboard _dashboard;
    private readonly ActivityReportRepository _repo = new();
    private readonly DataGridView _grid = UiHelper.CreateGrid();
    private readonly ModernTextBox _search = new() { Placeholder = "Search reports..." };
    private readonly ModernComboBox _chapterFilter = new();
    private readonly ModernComboBox _typeFilter = new();
    private readonly ModernComboBox _periodFilter = new();
    private readonly Label _overviewCountTitle = OverviewLabel("Total Reports", ThemeFonts.BodyBold, ThemeColors.TextSecondary);
    private readonly Label _overviewCountValue = OverviewLabel("0", OverviewValueFont(), ThemeColors.TextPrimary);
    private readonly Label _overviewCountCaption = OverviewLabel("All recorded activity reports", ThemeFonts.Body, ThemeColors.TextSecondary);
    private readonly Label _overviewMonthValue = OverviewLabel("0", OverviewValueFont(), ThemeColors.TextPrimary);
    private readonly Label _overviewLatestValue = OverviewLabel("—", OverviewValueFont(), ThemeColors.TextPrimary);
    private readonly Label _overviewLatestCaption = OverviewLabel("No reports recorded yet", ThemeFonts.Body, ThemeColors.TextSecondary);
    private readonly ReportAnalyticsCard _monthlyChart = new("Monthly Activity", "Report activity across the latest six months in view", ReportChartKind.VerticalBars, ThemeColors.ActionBlue);
    private readonly ReportAnalyticsCard _typeChart = new("Report Type Mix", "Most common report types in the selected results", ReportChartKind.HorizontalBars, ThemeColors.Warning);
    private readonly ReportAnalyticsCard _chapterChart = new("Chapter Activity", "Most active chapters in the selected results", ReportChartKind.HorizontalBars, ThemeColors.Success);
    private readonly EmptyStatePanel _empty = new("No Activity Reports Yet", "Create the first Activity Report to begin documenting Area and Chapter activities.");
    private ModernButton? _editButton;
    private ModernButton? _deleteButton;
    private ModernButton? _exportButton;
    private ModernButton? _clearFiltersButton;
    private bool _suppressFilterReload;
    private int _matchingCount;

    public ActivityReportsForm(Dashboard dashboard)
    {
        _dashboard = dashboard;
        BackColor = ThemeColors.Background;
        Font = ThemeFonts.Body;
        AutoScaleMode = AutoScaleMode.Dpi;

        var root = new TableLayoutPanel { Dock = DockStyle.Fill, ColumnCount = 1, RowCount = 6, Margin = Padding.Empty, Padding = Padding.Empty };
        root.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 100));
        root.RowStyles.Add(new RowStyle(SizeType.Absolute, ThemeSizes.PageHeaderHeight));
        root.RowStyles.Add(new RowStyle(SizeType.Absolute, 114));
        root.RowStyles.Add(new RowStyle(SizeType.Absolute, 82));
        root.RowStyles.Add(new RowStyle(SizeType.Absolute, 246));
        root.RowStyles.Add(new RowStyle(SizeType.Absolute, ThemeSizes.ToolbarActionsHeight + 12));
        root.RowStyles.Add(new RowStyle(SizeType.Percent, 100));
        Controls.Add(root);

        root.Controls.Add(new PageHeader("Activity Reports & Analytics", "Review and manage activity reports, filter the records you need, and explore reporting trends."), 0, 0);
        var overview = BuildActivityOverview();
        var filters = BuildFilters();
        var charts = BuildAnalyticsCharts();
        var actions = BuildActions();
        root.Controls.Add(overview, 0, 1);
        root.Controls.Add(filters, 0, 2);
        root.Controls.Add(charts, 0, 3);
        root.Controls.Add(actions, 0, 4);
        if (overview is TableLayoutPanel overviewLayout)
            ResponsiveLayoutHelper.WireResponsiveTableLayout(this, overviewLayout, root.RowStyles[1], normalColumns: 3, compactColumns: 1, normalHeight: 114, compactHeight: 252);
        if (filters is TableLayoutPanel filterLayout)
            ResponsiveLayoutHelper.WireResponsiveTableLayout(this, filterLayout, root.RowStyles[2], normalColumns: 4, compactColumns: 2, normalHeight: 82, compactHeight: 154);
        ResponsiveLayoutHelper.WireCompactRowVisibility(this, charts, root.RowStyles[3], normalHeight: 246);
        if (actions is FlowLayoutPanel actionBar)
            ResponsiveLayoutHelper.WireResponsiveActionBar(this, actionBar, root.RowStyles[4], normalActionHeight: ThemeSizes.ToolbarActionsHeight + 12, compactActionHeight: ResponsiveLayoutHelper.CompactToolbarActionsHeight);

        _grid.Columns.Add(new DataGridViewTextBoxColumn { Name = "Date", HeaderText = "Date", DataPropertyName = "ReportDate", Width = 115, DefaultCellStyle = { Format = "MMM d, yyyy" } });
        _grid.Columns.Add(new DataGridViewTextBoxColumn { Name = "Title", HeaderText = "Title", DataPropertyName = "Title", AutoSizeMode = DataGridViewAutoSizeColumnMode.Fill });
        _grid.Columns.Add(new DataGridViewTextBoxColumn { Name = "Chapter", HeaderText = "Chapter", DataPropertyName = "ChapterName", Width = 150 });
        _grid.Columns.Add(new DataGridViewTextBoxColumn { Name = "Type", HeaderText = "Type", DataPropertyName = "ReportType", Width = 135 });
        _grid.Columns.Add(new DataGridViewTextBoxColumn { Name = "PreparedBy", HeaderText = "Prepared By", DataPropertyName = "PreparedBy", Width = 150 });
        ResponsiveLayoutHelper.WireResponsiveGridColumns(this, _grid,
            new ResponsiveGridColumnRule("PreparedBy", 780),
            new ResponsiveGridColumnRule("Type", 700),
            new ResponsiveGridColumnRule("Chapter", 620));
        _grid.DoubleClick += (_, _) => Edit();
        _grid.SelectionChanged += (_, _) => UpdateActionState();

        var content = new Panel { Dock = DockStyle.Fill, Margin = Padding.Empty };
        content.Controls.Add(_grid);
        content.Controls.Add(_empty);
        root.Controls.Add(content, 0, 5);

        LoadFilterChoices();
        UiSearchDebouncer.Bind(this, _search, LoadRows);
        _chapterFilter.SelectedIndexChanged += (_, _) => ReloadFromFilterChange();
        _typeFilter.SelectedIndexChanged += (_, _) => ReloadFromFilterChange();
        _periodFilter.SelectedIndexChanged += (_, _) => ReloadFromFilterChange();
        Shown += (_, _) => LoadRows();
    }

    private Control BuildActivityOverview()
    {
        var overview = new TableLayoutPanel
        {
            Dock = DockStyle.Fill,
            ColumnCount = 3,
            RowCount = 1,
            Padding = new Padding(18, 12, 18, 12),
            Margin = new Padding(0, 4, 0, 10),
            BackColor = Color.White,
            BorderStyle = BorderStyle.FixedSingle
        };
        overview.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 33.333f));
        overview.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 33.333f));
        overview.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 33.334f));
        overview.RowStyles.Add(new RowStyle(SizeType.Percent, 100));

        overview.Controls.Add(BuildOverviewMetric(_overviewCountTitle, _overviewCountValue, _overviewCountCaption, 0), 0, 0);
        overview.Controls.Add(BuildOverviewMetric(
            OverviewLabel("This Month", ThemeFonts.BodyBold, ThemeColors.TextSecondary),
            _overviewMonthValue,
            OverviewLabel("Reports dated in the current month", ThemeFonts.Body, ThemeColors.TextSecondary),
            18), 1, 0);
        overview.Controls.Add(BuildOverviewMetric(
            OverviewLabel("Latest Report", ThemeFonts.BodyBold, ThemeColors.TextSecondary),
            _overviewLatestValue,
            _overviewLatestCaption,
            18), 2, 0);
        return overview;
    }

    private static Control BuildOverviewMetric(Label title, Label value, Label caption, int leftPadding)
    {
        var metric = new TableLayoutPanel
        {
            Dock = DockStyle.Fill,
            ColumnCount = 1,
            RowCount = 3,
            Padding = new Padding(leftPadding, 0, 8, 0),
            Margin = Padding.Empty,
            BackColor = Color.White
        };
        metric.RowStyles.Add(new RowStyle(SizeType.Absolute, 22));
        metric.RowStyles.Add(new RowStyle(SizeType.Absolute, 34));
        metric.RowStyles.Add(new RowStyle(SizeType.Percent, 100));

        foreach (var label in new[] { title, value, caption })
        {
            label.Dock = DockStyle.Fill;
            label.Margin = Padding.Empty;
            label.TextAlign = ContentAlignment.MiddleLeft;
            label.AutoEllipsis = true;
        }
        caption.TextAlign = ContentAlignment.TopLeft;

        metric.Controls.Add(title, 0, 0);
        metric.Controls.Add(value, 0, 1);
        metric.Controls.Add(caption, 0, 2);
        return metric;
    }

    private static Label OverviewLabel(string text, Font font, Color color) => new()
    {
        Text = text,
        Font = font,
        ForeColor = color,
        BackColor = Color.Transparent,
        AutoSize = false
    };

    private static Font OverviewValueFont() =>
        new(ThemeFonts.BodyBold.FontFamily, 16f, FontStyle.Bold);

    private Control BuildFilters()
    {
        var filters = new TableLayoutPanel
        {
            Dock = DockStyle.Fill,
            ColumnCount = 4,
            RowCount = 1,
            Padding = Padding.Empty,
            Margin = Padding.Empty
        };
        filters.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 40));
        filters.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 20));
        filters.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 20));
        filters.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 20));
        filters.RowStyles.Add(new RowStyle(SizeType.Percent, 100));

        filters.Controls.Add(FilterField("Search", _search, 0), 0, 0);
        filters.Controls.Add(FilterField("Chapter", _chapterFilter, 6), 1, 0);
        filters.Controls.Add(FilterField("Report Type", _typeFilter, 6), 2, 0);
        filters.Controls.Add(FilterField("Period", _periodFilter, 6), 3, 0);
        return filters;
    }

    private Control BuildAnalyticsCharts()
    {
        var charts = new TableLayoutPanel
        {
            Dock = DockStyle.Fill,
            ColumnCount = 3,
            RowCount = 1,
            Padding = new Padding(0, 8, 0, 8),
            Margin = Padding.Empty,
            BackColor = ThemeColors.Background
        };
        charts.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 34));
        charts.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 28));
        charts.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 38));
        charts.RowStyles.Add(new RowStyle(SizeType.Percent, 100));

        var cards = new[] { _monthlyChart, _typeChart, _chapterChart };
        for (var i = 0; i < cards.Length; i++)
        {
            cards[i].Dock = DockStyle.Fill;
            cards[i].Margin = new Padding(i == 0 ? 0 : 6, 0, i == cards.Length - 1 ? 0 : 6, 0);
            charts.Controls.Add(cards[i], i, 0);
        }

        return charts;
    }

    private Control BuildActions()
    {
        var actions = new FlowLayoutPanel
        {
            Dock = DockStyle.Fill,
            FlowDirection = FlowDirection.RightToLeft,
            WrapContents = false,
            Padding = new Padding(0, 10, 0, 6),
            Margin = Padding.Empty,
            BackColor = ThemeColors.Background
        };
        var add = Btn("+ Add Report", 118, ModernButtonStyle.Primary);
        var edit = Btn("Edit", 82, ModernButtonStyle.Secondary);
        var del = Btn("Delete", 82, ModernButtonStyle.Danger);
        var export = Btn("Export PDF", 106, ModernButtonStyle.Blue);
        var refresh = Btn("Refresh", 86, ModernButtonStyle.Ghost);
        var clear = Btn("Clear Filters", 104, ModernButtonStyle.Ghost);
        _editButton = edit;
        _deleteButton = del;
        _exportButton = export;
        _clearFiltersButton = clear;
        add.Click += (_, _) => Add();
        edit.Click += (_, _) => Edit();
        del.Click += (_, _) => Delete();
        export.Click += (_, _) => ExportPdf();
        refresh.Click += (_, _) => LoadRows();
        clear.Click += (_, _) => ClearFilters();
        actions.Controls.AddRange(new Control[] { add, del, edit, export, refresh, clear });
        UpdateActionState();
        return actions;
    }

    private static Control FilterField(string label, Control control, int leftMargin)
    {
        var field = new TableLayoutPanel
        {
            Dock = DockStyle.Fill,
            ColumnCount = 1,
            RowCount = 2,
            Padding = new Padding(leftMargin, 0, 0, 4),
            Margin = Padding.Empty
        };
        field.RowStyles.Add(new RowStyle(SizeType.Absolute, 28));
        field.RowStyles.Add(new RowStyle(SizeType.Percent, 100));
        field.Controls.Add(new Label
        {
            Text = label,
            Dock = DockStyle.Fill,
            Font = ThemeFonts.BodyBold,
            ForeColor = ThemeColors.TextSecondary,
            TextAlign = ContentAlignment.MiddleLeft,
            Margin = Padding.Empty
        }, 0, 0);
        control.Dock = DockStyle.Fill;
        control.Margin = Padding.Empty;
        field.Controls.Add(control, 0, 1);
        return field;
    }

    private void LoadFilterChoices()
    {
        _suppressFilterReload = true;
        try
        {
            _chapterFilter.DisplayMember = nameof(ChapterFilterChoice.Text);
            var chapters = new List<ChapterFilterChoice> { new(null, "All Chapters") };
            chapters.AddRange(new ChapterRepository().GetAll().Select(c => new ChapterFilterChoice(c.ChapterID, c.ChapterName)));
            _chapterFilter.DataSource = chapters;

            _typeFilter.DisplayMember = nameof(ReportTypeFilterChoice.Text);
            var existingTypes = _repo.GetAll()
                .Select(r => r.ReportType?.Trim() ?? string.Empty)
                .Where(type => type.Length > 0)
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToArray();

            var standardTypes = ApplicationConstants.ReportTypes
                .Select(type => new ReportTypeFilterChoice(type, type));

            var legacyTypes = existingTypes
                .Where(type => !ApplicationConstants.ReportTypes.Contains(type, StringComparer.OrdinalIgnoreCase))
                .OrderBy(type => type, StringComparer.OrdinalIgnoreCase)
                .Select(type => new ReportTypeFilterChoice(type, $"{type} (Legacy)"));

            _typeFilter.DataSource = new[] { new ReportTypeFilterChoice(null, "All Types") }
                .Concat(standardTypes)
                .Concat(legacyTypes)
                .ToList();

            _periodFilter.DisplayMember = nameof(PeriodFilterChoice.Text);
            _periodFilter.DataSource = new[]
            {
                new PeriodFilterChoice(ReportPeriod.AllTime, "All Time"),
                new PeriodFilterChoice(ReportPeriod.ThisMonth, "This Month"),
                new PeriodFilterChoice(ReportPeriod.Last30Days, "Last 30 Days"),
                new PeriodFilterChoice(ReportPeriod.ThisYear, "This Year")
            };
        }
        catch (Exception ex)
        {
            AppLogger.Error("Load Activity Report filters", ex);
            _dashboard.Notify("Some Report filters could not load.", true);
        }
        finally
        {
            _suppressFilterReload = false;
        }
    }

    private ActivityReportFilter CurrentFilter()
    {
        var chapterId = (_chapterFilter.SelectedItem as ChapterFilterChoice)?.ChapterID;
        var type = (_typeFilter.SelectedItem as ReportTypeFilterChoice)?.Value;
        var period = (_periodFilter.SelectedItem as PeriodFilterChoice)?.Period ?? ReportPeriod.AllTime;
        var (from, to) = ResolvePeriod(period, DateTime.Today);
        return new ActivityReportFilter
        {
            Search = _search.TextValue,
            ChapterID = chapterId,
            ReportType = type,
            DateFrom = from,
            DateTo = to
        };
    }

    private static (DateTime? From, DateTime? To) ResolvePeriod(ReportPeriod period, DateTime today) => period switch
    {
        ReportPeriod.ThisMonth => (new DateTime(today.Year, today.Month, 1), today),
        ReportPeriod.Last30Days => (today.AddDays(-29), today),
        ReportPeriod.ThisYear => (new DateTime(today.Year, 1, 1), today),
        _ => (null, null)
    };

    private void ReloadFromFilterChange()
    {
        if (!_suppressFilterReload && IsHandleCreated) LoadRows();
    }

    private void ClearFilters()
    {
        _suppressFilterReload = true;
        try
        {
            _search.TextValue = string.Empty;
            if (_chapterFilter.Items.Count > 0) _chapterFilter.SelectedIndex = 0;
            if (_typeFilter.Items.Count > 0) _typeFilter.SelectedIndex = 0;
            if (_periodFilter.Items.Count > 0) _periodFilter.SelectedIndex = 0;
        }
        finally
        {
            _suppressFilterReload = false;
        }
        LoadRows();
    }

    private ModernButton Btn(string text, int width, ModernButtonStyle style) => new() { Text = text, Width = width, ButtonStyle = style, Margin = new Padding(6, 0, 0, 0) };
    private ActivityReport? Selected() => _grid.CurrentRow?.DataBoundItem as ActivityReport;

    private void LoadRows()
    {
        try
        {
            var rows = _repo.GetAll(CurrentFilter());
            var totalReportCount = HasActiveFilters() ? _repo.GetAll().Count : rows.Count;
            UpdateAnalytics(rows, totalReportCount);
            _grid.DataSource = rows;

            _matchingCount = rows.Count;
            _grid.Visible = rows.Count > 0;
            _empty.Visible = rows.Count == 0;

            if (_grid.Visible)
            {
                _empty.ResetMessage();
                _grid.BringToFront();
            }
            else
            {
                ShowEmptyResultMessage();
                _empty.BringToFront();
            }

            UpdateActionState();
        }
        catch (Exception ex)
        {
            AppLogger.Error("Load Activity Reports", ex);
            _matchingCount = 0;
            _grid.DataSource = null;
            _grid.Visible = false;
            UpdateAnalytics(Array.Empty<ActivityReport>(), 0);
            _empty.ShowMessage("Activity Reports Could Not Load", "The Report list is temporarily unavailable. Try refreshing again.");
            _empty.Visible = true;
            _empty.BringToFront();
            UpdateActionState();
            _dashboard.Notify("Could not load Activity Reports.", true);
        }
    }

    private void ShowEmptyResultMessage()
    {
        if (HasActiveFilters())
        {
            _empty.ShowMessage(
                "No Reports Match These Filters",
                "Try changing the Search, Chapter, Report Type, or Period filter, or use Clear Filters to show all Activity Reports.");
            return;
        }

        _empty.ResetMessage();
    }

    private bool HasActiveFilters() =>
        !string.IsNullOrWhiteSpace(_search.TextValue) ||
        _chapterFilter.SelectedIndex > 0 ||
        _typeFilter.SelectedIndex > 0 ||
        _periodFilter.SelectedIndex > 0;

    private void UpdateActionState()
    {
        var hasSelection = Selected() != null;
        if (_editButton != null) _editButton.Enabled = hasSelection;
        if (_deleteButton != null) _deleteButton.Enabled = hasSelection;
        if (_exportButton != null) _exportButton.Enabled = _matchingCount > 0;
        if (_clearFiltersButton != null) _clearFiltersButton.Enabled = HasActiveFilters();
    }

    private void UpdateAnalytics(IReadOnlyCollection<ActivityReport> rows, int totalReportCount)
    {
        var today = DateTime.Today;
        var monthStart = new DateTime(today.Year, today.Month, 1);
        var filtersActive = HasActiveFilters();

        _overviewCountTitle.Text = filtersActive ? "Matching Reports" : "Total Reports";
        _overviewCountValue.Text = filtersActive ? $"{rows.Count} of {totalReportCount}" : totalReportCount.ToString();
        _overviewCountCaption.Text = filtersActive ? "Reports matching the current filters" : "All recorded activity reports";

        _overviewMonthValue.Text = rows
            .Count(r => r.ReportDate.Date >= monthStart && r.ReportDate.Date <= today)
            .ToString();

        var latest = rows
            .OrderByDescending(r => r.ReportDate.Date)
            .ThenByDescending(r => r.ReportID)
            .FirstOrDefault();

        if (latest == null)
        {
            _overviewLatestValue.Text = "—";
            _overviewLatestCaption.Text = filtersActive
                ? "No report matches the current filters"
                : "No reports recorded yet";
        }
        else
        {
            _overviewLatestValue.Text = latest.ReportDate.ToString(
                "MMM d, yyyy",
                System.Globalization.CultureInfo.InvariantCulture);
            _overviewLatestCaption.Text = string.IsNullOrWhiteSpace(latest.Title)
                ? "Untitled report"
                : latest.Title.Trim();
        }

        var anchor = rows.Count > 0 ? rows.Max(r => r.ReportDate.Date) : today;
        var anchorMonth = new DateTime(anchor.Year, anchor.Month, 1);
        var months = Enumerable.Range(0, 6)
            .Select(offset => anchorMonth.AddMonths(offset - 5))
            .Select(month => new KeyValuePair<string, int>(
                month.ToString("MMM", System.Globalization.CultureInfo.InvariantCulture),
                rows.Count(r => r.ReportDate.Year == month.Year && r.ReportDate.Month == month.Month)))
            .ToList();
        _monthlyChart.SetData(months);
        _monthlyChart.SetCaption($"Six-month view ending {anchorMonth:MMM yyyy}");

        var reportTypes = rows
            .GroupBy(r => NormalizeAnalyticsLabel(r.ReportType, "Unspecified"), StringComparer.OrdinalIgnoreCase)
            .Select(group => new KeyValuePair<string, int>(group.Key, group.Count()))
            .OrderByDescending(item => item.Value)
            .ThenBy(item => item.Key, StringComparer.OrdinalIgnoreCase)
            .ToList();
        _typeChart.SetData(reportTypes);
        _typeChart.SetCaption(reportTypes.Count == 0
            ? "No matching report types in the selected results"
            : $"Top {Math.Min(6, reportTypes.Count)} of {reportTypes.Count} report types in view");

        var chapters = rows
            .GroupBy(r => NormalizeAnalyticsLabel(r.ChapterName, "Unassigned"), StringComparer.OrdinalIgnoreCase)
            .Select(group => new KeyValuePair<string, int>(group.Key, group.Count()))
            .OrderByDescending(item => item.Value)
            .ThenBy(item => item.Key, StringComparer.OrdinalIgnoreCase)
            .ToList();
        _chapterChart.SetData(chapters);
        _chapterChart.SetCaption(chapters.Count == 0
            ? "No matching chapters in the selected results"
            : $"Top {Math.Min(6, chapters.Count)} of {chapters.Count} chapters in view");
    }

    private static string NormalizeAnalyticsLabel(string? value, string fallback)
    {
        var clean = value?.Trim();
        return string.IsNullOrWhiteSpace(clean) ? fallback : clean;
    }

    private void ExportPdf()
    {
        List<ActivityReport> rows;
        try
        {
            rows = _repo.GetAll(CurrentFilter());
        }
        catch (Exception ex)
        {
            AppLogger.Error("Load Activity Reports for PDF export", ex);
            CustomDialog.Show(this, "Export Failed", "The current Activity Reports could not be loaded for export.", true);
            return;
        }

        if (rows.Count == 0)
        {
            CustomDialog.Show(this, "Nothing to Export", "No Activity Reports match the current filters.");
            return;
        }

        if (!ActivityReportPdfExporter.IsPdfPrinterAvailable())
        {
            CustomDialog.Show(
                this,
                "PDF Export Unavailable",
                "Microsoft Print to PDF is not enabled on this Windows installation. Enable it in Windows Features, then try again.",
                true);
            return;
        }

        using var saveDialog = new SaveFileDialog
        {
            Title = "Export Activity Reports to PDF",
            Filter = "PDF Document (*.pdf)|*.pdf",
            DefaultExt = "pdf",
            AddExtension = true,
            OverwritePrompt = true,
            FileName = $"MFCYouth_ActivityReports_{DateTime.Now:yyyyMMdd_HHmm}.pdf"
        };

        if (saveDialog.ShowDialog(this) != DialogResult.OK) return;

        var context = new ActivityReportPdfExportContext(
            Search: string.IsNullOrWhiteSpace(_search.TextValue) ? "None" : _search.TextValue.Trim(),
            Chapter: (_chapterFilter.SelectedItem as ChapterFilterChoice)?.Text ?? "All Chapters",
            ReportType: (_typeFilter.SelectedItem as ReportTypeFilterChoice)?.Text ?? "All Types",
            Period: (_periodFilter.SelectedItem as PeriodFilterChoice)?.Text ?? "All Time",
            GeneratedAt: DateTime.Now);

        try
        {
            ActivityReportPdfExporter.Export(saveDialog.FileName, rows, context);
            _dashboard.Notify($"PDF exported: {Path.GetFileName(saveDialog.FileName)}");
        }
        catch (Exception ex)
        {
            AppLogger.Error("Export Activity Reports PDF", ex);
            CustomDialog.Show(this, "Export Failed", ex.Message, true);
        }
    }

    private void Add()
    {
        try
        {
            if (new ChapterRepository().GetTotalCount() == 0)
            {
                CustomDialog.Show(this, "Chapter Required", "Create at least one Chapter before adding an Activity Report.");
                return;
            }
        }
        catch (Exception ex)
        {
            AppLogger.Error("Check Chapters before Add Activity Report", ex);
            CustomDialog.Show(this, "Unable to Continue", "Chapters could not be checked. Please try again.", true);
            return;
        }
        if (ModalHelper.Show(this, () => new ActivityReportEditorForm(), "Open Add Activity Report") != DialogResult.OK) return;
        LoadRows();
        DashboardTrendStore.CaptureCurrentTotals();
        _dashboard.Notify("Activity Report saved.");
    }

    private void Edit()
    {
        var report = Selected();
        if (report == null) return;
        if (ModalHelper.Show(this, () => new ActivityReportEditorForm(report.ReportID), "Open Edit Activity Report") != DialogResult.OK) return;
        LoadRows();
        _dashboard.Notify("Activity Report updated.");
    }

    private void Delete()
    {
        var report = Selected();
        if (report == null) return;
        if (!CustomDialog.Confirm(this, "Delete Activity Report?", $"{report.Title} will be permanently deleted.\n\nThis action cannot be undone.", "Delete Report", true)) return;
        try
        {
            _repo.Delete(report.ReportID);
            LoadRows();
            DashboardTrendStore.CaptureCurrentTotals();
            _dashboard.Notify("Activity Report deleted.");
        }
        catch (Exception ex)
        {
            AppLogger.Error("Delete Activity Report", ex);
            CustomDialog.Show(this, "Delete Failed", ex.Message, true);
        }
    }

    protected override bool ProcessCmdKey(ref Message msg, Keys keyData)
    {
        if (keyData == Keys.F5) { LoadRows(); return true; }
        if (keyData == (Keys.Control | Keys.N)) { Add(); return true; }
        if (keyData == (Keys.Control | Keys.Shift | Keys.F)) { ClearFilters(); return true; }
        if (keyData == (Keys.Control | Keys.Shift | Keys.E)) { ExportPdf(); return true; }
        if (keyData == Keys.Enter && _grid.Focused) { Edit(); return true; }
        if (keyData == Keys.Delete && _grid.Focused) { Delete(); return true; }
        return base.ProcessCmdKey(ref msg, keyData);
    }


    private sealed record ChapterFilterChoice(long? ChapterID, string Text);
    private sealed record ReportTypeFilterChoice(string? Value, string Text);
    private sealed record PeriodFilterChoice(ReportPeriod Period, string Text);
    private enum ReportPeriod { AllTime, ThisMonth, Last30Days, ThisYear }
}
