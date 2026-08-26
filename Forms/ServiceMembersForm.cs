using MFCYouthAreaManagementSystem.Models;
using MFCYouthAreaManagementSystem.Repositories;
using MFCYouthAreaManagementSystem.UI.Controls;
using MFCYouthAreaManagementSystem.UI.Theme;
using MFCYouthAreaManagementSystem.Utilities;

namespace MFCYouthAreaManagementSystem.Forms;

public sealed class ServiceMembersForm : Form
{
    private readonly long _serviceId;
    private readonly Dashboard _dashboard;
    private readonly DataGridView _grid = UiHelper.CreateGrid();
    private readonly ModernTextBox _search = new() { Placeholder = "Search assigned Members..." };
    private readonly EmptyStatePanel _empty = new("No Members Assigned", "Members assigned to this Service will appear here.");
    private readonly PageHeader _header;

    public ServiceMembersForm(long serviceId, Dashboard dashboard)
    {
        _serviceId = serviceId;
        _dashboard = dashboard;
        var service = new ServiceRepository().GetById(serviceId)
                      ?? throw new InvalidOperationException("Service not found.");
        Text = service.ServiceName;
        StartPosition = FormStartPosition.CenterParent;
        Size = new Size(900, 600);
        MinimumSize = new Size(780, 520);
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

        _header = new PageHeader(service.ServiceName, $"{service.MemberCount} Member(s) currently assigned.");
        root.Controls.Add(_header, 0, 0);
        _search.Dock = DockStyle.Fill;
        _search.Margin = new Padding(0, 6, 0, 6);
        root.Controls.Add(_search, 0, 1);
        _search.TextValueChanged += (_, _) => LoadRows();

        _grid.Columns.Add(new DataGridViewTextBoxColumn { HeaderText = "Member", DataPropertyName = "FullName", AutoSizeMode = DataGridViewAutoSizeColumnMode.Fill });
        _grid.Columns.Add(new DataGridViewTextBoxColumn { HeaderText = "Chapter", DataPropertyName = "ChapterName", Width = 160 });
        _grid.Columns.Add(new DataGridViewTextBoxColumn { HeaderText = "Status", DataPropertyName = "Status", Width = 90 });
        _grid.Columns.Add(new DataGridViewTextBoxColumn { HeaderText = "Contact", DataPropertyName = "ContactNumber", Width = 130 });
        _grid.Columns.Add(new DataGridViewTextBoxColumn { HeaderText = "Email", DataPropertyName = "EmailAddress", Width = 180 });
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
            var rows = new MemberRepository().GetByService(_serviceId, _search.TextValue);
            _grid.DataSource = rows;
            _grid.Visible = rows.Count > 0;
            _empty.Visible = rows.Count == 0;
            if (_grid.Visible) _grid.BringToFront(); else _empty.BringToFront();

            var service = new ServiceRepository().GetById(_serviceId);
            if (service != null)
            {
                _header.TitleText = service.ServiceName;
                _header.DescriptionText = $"{service.MemberCount} Member(s) currently assigned.";
                Text = service.ServiceName;
            }
        }
        catch (Exception ex)
        {
            AppLogger.Error("Load Service Members", ex);
            _dashboard.Notify("Could not load Service members.", true);
        }
    }

    private void Open()
    {
        if (_grid.CurrentRow?.DataBoundItem is not Member member) return;
        ModalHelper.Show(this, () => new MemberDetailsForm(member.MemberID, _dashboard), "Open Member Details from Service");
        LoadRows();
    }
}
