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
        Size = new Size(880, 600);
        MinimumSize = new Size(760, 520);
        BackColor = ThemeColors.Background;
        Font = ThemeFonts.Body;
        Padding = new Padding(24);
        AutoScaleMode = AutoScaleMode.Dpi;

        var root = new TableLayoutPanel { Dock = DockStyle.Fill, ColumnCount = 1, RowCount = 3, Margin = Padding.Empty, Padding = Padding.Empty };
        root.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 100));
        root.RowStyles.Add(new RowStyle(SizeType.Absolute, ThemeSizes.PageHeaderHeight));
        root.RowStyles.Add(new RowStyle(SizeType.Absolute, ThemeSizes.ToolbarSearchHeight + 8));
        root.RowStyles.Add(new RowStyle(SizeType.Percent, 100));
        Controls.Add(root);

        _header = new PageHeader(chapter.ChapterName, $"{chapter.MemberCount} Member(s) assigned to this Chapter.");
        root.Controls.Add(_header, 0, 0);
        _search.Dock = DockStyle.Fill;
        _search.Margin = new Padding(0, 6, 0, 6);
        root.Controls.Add(_search, 0, 1);
        _search.TextValueChanged += (_, _) => LoadRows();

        _grid.Columns.Add(new DataGridViewTextBoxColumn { HeaderText = "Member", DataPropertyName = "FullName", AutoSizeMode = DataGridViewAutoSizeColumnMode.Fill });
        _grid.Columns.Add(new DataGridViewTextBoxColumn { HeaderText = "Status", DataPropertyName = "Status", Width = 90 });
        _grid.Columns.Add(new DataGridViewTextBoxColumn { HeaderText = "Contact", DataPropertyName = "ContactNumber", Width = 130 });
        _grid.Columns.Add(new DataGridViewTextBoxColumn { HeaderText = "Services", DataPropertyName = "Services", AutoSizeMode = DataGridViewAutoSizeColumnMode.Fill });
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
            _grid.DataSource = rows;
            _grid.Visible = rows.Count > 0;
            _empty.Visible = rows.Count == 0;
            if (_grid.Visible) _grid.BringToFront(); else _empty.BringToFront();

            var chapter = new ChapterRepository().GetById(_chapterId);
            if (chapter != null)
            {
                _header.TitleText = chapter.ChapterName;
                _header.DescriptionText = $"{chapter.MemberCount} Member(s) assigned to this Chapter.";
                Text = chapter.ChapterName;
            }
        }
        catch (Exception ex)
        {
            AppLogger.Error("Load Chapter Members", ex);
            _dashboard.Notify("Could not load Chapter members.", true);
        }
    }

    private void Open()
    {
        if (_grid.CurrentRow?.DataBoundItem is not Member member) return;
        ModalHelper.Show(this, () => new MemberDetailsForm(member.MemberID, _dashboard), "Open Member Details from Chapter");
        LoadRows();
    }
}
