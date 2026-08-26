using MFCYouthAreaManagementSystem.Models;
using MFCYouthAreaManagementSystem.Repositories;
using MFCYouthAreaManagementSystem.UI.Controls;
using MFCYouthAreaManagementSystem.UI.Theme;
using MFCYouthAreaManagementSystem.Utilities;

namespace MFCYouthAreaManagementSystem.Forms;

public sealed class GIGTrackerForm : Form
{
    private readonly long _memberId;
    private readonly Dashboard _dashboard;
    private readonly GIGContributionRepository _repo = new();
    private readonly DataGridView _grid = UiHelper.CreateGrid();
    private readonly ModernTextBox _search = new() { Placeholder = "Search contributions..." };
    private readonly Label _total = new() { Font = ThemeFonts.Stat, ForeColor = ThemeColors.Primary, Dock = DockStyle.Fill, TextAlign = ContentAlignment.MiddleLeft };
    private readonly EmptyStatePanel _empty = new("No Contributions Yet", "Add a contribution to begin tracking this Member's GIG records.");

    public GIGTrackerForm(long memberId, Dashboard dashboard)
    {
        _memberId = memberId;
        _dashboard = dashboard;
        var member = new MemberRepository().GetById(memberId) ?? throw new InvalidOperationException("Member not found.");

        Text = "GIG Tracker";
        StartPosition = FormStartPosition.CenterParent;
        Size = new Size(900, 650);
        MinimumSize = new Size(780, 560);
        BackColor = ThemeColors.Background;
        Font = ThemeFonts.Body;
        Padding = new Padding(24);
        AutoScaleMode = AutoScaleMode.Dpi;

        var root = new TableLayoutPanel { Dock = DockStyle.Fill, ColumnCount = 1, RowCount = 4, Margin = Padding.Empty, Padding = Padding.Empty };
        root.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 100));
        root.RowStyles.Add(new RowStyle(SizeType.Absolute, ThemeSizes.PageHeaderHeight));
        root.RowStyles.Add(new RowStyle(SizeType.Absolute, 96));
        root.RowStyles.Add(new RowStyle(SizeType.Absolute, 70));
        root.RowStyles.Add(new RowStyle(SizeType.Percent, 100));
        Controls.Add(root);

        root.Controls.Add(new PageHeader("GIG Tracker", $"Contribution records for {member.FullName}."), 0, 0);

        var totalPanel = new TableLayoutPanel { Dock = DockStyle.Fill, RowCount = 2, ColumnCount = 1, BackColor = ThemeColors.Surface, Padding = new Padding(16), Margin = new Padding(0, 0, 0, 6) };
        totalPanel.RowStyles.Add(new RowStyle(SizeType.Absolute, 28));
        totalPanel.RowStyles.Add(new RowStyle(SizeType.Percent, 100));
        totalPanel.Controls.Add(new Label { Text = "Total Contribution", Dock = DockStyle.Fill, Font = ThemeFonts.BodyBold, ForeColor = ThemeColors.TextSecondary }, 0, 0);
        totalPanel.Controls.Add(_total, 0, 1);
        root.Controls.Add(totalPanel, 0, 1);

        var tools = new FlowLayoutPanel { Dock = DockStyle.Fill, FlowDirection = FlowDirection.RightToLeft, WrapContents = false, Padding = new Padding(0, 8, 0, 8), Margin = Padding.Empty, BackColor = ThemeColors.Background };
        var add = Btn("+ Add", 90, ModernButtonStyle.Primary);
        var edit = Btn("Edit", 78, ModernButtonStyle.Secondary);
        var del = Btn("Delete", 82, ModernButtonStyle.Danger);
        var refresh = Btn("Refresh", 86, ModernButtonStyle.Ghost);
        add.Click += (_, _) => Add();
        edit.Click += (_, _) => Edit();
        del.Click += (_, _) => Delete();
        refresh.Click += (_, _) => LoadRows();
        tools.Controls.AddRange(new Control[] { add, del, edit, refresh });
        _search.Width = 300;
        _search.Margin = new Padding(0, 0, 12, 0);
        tools.Controls.Add(_search);
        _search.TextValueChanged += (_, _) => LoadRows();
        root.Controls.Add(tools, 0, 2);

        _grid.Columns.Add(new DataGridViewTextBoxColumn { HeaderText = "Date", DataPropertyName = "ContributionDate", Width = 140, DefaultCellStyle = { Format = "MMMM d, yyyy" } });
        _grid.Columns.Add(new DataGridViewTextBoxColumn { HeaderText = "Amount", DataPropertyName = "Amount", Width = 140, DefaultCellStyle = { Format = "C2", FormatProvider = System.Globalization.CultureInfo.GetCultureInfo("en-PH") } });
        _grid.Columns.Add(new DataGridViewTextBoxColumn { HeaderText = "Remarks", DataPropertyName = "Remarks", AutoSizeMode = DataGridViewAutoSizeColumnMode.Fill });
        _grid.DoubleClick += (_, _) => Edit();

        var content = new Panel { Dock = DockStyle.Fill, Margin = Padding.Empty };
        content.Controls.Add(_grid);
        content.Controls.Add(_empty);
        root.Controls.Add(content, 0, 3);
        Shown += (_, _) => LoadRows();
    }

    private ModernButton Btn(string text, int width, ModernButtonStyle style) => new() { Text = text, Width = width, ButtonStyle = style, Margin = new Padding(6, 0, 0, 0) };
    private GIGContribution? Selected() => _grid.CurrentRow?.DataBoundItem as GIGContribution;

    private void LoadRows()
    {
        try
        {
            var rows = _repo.GetByMember(_memberId, _search.TextValue);
            _grid.DataSource = rows;
            _total.Text = FormattingHelper.Peso(_repo.GetTotalForMember(_memberId));
            _grid.Visible = rows.Count > 0;
            _empty.Visible = rows.Count == 0;
            if (_grid.Visible) _grid.BringToFront(); else _empty.BringToFront();
        }
        catch (Exception ex)
        {
            AppLogger.Error("Load GIG", ex);
            _dashboard.Notify("Could not load GIG contributions.", true);
        }
    }

    private void Add()
    {
        if (ModalHelper.Show(this, () => new GIGContributionEditorForm(_memberId), "Open Add GIG Contribution") != DialogResult.OK) return;
        LoadRows();
        _dashboard.Notify("Contribution added.");
    }

    private void Edit()
    {
        var contribution = Selected();
        if (contribution == null) return;
        if (ModalHelper.Show(this, () => new GIGContributionEditorForm(_memberId, contribution.ContributionID), "Open Edit GIG Contribution") != DialogResult.OK) return;
        LoadRows();
        _dashboard.Notify("Contribution updated.");
    }

    private void Delete()
    {
        var contribution = Selected();
        if (contribution == null) return;
        if (!CustomDialog.Confirm(this, "Delete Contribution?", $"Date: {FormattingHelper.Date(contribution.ContributionDate)}\nAmount: {FormattingHelper.Peso(contribution.Amount)}\n\nThis action cannot be undone.", "Delete Contribution", true)) return;
        try
        {
            _repo.Delete(contribution.ContributionID);
            LoadRows();
            _dashboard.Notify("Contribution deleted.");
        }
        catch (Exception ex)
        {
            AppLogger.Error("Delete GIG Contribution", ex);
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
