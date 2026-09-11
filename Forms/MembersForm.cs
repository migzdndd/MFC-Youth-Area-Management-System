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
    private readonly ModernTextBox _search = new() { Placeholder = "Search name, email, contact, Chapter, or Service..." };
    private readonly ModernComboBox _statusFilter = new();
    private readonly ModernComboBox _chapterFilter = new();
    private readonly EmptyStatePanel _empty = new("No Members Yet", "Add the first MFC Youth Member to begin managing your Area.");
    private ModernButton? _clearFiltersButton;
    private bool _suppressFilterReload;

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
            RowCount = 4,
            Margin = Padding.Empty,
            Padding = Padding.Empty
        };
        root.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 100));
        root.RowStyles.Add(new RowStyle(SizeType.Absolute, ThemeSizes.PageHeaderHeight));
        root.RowStyles.Add(new RowStyle(SizeType.Absolute, 82));
        root.RowStyles.Add(new RowStyle(SizeType.Absolute, ThemeSizes.ToolbarActionsHeight + 12));
        root.RowStyles.Add(new RowStyle(SizeType.Percent, 100));
        Controls.Add(root);

        root.Controls.Add(new PageHeader("Members", "Manage registered MFC Youth members, Chapters, Services, and GIG records."), 0, 0);

        var filters = BuildFilters();
        var actions = BuildActions();
        root.Controls.Add(filters, 0, 1);
        root.Controls.Add(actions, 0, 2);
        ResponsiveLayoutHelper.WireResponsiveTableLayout(this, filters, root.RowStyles[1], normalColumns: 3, compactColumns: 2, normalHeight: 82, compactHeight: 154);
        ResponsiveLayoutHelper.WireResponsiveActionBar(this, actions, root.RowStyles[2], normalActionHeight: ThemeSizes.ToolbarActionsHeight + 12, compactActionHeight: ResponsiveLayoutHelper.CompactToolbarActionsHeight);

        _grid.Columns.Add(new DataGridViewTextBoxColumn { Name = "Name", HeaderText = "Member", DataPropertyName = "FullName", AutoSizeMode = DataGridViewAutoSizeColumnMode.Fill, FillWeight = 180 });
        _grid.Columns.Add(new DataGridViewTextBoxColumn { Name = "Chapter", HeaderText = "Chapter", DataPropertyName = "ChapterName", Width = 150 });
        _grid.Columns.Add(new DataGridViewTextBoxColumn { Name = "Status", HeaderText = "Status", DataPropertyName = "Status", Width = 90 });
        _grid.Columns.Add(new DataGridViewTextBoxColumn { Name = "Services", HeaderText = "Services", DataPropertyName = "Services", AutoSizeMode = DataGridViewAutoSizeColumnMode.Fill, FillWeight = 170 });
        _grid.Columns.Add(new DataGridViewTextBoxColumn { Name = "Contact", HeaderText = "Contact Number", DataPropertyName = "ContactNumber", Width = 125 });
        ResponsiveLayoutHelper.WireResponsiveGridColumns(this, _grid,
            new ResponsiveGridColumnRule("Services", 760),
            new ResponsiveGridColumnRule("Contact", 700),
            new ResponsiveGridColumnRule("Status", 560));
        _grid.DoubleClick += (_, _) => OpenDetails();

        var content = new Panel { Dock = DockStyle.Fill, Margin = Padding.Empty };
        content.Controls.Add(_grid);
        content.Controls.Add(_empty);
        root.Controls.Add(content, 0, 3);

        LoadFilterChoices();
        UiSearchDebouncer.Bind(this, _search, LoadRows);
        _statusFilter.SelectedIndexChanged += (_, _) => ReloadFromFilterChange();
        _chapterFilter.SelectedIndexChanged += (_, _) => ReloadFromFilterChange();
        Shown += (_, _) => LoadRows();
    }

    private TableLayoutPanel BuildFilters()
    {
        var filters = new TableLayoutPanel
        {
            Dock = DockStyle.Fill,
            ColumnCount = 3,
            RowCount = 1,
            Padding = Padding.Empty,
            Margin = Padding.Empty
        };
        filters.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 50));
        filters.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 20));
        filters.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 30));
        filters.RowStyles.Add(new RowStyle(SizeType.Percent, 100));

        filters.Controls.Add(FilterField("Search", _search, 0), 0, 0);
        filters.Controls.Add(FilterField("Status", _statusFilter, 6), 1, 0);
        filters.Controls.Add(FilterField("Chapter", _chapterFilter, 6), 2, 0);
        return filters;
    }

    private FlowLayoutPanel BuildActions()
    {
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
        var view = Btn("View", 82, ModernButtonStyle.Secondary);
        var edit = Btn("Edit", 82, ModernButtonStyle.Secondary);
        var service = Btn("Services", 92, ModernButtonStyle.Secondary);
        var gig = Btn("GIG", 74, ModernButtonStyle.Secondary);
        var del = Btn("Delete", 82, ModernButtonStyle.Danger);
        var refresh = Btn("Refresh", 88, ModernButtonStyle.Ghost);
        var clear = Btn("Clear Filters", 104, ModernButtonStyle.Ghost);
        _clearFiltersButton = clear;

        add.Click += (_, _) => AddMember();
        view.Click += (_, _) => OpenDetails();
        edit.Click += (_, _) => EditSelected();
        service.Click += (_, _) => AssignServices();
        gig.Click += (_, _) => OpenGig();
        del.Click += (_, _) => DeleteSelected();
        refresh.Click += (_, _) => LoadRows();
        clear.Click += (_, _) => ClearFilters();
        actions.Controls.AddRange(new Control[] { add, del, gig, service, edit, view, refresh, clear });
        UpdateFilterActionState();
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
            _statusFilter.Items.Clear();
            _statusFilter.Items.Add("All Statuses");
            _statusFilter.Items.AddRange(ApplicationConstants.MemberStatuses.Cast<object>().ToArray());
            _statusFilter.SelectedIndex = 0;

            _chapterFilter.DisplayMember = nameof(MemberChapterFilterChoice.Text);
            var chapters = new List<MemberChapterFilterChoice> { new(null, "All Chapters") };
            chapters.AddRange(new ChapterRepository().GetAll().Select(c => new MemberChapterFilterChoice(c.ChapterID, c.ChapterName)));
            _chapterFilter.DataSource = chapters;
            if (_chapterFilter.Items.Count > 0) _chapterFilter.SelectedIndex = 0;
        }
        catch (Exception ex)
        {
            AppLogger.Error("Load Member Filters", ex);
            _statusFilter.Items.Clear();
            _statusFilter.Items.Add("All Statuses");
            _statusFilter.SelectedIndex = 0;
            _chapterFilter.DataSource = new List<MemberChapterFilterChoice> { new(null, "All Chapters") };
            _chapterFilter.SelectedIndex = 0;
        }
        finally
        {
            _suppressFilterReload = false;
        }
        UpdateFilterActionState();
    }

    private ModernButton Btn(string text, int width, ModernButtonStyle style) => new()
    {
        Text = text,
        Width = width,
        ButtonStyle = style,
        Margin = new Padding(6, 0, 0, 0)
    };

    private Member? Selected() => _grid.CurrentRow?.DataBoundItem as Member;

    private string? SelectedStatus() => _statusFilter.SelectedIndex > 0
        ? _statusFilter.SelectedItem?.ToString()?.Trim()
        : null;

    private long? SelectedChapterId() => (_chapterFilter.SelectedItem as MemberChapterFilterChoice)?.ChapterID;

    private void ReloadFromFilterChange()
    {
        if (_suppressFilterReload || !IsHandleCreated) return;
        UpdateFilterActionState();
        LoadRows();
    }

    private bool HasActiveFilters() =>
        !string.IsNullOrWhiteSpace(_search.TextValue) ||
        _statusFilter.SelectedIndex > 0 ||
        SelectedChapterId().HasValue;

    private void UpdateFilterActionState()
    {
        if (_clearFiltersButton != null) _clearFiltersButton.Enabled = HasActiveFilters();
    }

    private void ClearFilters()
    {
        _suppressFilterReload = true;
        try
        {
            _search.TextValue = string.Empty;
            if (_statusFilter.Items.Count > 0) _statusFilter.SelectedIndex = 0;
            if (_chapterFilter.Items.Count > 0) _chapterFilter.SelectedIndex = 0;
        }
        finally
        {
            _suppressFilterReload = false;
        }

        UpdateFilterActionState();
        LoadRows();
    }

    private void LoadRows()
    {
        try
        {
            var rows = _repo.Search(_search.TextValue, SelectedStatus(), SelectedChapterId());
            _grid.DataSource = rows;
            _grid.Visible = rows.Count > 0;
            _empty.Visible = rows.Count == 0;

            if (_grid.Visible)
            {
                _empty.ResetMessage();
                _grid.BringToFront();
            }
            else
            {
                if (HasActiveFilters())
                {
                    _empty.ShowMessage(
                        "No Members Match These Filters",
                        "Try changing the Search, Status, or Chapter filter, or use Clear Filters to show all Members.");
                }
                else
                {
                    _empty.ResetMessage();
                }
                _empty.BringToFront();
            }

            UpdateFilterActionState();
        }
        catch (Exception ex)
        {
            AppLogger.Error("Load Members", ex);
            _grid.DataSource = null;
            _grid.Visible = false;
            _empty.ShowMessage("Members Could Not Load", "The Member list is temporarily unavailable. Try refreshing again.");
            _empty.Visible = true;
            _empty.BringToFront();
            UpdateFilterActionState();
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
        DashboardTrendStore.CaptureCurrentTotals();
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
        ModalHelper.Show(this, () => new MemberDetailsForm(member.MemberID), "Open Member Details");
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
            DashboardTrendStore.CaptureCurrentTotals();
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

    private sealed record MemberChapterFilterChoice(long? ChapterID, string Text);
}
