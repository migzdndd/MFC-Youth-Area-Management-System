using MFCYouthAreaManagementSystem.Models;
using MFCYouthAreaManagementSystem.Repositories;
using MFCYouthAreaManagementSystem.UI.Controls;
using MFCYouthAreaManagementSystem.UI.Theme;
using MFCYouthAreaManagementSystem.Utilities;

namespace MFCYouthAreaManagementSystem.Forms;

public sealed class AssignServicesForm : Form
{
    private readonly long _memberId;
    private readonly ServiceRepository _repo = new();
    private readonly CheckedListBox _list = new()
    {
        Dock = DockStyle.Fill,
        CheckOnClick = true,
        BorderStyle = BorderStyle.None,
        Font = ThemeFonts.Body,
        BackColor = ThemeColors.Surface,
        ForeColor = ThemeColors.TextPrimary,
        IntegralHeight = false
    };

    public AssignServicesForm(long memberId)
    {
        _memberId = memberId;
        var member = new MemberRepository().GetById(memberId) ?? throw new InvalidOperationException("Member not found.");
        Text = "Assign Services";
        StartPosition = FormStartPosition.CenterParent;
        Size = new Size(540, 540);
        BackColor = ThemeColors.Background;
        Font = ThemeFonts.Body;
        Padding = new Padding(24);
        FormBorderStyle = FormBorderStyle.FixedDialog;
        MaximizeBox = false;
        MinimizeBox = false;
        AutoScaleMode = AutoScaleMode.Dpi;

        var root = new TableLayoutPanel { Dock = DockStyle.Fill, ColumnCount = 1, RowCount = 3, Margin = Padding.Empty, Padding = Padding.Empty };
        root.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 100));
        root.RowStyles.Add(new RowStyle(SizeType.Absolute, 112));
        root.RowStyles.Add(new RowStyle(SizeType.Percent, 100));
        root.RowStyles.Add(new RowStyle(SizeType.Absolute, ThemeSizes.DialogActionsHeight));
        Controls.Add(root);

        var header = new TableLayoutPanel { Dock = DockStyle.Fill, ColumnCount = 1, RowCount = 2, Margin = Padding.Empty, Padding = Padding.Empty };
        header.RowStyles.Add(new RowStyle(SizeType.Absolute, 48));
        header.RowStyles.Add(new RowStyle(SizeType.Percent, 100));
        header.Controls.Add(new Label
        {
            Text = member.FullName,
            Dock = DockStyle.Fill,
            Font = ThemeFonts.SectionTitle,
            ForeColor = ThemeColors.Primary,
            TextAlign = ContentAlignment.MiddleLeft,
            AutoEllipsis = true,
            Margin = Padding.Empty
        }, 0, 0);
        header.Controls.Add(new Label
        {
            Text = "Select the Services currently assigned to this Member. Zero selections are allowed.",
            Dock = DockStyle.Fill,
            Font = ThemeFonts.Body,
            ForeColor = ThemeColors.TextSecondary,
            TextAlign = ContentAlignment.TopLeft,
            AutoEllipsis = true,
            Margin = Padding.Empty,
            Padding = new Padding(0, 4, 0, 0)
        }, 0, 1);
        root.Controls.Add(header, 0, 0);

        var listHost = new Panel { Dock = DockStyle.Fill, BackColor = ThemeColors.Surface, Padding = new Padding(14), Margin = new Padding(0, 0, 0, 8) };
        listHost.Controls.Add(_list);
        root.Controls.Add(listHost, 0, 1);

        var actions = new FlowLayoutPanel { Dock = DockStyle.Fill, FlowDirection = FlowDirection.RightToLeft, WrapContents = false, Padding = new Padding(0, 10, 0, 0), Margin = Padding.Empty };
        var save = new ModernButton { Text = "Save Changes", Width = 125 };
        var cancel = new ModernButton { Text = "Cancel", Width = 90, ButtonStyle = ModernButtonStyle.Secondary };
        save.Click += (_, _) => Save(save);
        cancel.Click += (_, _) => Close();
        actions.Controls.AddRange(new Control[] { save, cancel });
        root.Controls.Add(actions, 0, 2);
        AcceptButton = save;

        LoadServices();
    }

    private void LoadServices()
    {
        _list.DisplayMember = nameof(Service.ServiceName);
        var selected = _repo.GetServicesForMember(_memberId);
        foreach (var service in _repo.GetAll())
        {
            var index = _list.Items.Add(service);
            _list.SetItemChecked(index, selected.Contains(service.ServiceID));
        }
    }

    private void Save(Control button)
    {
        button.Enabled = false;
        try
        {
            var ids = new List<long>();
            foreach (var item in _list.CheckedItems)
                if (item is Service service) ids.Add(service.ServiceID);
            _repo.UpdateMemberServices(_memberId, ids);
            DialogResult = DialogResult.OK;
            Close();
        }
        catch (Exception ex)
        {
            AppLogger.Error("Update Member Services", ex);
            CustomDialog.Show(this, "Services Not Saved", ex.Message, true);
            button.Enabled = true;
        }
    }
}
