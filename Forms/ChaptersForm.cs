using MFCYouthAreaManagementSystem.Models;
using MFCYouthAreaManagementSystem.Repositories;
using MFCYouthAreaManagementSystem.UI.Controls;
using MFCYouthAreaManagementSystem.UI.Theme;
using MFCYouthAreaManagementSystem.Utilities;

namespace MFCYouthAreaManagementSystem.Forms;

public sealed class ChaptersForm : Form
{
    private readonly Dashboard _dashboard;
    private readonly ChapterRepository _repo = new();
    private readonly DataGridView _grid = UiHelper.CreateGrid();
    private readonly ModernTextBox _search = new() { Placeholder = "Search Chapters..." };
    private readonly EmptyStatePanel _empty = new("No Chapters Yet", "Create the first Chapter to begin organizing Members.");

    private readonly ContextMenuStrip _rowActionsMenu = new()
    {
        ShowImageMargin = false,
        ShowCheckMargin = false,
        BackColor = ThemeColors.Surface,
        ForeColor = ThemeColors.TextPrimary,
        Font = ThemeFonts.Body,
        ShowItemToolTips = true
    };
    private readonly ToolStripMenuItem _rowViewMembers = new("View Members");
    private readonly ToolStripMenuItem _rowAddMembers = new("+ Add Members");
    private readonly ToolStripMenuItem _rowRename = new("Rename Chapter");
    private readonly ToolStripMenuItem _rowDelete = new("Delete Chapter");
    private Chapter? _menuChapter;

    private ModernButton? _renameButton;
    private ModernButton? _addMembersButton;
    private ModernButton? _viewButton;
    private ModernButton? _deleteButton;

    public ChaptersForm(Dashboard dashboard)
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

        root.Controls.Add(
            new PageHeader(
                "Chapters",
                "Review Chapter membership, active Members, and Chapter actions."),
            0,
            0);

