using MFCYouthAreaManagementSystem.Repositories;
using MFCYouthAreaManagementSystem.UI.Controls;
using MFCYouthAreaManagementSystem.UI.Theme;
using MFCYouthAreaManagementSystem.Utilities;

namespace MFCYouthAreaManagementSystem.Forms;

public sealed class MemberDetailsForm : Form
{
    private readonly long _memberId;
    private readonly Dashboard _dashboard;
    private readonly Panel _content = new() { Dock = DockStyle.Fill };

    public MemberDetailsForm(long memberId, Dashboard dashboard)
    {
        _memberId = memberId;
        _dashboard = dashboard;
        Text = "Member Details";
        StartPosition = FormStartPosition.CenterParent;
        Size = new Size(720, 690);
        MinimumSize = new Size(680, 630);
        BackColor = ThemeColors.Background;
        Font = ThemeFonts.Body;
        Padding = new Padding(24);
        FormBorderStyle = FormBorderStyle.FixedDialog;
        MaximizeBox = false;
        MinimizeBox = false;
        AutoScaleMode = AutoScaleMode.Dpi;
        Controls.Add(_content);
        LoadMember();
    }

    private void LoadMember()
    {
        _content.SuspendLayout();
        _content.Controls.Clear();

        try
        {
            var member = new MemberRepository().GetById(_memberId);
            if (member == null)
            {
                DialogResult = DialogResult.Abort;
                Close();
                return;
            }

            var root = new TableLayoutPanel
            {
                Dock = DockStyle.Fill,
                ColumnCount = 1,
                RowCount = 3,
                Margin = Padding.Empty,
                Padding = Padding.Empty
            };
            root.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 100));
            root.RowStyles.Add(new RowStyle(SizeType.Absolute, 108));
            root.RowStyles.Add(new RowStyle(SizeType.Percent, 100));
            root.RowStyles.Add(new RowStyle(SizeType.Absolute, 70));
            _content.Controls.Add(root);

            var firstInitial = string.IsNullOrWhiteSpace(member.FirstName) ? '?' : char.ToUpperInvariant(member.FirstName[0]);
            var lastInitial = string.IsNullOrWhiteSpace(member.LastName) ? '?' : char.ToUpperInvariant(member.LastName[0]);

