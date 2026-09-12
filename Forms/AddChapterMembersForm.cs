using MFCYouthAreaManagementSystem.Models;
using MFCYouthAreaManagementSystem.Repositories;
using MFCYouthAreaManagementSystem.UI.Controls;
using MFCYouthAreaManagementSystem.UI.Theme;
using MFCYouthAreaManagementSystem.Utilities;

namespace MFCYouthAreaManagementSystem.Forms;

public sealed class AddChapterMembersForm : Form
{
    private readonly long _chapterId;
    private readonly MemberRepository _repo = new();
    private readonly ModernTextBox _search = new() { Placeholder = "Search unassigned Members..." };
    private readonly DataGridView _grid = UiHelper.CreateGrid();
    private readonly EmptyStatePanel _empty = new(
        "No Unassigned Members",
        "No unassigned members. All registered members are already assigned to a chapter.");
    private readonly ModernButton _addSelected;
    private readonly Label _selectionLabel = new()
    {
        AutoSize = true,
        Font = ThemeFonts.Body,
        ForeColor = ThemeColors.TextSecondary,
        TextAlign = ContentAlignment.MiddleLeft,
        Margin = new Padding(0, 9, 12, 0)
    };
    private readonly HashSet<long> _selectedMemberIds = new();
    private bool _loadingRows;

    public AddChapterMembersForm(long chapterId, string chapterName)
    {
        _chapterId = chapterId;
        Text = $"Add Members - {chapterName}";
        StartPosition = FormStartPosition.CenterParent;
        BackColor = ThemeColors.Background;
        Font = ThemeFonts.Body;
        ResponsiveLayoutHelper.ConfigureResponsiveDialog(this, new Size(820, 620), new Size(500, 480), allowMaximize: true);

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
        root.RowStyles.Add(new RowStyle(SizeType.Absolute, ThemeSizes.ToolbarSearchHeight + 12));
        root.RowStyles.Add(new RowStyle(SizeType.Percent, 100));
        root.RowStyles.Add(new RowStyle(SizeType.Absolute, ThemeSizes.DialogActionsHeight + 8));
        Controls.Add(root);

        root.Controls.Add(new PageHeader(
            "Add Members",
            $"Select unassigned Members to add to {chapterName}. Already-assigned Members are never shown here."), 0, 0);

        _search.Dock = DockStyle.Fill;
        _search.Margin = new Padding(0, 6, 0, 6);
        root.Controls.Add(_search, 0, 1);
        UiSearchDebouncer.Bind(this, _search, LoadRows);

        _grid.ReadOnly = true;
        _grid.Columns.Add(new DataGridViewCheckBoxColumn
        {
            Name = "Select",
            HeaderText = "Add",
            Width = 62,
            ReadOnly = true,
            SortMode = DataGridViewColumnSortMode.NotSortable
        });
        _grid.Columns.Add(new DataGridViewTextBoxColumn
        {
            Name = "Member",
            HeaderText = "Member",
            DataPropertyName = "FullName",
            AutoSizeMode = DataGridViewAutoSizeColumnMode.Fill,
            FillWeight = 180
        });
        _grid.Columns.Add(new DataGridViewTextBoxColumn
        {
            Name = "Email",
            HeaderText = "Email",
            DataPropertyName = "EmailAddress",
            Width = 220
        });
        _grid.Columns.Add(new DataGridViewTextBoxColumn
        {
            Name = "Contact",
            HeaderText = "Contact Number",
            DataPropertyName = "ContactNumber",
            Width = 140
        });
        ResponsiveLayoutHelper.WireResponsiveGridColumns(this, _grid,
            new ResponsiveGridColumnRule("Email", 700),
            new ResponsiveGridColumnRule("Contact", 560));
        _grid.CellContentClick += OnCellContentClick;
        _grid.KeyDown += OnGridKeyDown;

        var content = new Panel { Dock = DockStyle.Fill, Margin = Padding.Empty };
        content.Controls.Add(_grid);
        content.Controls.Add(_empty);
        root.Controls.Add(content, 0, 2);

        var actions = new FlowLayoutPanel
        {
            Dock = DockStyle.Fill,
            FlowDirection = FlowDirection.RightToLeft,
            WrapContents = false,
            Padding = new Padding(0, 10, 0, 4),
            Margin = Padding.Empty,
            BackColor = ThemeColors.Background
        };
        _addSelected = new ModernButton { Text = "Add Selected Members", Width = 170 };
        var cancel = new ModernButton { Text = "Cancel", Width = 90, ButtonStyle = ModernButtonStyle.Secondary };
        _addSelected.Click += (_, _) => AddSelectedMembers();
        cancel.Click += (_, _) => Close();
        actions.Controls.AddRange(new Control[] { _addSelected, cancel, _selectionLabel });
        root.Controls.Add(actions, 0, 3);
        ResponsiveLayoutHelper.WireResponsiveActionBar(this, actions, root.RowStyles[3], normalActionHeight: ThemeSizes.DialogActionsHeight + 8, compactActionHeight: ResponsiveLayoutHelper.CompactToolbarActionsHeight);

        AcceptButton = _addSelected;
        CancelButton = cancel;
        UpdateSelectionUi();
        Shown += (_, _) => LoadRows();
    }

