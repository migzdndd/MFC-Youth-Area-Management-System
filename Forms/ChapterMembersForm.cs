using MFCYouthAreaManagementSystem.Models;
using MFCYouthAreaManagementSystem.Repositories;
using MFCYouthAreaManagementSystem.UI.Controls;
using MFCYouthAreaManagementSystem.UI.Theme;
using MFCYouthAreaManagementSystem.Utilities;

namespace MFCYouthAreaManagementSystem.Forms;

public sealed class ChapterMembersForm : Form
{
    private readonly long _chapterId;
    private readonly Dashboard _dashboard;
    private readonly DataGridView _grid = UiHelper.CreateGrid();
    private readonly ModernTextBox _search = new() { Placeholder = "Search Chapter members..." };
    private readonly EmptyStatePanel _empty = new("No Members in this Chapter", "Members assigned to this Chapter will appear here.");
    private readonly PageHeader _header;

    public ChapterMembersForm(long id, Dashboard dashboard)
    {
        _chapterId = id;
        _dashboard = dashboard;
        var chapter = new ChapterRepository().GetById(id) ?? throw new InvalidOperationException("Chapter not found.");
        Text = chapter.ChapterName;
        StartPosition = FormStartPosition.CenterParent;
        BackColor = ThemeColors.Background;
        Font = ThemeFonts.Body;
        ResponsiveLayoutHelper.ConfigureResponsiveDialog(this, new Size(880, 600), new Size(560, 480), allowMaximize: true);

        var root = new TableLayoutPanel { Dock = DockStyle.Fill, ColumnCount = 1, RowCount = 3, Margin = Padding.Empty, Padding = Padding.Empty };
        root.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 100));
        root.RowStyles.Add(new RowStyle(SizeType.Absolute, ThemeSizes.PageHeaderHeight));
        root.RowStyles.Add(new RowStyle(SizeType.Absolute, ThemeSizes.ToolbarSearchHeight + 8));
        root.RowStyles.Add(new RowStyle(SizeType.Percent, 100));
        Controls.Add(root);

        _header = new PageHeader(chapter.ChapterName, ChapterSummary(chapter));
        root.Controls.Add(_header, 0, 0);
        _search.Dock = DockStyle.Fill;
        _search.Margin = new Padding(0, 6, 0, 6);
        root.Controls.Add(_search, 0, 1);
        UiSearchDebouncer.Bind(this, _search, LoadRows);

        _grid.Columns.Add(new DataGridViewTextBoxColumn { Name = "Member", HeaderText = "Member", DataPropertyName = "FullName", AutoSizeMode = DataGridViewAutoSizeColumnMode.Fill });
        _grid.Columns.Add(new DataGridViewTextBoxColumn { Name = "Status", HeaderText = "Status", DataPropertyName = "Status", Width = 90 });
        _grid.Columns.Add(new DataGridViewTextBoxColumn { Name = "Contact", HeaderText = "Contact", DataPropertyName = "ContactNumber", Width = 130 });
        _grid.Columns.Add(new DataGridViewTextBoxColumn { Name = "Services", HeaderText = "Services", DataPropertyName = "Services", AutoSizeMode = DataGridViewAutoSizeColumnMode.Fill });
        ResponsiveLayoutHelper.WireResponsiveGridColumns(this, _grid,
            new ResponsiveGridColumnRule("Services", 760),
            new ResponsiveGridColumnRule("Contact", 680),
            new ResponsiveGridColumnRule("Status", 560));
        _grid.DoubleClick += (_, _) => Open();

        var content = new Panel { Dock = DockStyle.Fill, Margin = Padding.Empty };
        content.Controls.Add(_grid);
        content.Controls.Add(_empty);
        root.Controls.Add(content, 0, 2);
        Shown += (_, _) => LoadRows();
    }

    private void LoadRows()
    {
        try
        {
            var rows = new MemberRepository().GetByChapter(_chapterId, _search.TextValue);
            if (rows.Count == 0 && !string.IsNullOrWhiteSpace(_search.TextValue))
            {
                _empty.ShowMessage(
                    "No Members Match Your Search",
                    "Try a different name, contact number, status, or Service, or clear the Search box.");
            }
            else
            {
                _empty.ResetMessage();
            }

            _grid.DataSource = rows;
            _grid.Visible = rows.Count > 0;
            _empty.Visible = rows.Count == 0;
            if (_grid.Visible) _grid.BringToFront(); else _empty.BringToFront();

            var chapter = new ChapterRepository().GetById(_chapterId);
            if (chapter != null)
            {
                _header.TitleText = chapter.ChapterName;
                _header.DescriptionText = ChapterSummary(chapter);
                Text = chapter.ChapterName;
            }
        }
        catch (Exception ex)
        {
            AppLogger.Error("Load Chapter Members", ex);
            _grid.DataSource = null;
            _grid.Visible = false;
            _empty.ShowMessage("Chapter Members Could Not Load", "The Member list is temporarily unavailable. Try refreshing again.");
            _empty.Visible = true;
            _empty.BringToFront();
            _dashboard.Notify("Could not load Chapter members.", true);
        }
    }

    private static string ChapterSummary(Chapter chapter)
    {
        var memberLabel = chapter.MemberCount == 1 ? "1 Member" : $"{chapter.MemberCount} Members";
        var activeLabel = chapter.ActiveMemberCount == 1 ? "1 Active" : $"{chapter.ActiveMemberCount} Active";
        return $"{memberLabel} assigned · {activeLabel}";
    }

    private void Open()
    {
        if (_grid.CurrentRow?.DataBoundItem is not Member member) return;
        ModalHelper.Show(this, () => new MemberDetailsForm(member.MemberID), "Open Member Details from Chapter");
        LoadRows();
    }
}
