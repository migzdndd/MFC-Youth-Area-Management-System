using MFCYouthAreaManagementSystem.Models;
using MFCYouthAreaManagementSystem.Repositories;
using MFCYouthAreaManagementSystem.UI.Controls;
using MFCYouthAreaManagementSystem.UI.Theme;
using MFCYouthAreaManagementSystem.Utilities;

namespace MFCYouthAreaManagementSystem.Forms;

public sealed class MembersForm : Form
{
    private readonly Dashboard _dashboard;
    private readonly MemberRepository _repo = new();
    private readonly DataGridView _grid = UiHelper.CreateGrid();
    private readonly ModernTextBox _search = new() { Placeholder = "Search members..." };
    private readonly EmptyStatePanel _empty = new("No Members Yet", "Add the first MFC Youth Member to begin managing your Area.");

    public MembersForm(Dashboard dashboard)
    {
        _dashboard = dashboard;
        BackColor = ThemeColors.Background;
        Font = ThemeFonts.Body;
        AutoScaleMode = AutoScaleMode.Dpi;

        var root = new TableLayoutPanel
        {
            Dock = DockStyle.Fill,
            ColumnCount = 1,
            RowCount = 3,
            Margin = Padding.Empty,
            Padding = Padding.Empty
        };
        root.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 100));
        root.RowStyles.Add(new RowStyle(SizeType.Absolute, ThemeSizes.PageHeaderHeight));
        root.RowStyles.Add(new RowStyle(SizeType.Absolute, ThemeSizes.ToolbarSearchHeight + ThemeSizes.ToolbarActionsHeight + 12));
        root.RowStyles.Add(new RowStyle(SizeType.Percent, 100));
        Controls.Add(root);

        root.Controls.Add(new PageHeader("Members", "Manage registered MFC Youth members, Chapters, Services, and GIG records."), 0, 0);

        var tools = new TableLayoutPanel
        {
            Dock = DockStyle.Fill,
            ColumnCount = 1,
            RowCount = 2,
            Margin = Padding.Empty,
            Padding = new Padding(0, 6, 0, 6)
        };
        tools.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 100));
        tools.RowStyles.Add(new RowStyle(SizeType.Absolute, ThemeSizes.ToolbarSearchHeight));
        tools.RowStyles.Add(new RowStyle(SizeType.Absolute, ThemeSizes.ToolbarActionsHeight));
        root.Controls.Add(tools, 0, 1);

        var actions = new FlowLayoutPanel
        {
            Dock = DockStyle.Fill,
            FlowDirection = FlowDirection.RightToLeft,
            WrapContents = false,
            Margin = Padding.Empty,
            Padding = new Padding(0, 6, 0, 6),
            BackColor = ThemeColors.Background
        };

        var add = Btn("+ Add Member", 130, ModernButtonStyle.Primary);
        var edit = Btn("Edit", 82, ModernButtonStyle.Secondary);
        var service = Btn("Services", 92, ModernButtonStyle.Secondary);
        var gig = Btn("GIG", 74, ModernButtonStyle.Secondary);
        var del = Btn("Delete", 82, ModernButtonStyle.Danger);
        var refresh = Btn("Refresh", 88, ModernButtonStyle.Ghost);
        add.Click += (_, _) => AddMember();
        edit.Click += (_, _) => EditSelected();
        service.Click += (_, _) => AssignServices();
        gig.Click += (_, _) => OpenGig();
        del.Click += (_, _) => DeleteSelected();
        refresh.Click += (_, _) => LoadRows();
        actions.Controls.AddRange(new Control[] { add, del, gig, service, edit, refresh });
        tools.Controls.Add(_search, 0, 0);
        tools.Controls.Add(actions, 0, 1);
        _search.Dock = DockStyle.Fill;
        _search.Margin = new Padding(0, 3, 0, 3);
        _search.TextValueChanged += (_, _) => LoadRows();

        _grid.Columns.Add(new DataGridViewTextBoxColumn { Name = "Name", HeaderText = "Member", DataPropertyName = "FullName", AutoSizeMode = DataGridViewAutoSizeColumnMode.Fill, FillWeight = 180 });
        _grid.Columns.Add(new DataGridViewTextBoxColumn { Name = "Chapter", HeaderText = "Chapter", DataPropertyName = "ChapterName", Width = 150 });
        _grid.Columns.Add(new DataGridViewTextBoxColumn { Name = "Status", HeaderText = "Status", DataPropertyName = "Status", Width = 90 });
        _grid.Columns.Add(new DataGridViewTextBoxColumn { Name = "Services", HeaderText = "Services", DataPropertyName = "Services", AutoSizeMode = DataGridViewAutoSizeColumnMode.Fill, FillWeight = 170 });
        _grid.Columns.Add(new DataGridViewTextBoxColumn { Name = "Contact", HeaderText = "Contact Number", DataPropertyName = "ContactNumber", Width = 125 });
        _grid.DoubleClick += (_, _) => OpenDetails();

        var content = new Panel { Dock = DockStyle.Fill, Margin = Padding.Empty };
        content.Controls.Add(_grid);
        content.Controls.Add(_empty);
        root.Controls.Add(content, 0, 2);

        Shown += (_, _) => LoadRows();
    }

    private ModernButton Btn(string text, int width, ModernButtonStyle style) => new()
    {
        Text = text,
        Width = width,
        ButtonStyle = style,
        Margin = new Padding(6, 0, 0, 0)
    };

    private Member? Selected() => _grid.CurrentRow?.DataBoundItem as Member;

    private void LoadRows()
    {
        try
        {
            var rows = _repo.Search(_search.TextValue);
            _grid.DataSource = rows;
            _grid.Visible = rows.Count > 0;
            _empty.Visible = rows.Count == 0;
            if (_grid.Visible) _grid.BringToFront(); else _empty.BringToFront();
        }
        catch (Exception ex)
        {
            AppLogger.Error("Load Members", ex);
            _dashboard.Notify("Could not load Members.", true);
        }
    }

    private void AddMember()
    {
        try
        {
            if (new ChapterRepository().GetTotalCount() == 0)
            {
                CustomDialog.Show(this, "Chapter Required", "Create at least one Chapter before adding a Member.");
                return;
            }
        }
        catch (Exception ex)
        {
            AppLogger.Error("Check Chapters before Add Member", ex);
            CustomDialog.Show(this, "Unable to Continue", "Chapters could not be checked. Please try again.", true);
            return;
        }
        if (ModalHelper.Show(this, () => new MemberEditorForm(), "Open Add Member") != DialogResult.OK) return;
        LoadRows();
        _dashboard.Notify("Member added successfully.");
    }

    private void EditSelected()
    {
        var member = Selected();
        if (member == null) return;
        if (ModalHelper.Show(this, () => new MemberEditorForm(member.MemberID), "Open Edit Member") != DialogResult.OK) return;
        LoadRows();
        _dashboard.Notify("Member updated successfully.");
    }

    private void OpenDetails()
    {
        var member = Selected();
        if (member == null) return;
        ModalHelper.Show(this, () => new MemberDetailsForm(member.MemberID, _dashboard), "Open Member Details");
        LoadRows();
    }

    private void AssignServices()
    {
        var member = Selected();
        if (member == null) return;
        if (ModalHelper.Show(this, () => new AssignServicesForm(member.MemberID), "Open Assign Services") != DialogResult.OK) return;
        LoadRows();
        _dashboard.Notify("Services updated.");
    }

    private void OpenGig()
    {
        var member = Selected();
        if (member == null) return;
        ModalHelper.Show(this, () => new GIGTrackerForm(member.MemberID, _dashboard), "Open GIG Tracker");
    }

    private void DeleteSelected()
    {
        var member = Selected();
        if (member == null) return;
        if (!CustomDialog.Confirm(this, "Delete Member?",
                $"{member.FullName} will be permanently removed. Related Service assignments and GIG contributions will follow the database relationship rules.\n\nThis action cannot be undone.",
                "Delete Member", true)) return;

        try
        {
            _repo.Delete(member.MemberID);
            LoadRows();
            _dashboard.Notify("Member deleted.");
        }
        catch (Exception ex)
        {
            AppLogger.Error("Delete Member", ex);
            CustomDialog.Show(this, "Delete Failed", ex.Message, true);
        }
    }

    protected override bool ProcessCmdKey(ref Message msg, Keys keyData)
    {
        if (keyData == Keys.F5) { LoadRows(); return true; }
        if (keyData == (Keys.Control | Keys.N)) { AddMember(); return true; }
        if (keyData == Keys.Enter && _grid.Focused) { OpenDetails(); return true; }
        if (keyData == Keys.Delete && _grid.Focused) { DeleteSelected(); return true; }
        return base.ProcessCmdKey(ref msg, keyData);
    }
}