            var identity = new TableLayoutPanel
            {
                Dock = DockStyle.Fill,
                ColumnCount = 2,
                RowCount = 2,
                Margin = Padding.Empty,
                Padding = new Padding(0, 8, 0, 8)
            };
            identity.ColumnStyles.Add(new ColumnStyle(SizeType.Absolute, 88));
            identity.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 100));
            identity.RowStyles.Add(new RowStyle(SizeType.Percent, 58));
            identity.RowStyles.Add(new RowStyle(SizeType.Percent, 42));

            var avatarHost = new Panel { Dock = DockStyle.Fill, Margin = Padding.Empty };
            var avatar = new MemberAvatar
            {
                Initials = $"{firstInitial}{lastInitial}",
                Anchor = AnchorStyles.Left | AnchorStyles.Top
            };
            avatar.Location = new Point(0, 6);
            avatarHost.Controls.Add(avatar);
            identity.Controls.Add(avatarHost, 0, 0);
            identity.SetRowSpan(avatarHost, 2);

            identity.Controls.Add(new Label
            {
                Text = member.FullName,
                Dock = DockStyle.Fill,
                Font = ThemeFonts.PageTitle,
                ForeColor = ThemeColors.TextPrimary,
                TextAlign = ContentAlignment.BottomLeft,
                AutoEllipsis = true,
                Margin = new Padding(4, 0, 0, 0)
            }, 1, 0);
            identity.Controls.Add(new Label
            {
                Text = $"{member.Status}  •  {member.ChapterName}",
                Dock = DockStyle.Fill,
                Font = ThemeFonts.Body,
                ForeColor = ThemeColors.TextSecondary,
                TextAlign = ContentAlignment.TopLeft,
                AutoEllipsis = true,
                Margin = new Padding(5, 2, 0, 0)
            }, 1, 1);
            root.Controls.Add(identity, 0, 0);

            var info = new TableLayoutPanel
            {
                Dock = DockStyle.Fill,
                ColumnCount = 2,
                RowCount = 5,
                AutoScroll = true,
                Margin = Padding.Empty,
                Padding = new Padding(0, 8, 0, 8)
            };
            info.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 50));
            info.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 50));
            info.RowStyles.Add(new RowStyle(SizeType.Absolute, 78));
            info.RowStyles.Add(new RowStyle(SizeType.Absolute, 78));
            info.RowStyles.Add(new RowStyle(SizeType.Absolute, 96));
            info.RowStyles.Add(new RowStyle(SizeType.Absolute, 132));
            info.RowStyles.Add(new RowStyle(SizeType.Absolute, 82));

            AddInfo(info, "Birth Date", FormattingHelper.Date(member.BirthDate), 0, 0);
            AddInfo(info, "Age", FormattingHelper.Age(member.BirthDate).ToString(), 1, 0);
            AddInfo(info, "Contact Number", member.ContactNumber, 0, 1);
            AddInfo(info, "Email Address", string.IsNullOrWhiteSpace(member.EmailAddress) ? "Not provided" : member.EmailAddress!, 1, 1);
            AddInfo(info, "Services", member.Services, 0, 2, 2);
            AddInfo(info, "Address", member.Address, 0, 3, 2, wrap: true);
            var total = new GIGContributionRepository().GetTotalForMember(_memberId);
            AddInfo(info, "GIG Total", FormattingHelper.Peso(total), 0, 4, 2);
            root.Controls.Add(info, 0, 1);

            var actions = new FlowLayoutPanel
            {
                Dock = DockStyle.Fill,
                FlowDirection = FlowDirection.RightToLeft,
                WrapContents = false,
                Padding = new Padding(0, 12, 0, 8),
                Margin = Padding.Empty
            };
            var close = Btn("Close", 82, ModernButtonStyle.Secondary);
            var edit = Btn("Edit Member", 110, ModernButtonStyle.Primary);
            var services = Btn("Assign Services", 120, ModernButtonStyle.Secondary);
            var gig = Btn("GIG Tracker", 105, ModernButtonStyle.Secondary);
            var delete = Btn("Delete", 86, ModernButtonStyle.Danger);
            close.Click += (_, _) => Close();
            edit.Click += (_, _) => EditMember();
            services.Click += (_, _) => AssignServices();
            gig.Click += (_, _) => OpenGig();
            delete.Click += (_, _) => DeleteMember(member.FullName);
            actions.Controls.AddRange(new Control[] { close, delete, edit, services, gig });
            root.Controls.Add(actions, 0, 2);

            UiHelper.ScaleNewControlForCurrentDpi(root, _content);
        }
        finally
        {
            _content.ResumeLayout(true);
        }
    }

    private static ModernButton Btn(string text, int width, ModernButtonStyle style) => new()
    {
        Text = text,
        Width = width,
        ButtonStyle = style,
        Margin = new Padding(6, 0, 0, 0)
    };

    private static void AddInfo(TableLayoutPanel table, string label, string value, int column, int row, int span = 1, bool wrap = false)
    {
        var panel = new TableLayoutPanel
        {
            Dock = DockStyle.Fill,
            ColumnCount = 1,
            RowCount = 2,
            Padding = new Padding(0, 7, 16, 7),
            Margin = Padding.Empty
        };
        panel.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 100));
        panel.RowStyles.Add(new RowStyle(SizeType.Absolute, ThemeSizes.FieldLabelHeight));
        panel.RowStyles.Add(new RowStyle(SizeType.Percent, 100));

        panel.Controls.Add(new Label
        {
            Text = label,
            Dock = DockStyle.Fill,
            Font = ThemeFonts.BodyBold,
            ForeColor = ThemeColors.TextSecondary,
            TextAlign = ContentAlignment.MiddleLeft,
            AutoEllipsis = true,
            Margin = Padding.Empty
        }, 0, 0);

        panel.Controls.Add(new Label
        {
            Text = value,
            Dock = DockStyle.Fill,
            Font = ThemeFonts.Body,
            ForeColor = ThemeColors.TextPrimary,
            TextAlign = ContentAlignment.TopLeft,
            AutoEllipsis = !wrap,
            Margin = Padding.Empty,
            Padding = new Padding(0, 3, 0, 0)
        }, 0, 1);

        table.Controls.Add(panel, column, row);
        if (span > 1) table.SetColumnSpan(panel, span);
    }

    private void EditMember()
    {
        if (ModalHelper.Show(this, () => new MemberEditorForm(_memberId), "Open Edit Member from Details") != DialogResult.OK) return;
        _dashboard.Notify("Member updated successfully.");
        LoadMember();
    }

    private void AssignServices()
    {
        if (ModalHelper.Show(this, () => new AssignServicesForm(_memberId), "Open Assign Services from Details") != DialogResult.OK) return;
        _dashboard.Notify("Services updated.");
        LoadMember();
    }

    private void OpenGig()
    {
        ModalHelper.Show(this, () => new GIGTrackerForm(_memberId, _dashboard), "Open GIG Tracker from Details");
        LoadMember();
    }

    private void DeleteMember(string fullName)
    {
        if (!CustomDialog.Confirm(this, "Delete Member?", $"{fullName} will be permanently removed. Related Service assignments and GIG contributions will also be removed.\n\nThis action cannot be undone.", "Delete Member", true)) return;
        try
        {
            new MemberRepository().Delete(_memberId);
            _dashboard.Notify("Member deleted.");
            DialogResult = DialogResult.OK;
            Close();
        }
        catch (Exception ex)
        {
            AppLogger.Error("Delete Member from details", ex);
            CustomDialog.Show(this, "Delete Failed", ex.Message, true);
        }
    }
}