        var tools = new TableLayoutPanel
        {
            Dock = DockStyle.Fill,
            ColumnCount = 1,
            RowCount = 2,
            Padding = new Padding(0, 6, 0, 6),
            Margin = Padding.Empty
        };
        tools.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 100));
        tools.RowStyles.Add(new RowStyle(SizeType.Absolute, ThemeSizes.ToolbarSearchHeight));
        tools.RowStyles.Add(new RowStyle(SizeType.Absolute, ThemeSizes.ToolbarActionsHeight));

        var actions = new FlowLayoutPanel
        {
            Dock = DockStyle.Fill,
            FlowDirection = FlowDirection.RightToLeft,
            WrapContents = false,
            Padding = new Padding(0, 6, 0, 6),
            Margin = Padding.Empty,
            BackColor = ThemeColors.Background
        };

        var add = Btn("+ Add Chapter", 125, ModernButtonStyle.Primary);
        var rename = Btn("Rename", 88, ModernButtonStyle.Secondary);
        var addMembers = Btn("+ Add Members", 120, ModernButtonStyle.Secondary);
        var view = Btn("View Members", 110, ModernButtonStyle.Secondary);
        var del = Btn("Delete", 82, ModernButtonStyle.Danger);
        var refresh = Btn("Refresh", 85, ModernButtonStyle.Ghost);

        _renameButton = rename;
        _addMembersButton = addMembers;
        _viewButton = view;
        _deleteButton = del;

        add.Click += (_, _) => Add();
        rename.Click += (_, _) => Rename();
        addMembers.Click += (_, _) => AddMembers();
        view.Click += (_, _) => View();
        del.Click += (_, _) => Delete();
        refresh.Click += (_, _) => LoadRows();
        actions.Controls.AddRange(new Control[] { add, del, view, addMembers, rename, refresh });

        _search.Dock = DockStyle.Fill;
        _search.Margin = new Padding(0, 3, 0, 3);
        tools.Controls.Add(_search, 0, 0);
        tools.Controls.Add(actions, 0, 1);
        ResponsiveLayoutHelper.WireResponsiveActionBar(
            this,
            actions,
            tools.RowStyles[1],
            root.RowStyles[1],
            normalToolbarHeight: ThemeSizes.ToolbarSearchHeight + ThemeSizes.ToolbarActionsHeight + 12,
            compactToolbarHeight: ThemeSizes.ToolbarSearchHeight +
                                  ResponsiveLayoutHelper.CompactToolbarActionsHeight +
                                  ResponsiveLayoutHelper.CompactToolbarGap);
        UiSearchDebouncer.Bind(this, _search, LoadRows);
        root.Controls.Add(tools, 0, 1);

        _grid.Columns.Add(new DataGridViewTextBoxColumn
        {
            Name = "Chapter",
            HeaderText = "Chapter Name",
            DataPropertyName = "ChapterName",
            AutoSizeMode = DataGridViewAutoSizeColumnMode.Fill,
            FillWeight = 180,
            MinimumWidth = 150
        });
        _grid.Columns.Add(new DataGridViewTextBoxColumn
        {
            Name = "Members",
            HeaderText = "Member Count",
            DataPropertyName = "MemberCount",
            Width = 118,
            MinimumWidth = 105,
            DefaultCellStyle =
            {
                Alignment = DataGridViewContentAlignment.MiddleCenter
            }
        });
        _grid.Columns.Add(new DataGridViewTextBoxColumn
        {
            Name = "ActiveMembers",
            HeaderText = "Active Member Count",
            DataPropertyName = "ActiveMemberCount",
            Width = 150,
            MinimumWidth = 130,
            DefaultCellStyle =
            {
                Alignment = DataGridViewContentAlignment.MiddleCenter,
                ForeColor = ThemeColors.Success,
                SelectionForeColor = ThemeColors.Success
            }
        });

        var actionsColumn = new DataGridViewButtonColumn
        {
            Name = "Actions",
            HeaderText = "Actions",
            Text = "Manage",
            UseColumnTextForButtonValue = true,
            Width = 96,
            MinimumWidth = 88,
            FlatStyle = FlatStyle.Flat,
            SortMode = DataGridViewColumnSortMode.NotSortable
        };
        actionsColumn.DefaultCellStyle.Alignment = DataGridViewContentAlignment.MiddleCenter;
        actionsColumn.DefaultCellStyle.ForeColor = ThemeColors.Primary;
        actionsColumn.DefaultCellStyle.SelectionForeColor = ThemeColors.Primary;
        actionsColumn.DefaultCellStyle.BackColor = ThemeColors.Surface;
        actionsColumn.DefaultCellStyle.SelectionBackColor = ThemeColors.Selection;
        _grid.Columns.Add(actionsColumn);

        _grid.CellContentClick += OnGridCellContentClick;
        _grid.DoubleClick += (_, _) => View();
        _grid.SelectionChanged += (_, _) => UpdateActionState();

        ConfigureRowActionsMenu();

        var content = new Panel { Dock = DockStyle.Fill, Margin = Padding.Empty };
        content.Controls.Add(_grid);
        content.Controls.Add(_empty);
        root.Controls.Add(content, 0, 2);

        Load += (_, _) => LoadRows();
    }

    private ModernButton Btn(string text, int width, ModernButtonStyle style) => new()
    {
        Text = text,
        Width = width,
        ButtonStyle = style,
        Margin = new Padding(6, 0, 0, 0)
    };

    private Chapter? Selected() => _grid.CurrentRow?.DataBoundItem as Chapter;

    private void ConfigureRowActionsMenu()
    {
        _rowViewMembers.ToolTipText = "View the Members currently assigned to this Chapter.";
        _rowAddMembers.ToolTipText = "Assign currently unassigned Members to this Chapter.";
        _rowRename.ToolTipText = "Change this Chapter's name.";
        _rowDelete.ToolTipText = "Delete this Chapter when it no longer has assigned Members.";

        _rowViewMembers.Click += (_, _) => View(_menuChapter);
        _rowAddMembers.Click += (_, _) => AddMembers(_menuChapter);
        _rowRename.Click += (_, _) => Rename(_menuChapter);
        _rowDelete.Click += (_, _) => Delete(_menuChapter);

        _rowActionsMenu.Items.AddRange(new ToolStripItem[]
        {
            _rowViewMembers,
            _rowAddMembers,
            new ToolStripSeparator(),
            _rowRename,
            _rowDelete
        });

        _rowActionsMenu.Closed += (_, _) => _menuChapter = null;
    }

    private void OnGridCellContentClick(object? sender, DataGridViewCellEventArgs e)
    {
        if (e.RowIndex < 0 || e.ColumnIndex < 0) return;
        if (_grid.Columns[e.ColumnIndex].Name != "Actions") return;
        if (_grid.Rows[e.RowIndex].DataBoundItem is not Chapter chapter) return;

        _grid.CurrentCell = _grid.Rows[e.RowIndex].Cells["Chapter"];
        _grid.Rows[e.RowIndex].Selected = true;

        _menuChapter = chapter;
        _rowDelete.ToolTipText = chapter.MemberCount > 0
            ? $"Move or remove {chapter.MemberCount} assigned Member(s) before deleting this Chapter."
            : "Delete this Chapter. Historical Reports and Event registrations will be preserved.";

        var cellBounds = _grid.GetCellDisplayRectangle(e.ColumnIndex, e.RowIndex, cutOverflow: true);
        _rowActionsMenu.Show(_grid, new Point(cellBounds.Left, cellBounds.Bottom));
    }

    private void LoadRows()
    {
        try
        {
            _rowActionsMenu.Close();
            var rows = _repo.GetAll(_search.TextValue);

            if (rows.Count == 0 && !string.IsNullOrWhiteSpace(_search.TextValue))
            {
                _empty.ShowMessage(
                    "No Chapters Match Your Search",
                    "Try a different Chapter name or clear the Search box.");
            }
            else
            {
                _empty.ResetMessage();
            }

            _grid.DataSource = rows;
            _grid.Visible = rows.Count > 0;
            _empty.Visible = rows.Count == 0;

            if (_grid.Visible)
                _grid.BringToFront();
            else
                _empty.BringToFront();

            UpdateActionState();
        }
        catch (Exception ex)
        {
            AppLogger.Error("Load Chapters", ex);
            _grid.DataSource = null;
            _grid.Visible = false;
            _empty.ShowMessage(
                "Chapters Could Not Load",
                "The Chapter list is temporarily unavailable. Try refreshing again.");
            _empty.Visible = true;
            _empty.BringToFront();
            UpdateActionState();
            _dashboard.Notify("Could not load Chapters.", true);
        }
    }

    private void UpdateActionState()
    {
        var hasSelection = Selected() != null;
        if (_renameButton != null) _renameButton.Enabled = hasSelection;
        if (_addMembersButton != null) _addMembersButton.Enabled = hasSelection;
        if (_viewButton != null) _viewButton.Enabled = hasSelection;
        if (_deleteButton != null) _deleteButton.Enabled = hasSelection;
    }

    private void Add()
    {
        if (ModalHelper.Show(this, () => new ChapterDialogForm(), "Open Add Chapter") != DialogResult.OK) return;
        LoadRows();
        DashboardTrendStore.CaptureCurrentTotals();
        _dashboard.Notify("Chapter created.");
    }

    private void Rename() => Rename(Selected());

    private void Rename(Chapter? chapter)
    {
        if (chapter == null) return;
        if (ModalHelper.Show(this, () => new ChapterDialogForm(chapter), "Open Rename Chapter") != DialogResult.OK) return;
        LoadRows();
        _dashboard.Notify("Chapter renamed.");
    }

    private void View() => View(Selected());

    private void View(Chapter? chapter)
    {
        if (chapter == null) return;
        ModalHelper.Show(
            this,
            () => new ChapterMembersForm(chapter.ChapterID, _dashboard),
            "Open Chapter Members");
        LoadRows();
    }

    private void AddMembers() => AddMembers(Selected());

    private void AddMembers(Chapter? chapter)
    {
        if (chapter == null) return;
        if (ModalHelper.Show(
                this,
                () => new AddChapterMembersForm(chapter.ChapterID, chapter.ChapterName),
                "Open Add Chapter Members") != DialogResult.OK)
            return;

        LoadRows();
        _dashboard.Notify("Members added to Chapter.");
    }

    private void Delete() => Delete(Selected());

    private void Delete(Chapter? chapter)
    {
        if (chapter == null) return;

        if (chapter.MemberCount > 0)
        {
            CustomDialog.Show(
                this,
                "Delete Not Available",
                $"{chapter.ChapterName} currently has {chapter.MemberCount} Member(s).\n\n" +
                "Move these Members to another Chapter before deleting this Chapter.");
            return;
        }

        if (!CustomDialog.Confirm(
                this,
                "Delete Chapter?",
                $"{chapter.ChapterName} will be permanently removed.\n\n" +
                "Historical Activity Reports and Event registrations will be kept and will retain this Chapter name.",
                "Delete Chapter",
                true))
            return;

        try
        {
            _repo.Delete(chapter.ChapterID);
            LoadRows();
            DashboardTrendStore.CaptureCurrentTotals();
            _dashboard.Notify("Chapter deleted.");
        }
        catch (Exception ex)
        {
            AppLogger.Error("Delete Chapter", ex);
            CustomDialog.Show(this, "Delete Failed", ex.Message, true);
        }
    }

    protected override bool ProcessCmdKey(ref Message msg, Keys keyData)
    {
        if (keyData == Keys.F5)
        {
            LoadRows();
            return true;
        }

        if (keyData == (Keys.Control | Keys.N))
        {
            Add();
            return true;
        }

        if (keyData == Keys.Enter && _grid.Focused)
        {
            View();
            return true;
        }

        if (keyData == Keys.Delete && _grid.Focused)
        {
            Delete();
            return true;
        }

        return base.ProcessCmdKey(ref msg, keyData);
    }

    protected override void Dispose(bool disposing)
    {
        if (disposing)
            _rowActionsMenu.Dispose();

        base.Dispose(disposing);
    }
}