    private void LoadRows()
    {
        try
        {
            _loadingRows = true;
            var rows = _repo.GetUnassigned(_search.TextValue);
            _grid.DataSource = rows;

            foreach (DataGridViewRow row in _grid.Rows)
            {
                if (row.DataBoundItem is Member member)
                    row.Cells["Select"].Value = _selectedMemberIds.Contains(member.MemberID);
            }

            _grid.Visible = rows.Count > 0;
            _empty.Visible = rows.Count == 0;
            if (_grid.Visible)
            {
                _empty.ResetMessage();
                _grid.BringToFront();
            }
            else
            {
                if (string.IsNullOrWhiteSpace(_search.TextValue))
                {
                    _empty.ShowMessage(
                        "No Unassigned Members",
                        "No unassigned members. All registered members are already assigned to a chapter.");
                }
                else
                {
                    _empty.ShowMessage(
                        "No Matching Members",
                        "No unassigned members match your search.");
                }
                _empty.BringToFront();
            }
        }
        catch (Exception ex)
        {
            AppLogger.Error("Load Unassigned Members", ex);
            _grid.DataSource = null;
            _grid.Visible = false;
            _empty.ShowMessage("Members Could Not Load", "The unassigned Member list is temporarily unavailable. Try again.");
            _empty.Visible = true;
            _empty.BringToFront();
        }
        finally
        {
            _loadingRows = false;
            UpdateSelectionUi();
        }
    }

    private void OnCellContentClick(object? sender, DataGridViewCellEventArgs e)
    {
        if (_loadingRows || e.RowIndex < 0 || e.ColumnIndex < 0) return;
        if (_grid.Columns[e.ColumnIndex].Name != "Select") return;
        ToggleRowSelection(_grid.Rows[e.RowIndex]);
    }

    private void OnGridKeyDown(object? sender, KeyEventArgs e)
    {
        if (e.KeyCode != Keys.Space || _grid.CurrentRow == null) return;
        ToggleRowSelection(_grid.CurrentRow);
        e.Handled = true;
        e.SuppressKeyPress = true;
    }

    private void ToggleRowSelection(DataGridViewRow row)
    {
        if (row.DataBoundItem is not Member member) return;
        if (_selectedMemberIds.Contains(member.MemberID))
            _selectedMemberIds.Remove(member.MemberID);
        else
            _selectedMemberIds.Add(member.MemberID);

        row.Cells["Select"].Value = _selectedMemberIds.Contains(member.MemberID);
        UpdateSelectionUi();
    }

    private void UpdateSelectionUi()
    {
        var count = _selectedMemberIds.Count;
        _selectionLabel.Text = count == 1 ? "1 Member selected" : $"{count} Members selected";
        _addSelected.Enabled = count > 0;
    }

    private void AddSelectedMembers()
    {
        if (_selectedMemberIds.Count == 0) return;
        _addSelected.Enabled = false;
        try
        {
            _repo.AssignUnassignedMembersToChapter(_chapterId, _selectedMemberIds);
            DialogResult = DialogResult.OK;
            Close();
        }
        catch (Exception ex)
        {
            AppLogger.Error("Assign Members to Chapter", ex);
            CustomDialog.Show(this, "Members Could Not Be Added", ex.Message, true);
            _selectedMemberIds.Clear();
            LoadRows();
        }
        finally
        {
            if (DialogResult != DialogResult.OK)
                UpdateSelectionUi();
        }
    }
}
