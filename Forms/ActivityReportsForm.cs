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
    private readonly EmptyStatePanel _empty = new("No Activity Reports Yet", "Create the first Activity Report to begin documenting Area and Chapter activities.");

    public ActivityReportsForm(Dashboard dashboard)
    {
        _dashboard = dashboard;
        BackColor = ThemeColors.Background;
        Font = ThemeFonts.Body;
        AutoScaleMode = AutoScaleMode.Dpi;

        var root = new TableLayoutPanel { Dock = DockStyle.Fill, ColumnCount = 1, RowCount = 3, Margin = Padding.Empty, Padding = Padding.Empty };
        root.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 100));
        root.RowStyles.Add(new RowStyle(SizeType.Absolute, ThemeSizes.PageHeaderHeight));
        root.RowStyles.Add(new RowStyle(SizeType.Absolute, ThemeSizes.ToolbarSearchHeight + ThemeSizes.ToolbarActionsHeight + 12));
        root.RowStyles.Add(new RowStyle(SizeType.Percent, 100));
        Controls.Add(root);

        root.Controls.Add(new PageHeader("Activity Reports", "Create, review, edit, and search Area and Chapter activity reports."), 0, 0);

        var tools = new TableLayoutPanel { Dock = DockStyle.Fill, ColumnCount = 1, RowCount = 2, Padding = new Padding(0, 6, 0, 6), Margin = Padding.Empty };
        tools.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 100));
        tools.RowStyles.Add(new RowStyle(SizeType.Absolute, ThemeSizes.ToolbarSearchHeight));
        tools.RowStyles.Add(new RowStyle(SizeType.Absolute, ThemeSizes.ToolbarActionsHeight));
        var actions = new FlowLayoutPanel { Dock = DockStyle.Fill, FlowDirection = FlowDirection.RightToLeft, WrapContents = false, Padding = new Padding(0, 6, 0, 6), Margin = Padding.Empty, BackColor = ThemeColors.Background };
        var add = Btn("+ Add Report", 118, ModernButtonStyle.Primary);
        var edit = Btn("Edit", 82, ModernButtonStyle.Secondary);
        var del = Btn("Delete", 82, ModernButtonStyle.Danger);
        var refresh = Btn("Refresh", 86, ModernButtonStyle.Ghost);
        add.Click += (_, _) => Add();
        edit.Click += (_, _) => Edit();
        del.Click += (_, _) => Delete();
        refresh.Click += (_, _) => LoadRows();
        actions.Controls.AddRange(new Control[] { add, del, edit, refresh });
        _search.Dock = DockStyle.Fill;
        _search.Margin = new Padding(0, 3, 0, 3);
        tools.Controls.Add(_search, 0, 0);
        tools.Controls.Add(actions, 0, 1);
        _search.TextValueChanged += (_, _) => LoadRows();
        root.Controls.Add(tools, 0, 1);

        _grid.Columns.Add(new DataGridViewTextBoxColumn { HeaderText = "Date", DataPropertyName = "ReportDate", Width = 115, DefaultCellStyle = { Format = "MMM d, yyyy" } });
        _grid.Columns.Add(new DataGridViewTextBoxColumn { HeaderText = "Title", DataPropertyName = "Title", AutoSizeMode = DataGridViewAutoSizeColumnMode.Fill });
        _grid.Columns.Add(new DataGridViewTextBoxColumn { HeaderText = "Chapter", DataPropertyName = "ChapterName", Width = 150 });
        _grid.Columns.Add(new DataGridViewTextBoxColumn { HeaderText = "Type", DataPropertyName = "ReportType", Width = 135 });
        _grid.Columns.Add(new DataGridViewTextBoxColumn { HeaderText = "Prepared By", DataPropertyName = "PreparedBy", Width = 150 });
        _grid.DoubleClick += (_, _) => Edit();

        var content = new Panel { Dock = DockStyle.Fill, Margin = Padding.Empty };
        content.Controls.Add(_grid);
        content.Controls.Add(_empty);
        root.Controls.Add(content, 0, 2);
        Shown += (_, _) => LoadRows();
    }

    private ModernButton Btn(string text, int width, ModernButtonStyle style) => new() { Text = text, Width = width, ButtonStyle = style, Margin = new Padding(6, 0, 0, 0) };
    private ActivityReport? Selected() => _grid.CurrentRow?.DataBoundItem as ActivityReport;

    private void LoadRows()
    {
        try
        {
            var rows = _repo.GetAll(_search.TextValue);
            _grid.DataSource = rows;
            _grid.Visible = rows.Count > 0;
            _empty.Visible = rows.Count == 0;
            if (_grid.Visible) _grid.BringToFront(); else _empty.BringToFront();
        }
        catch (Exception ex)
        {
            AppLogger.Error("Load Activity Reports", ex);
            _dashboard.Notify("Could not load Activity Reports.", true);
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
        if (keyData == Keys.Enter && _grid.Focused) { Edit(); return true; }
        if (keyData == Keys.Delete && _grid.Focused) { Delete(); return true; }
        return base.ProcessCmdKey(ref msg, keyData);
    }
}
