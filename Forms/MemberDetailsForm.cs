using MFCYouthAreaManagementSystem.Models;
using MFCYouthAreaManagementSystem.Repositories;
using MFCYouthAreaManagementSystem.UI.Controls;
using MFCYouthAreaManagementSystem.UI.Theme;
using MFCYouthAreaManagementSystem.Utilities;

namespace MFCYouthAreaManagementSystem.Forms;

/// <summary>
/// Read-only Member profile view. Editing, Service assignment, GIG management, and
/// deletion intentionally remain separate workflows on the Members page.
/// </summary>
public sealed class MemberDetailsForm : Form
{
    private readonly long _memberId;
    private readonly Panel _content = new() { Dock = DockStyle.Fill };

    public MemberDetailsForm(long memberId)
    {
        _memberId = memberId;
        Text = "Member Details";
        StartPosition = FormStartPosition.CenterParent;
        BackColor = ThemeColors.Background;
        Font = ThemeFonts.Body;
        ResponsiveLayoutHelper.ConfigureResponsiveDialog(this, new Size(780, 760), new Size(500, 520));
        Controls.Add(_content);
        LoadMember();
    }

    private void LoadMember()
    {
        _content.SuspendLayout();
        UiHelper.DisposeChildControls(_content);

        try
        {
            var member = new MemberRepository().GetById(_memberId);
            if (member == null)
            {
                CustomDialog.Show(this, "Member Not Found", "This Member no longer exists or could not be loaded.", true);
                DialogResult = DialogResult.Abort;
                Close();
                return;
            }

            var contributions = LoadContributionsSafely();
            var totalContribution = LoadGigTotalSafely(contributions);

            var root = new TableLayoutPanel
            {
                Dock = DockStyle.Fill,
                ColumnCount = 1,
                RowCount = 3,
                Margin = Padding.Empty,
                Padding = Padding.Empty
            };
            root.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 100));
            root.RowStyles.Add(new RowStyle(SizeType.Absolute, 104));
            root.RowStyles.Add(new RowStyle(SizeType.Percent, 100));
            root.RowStyles.Add(new RowStyle(SizeType.Absolute, 62));
            _content.Controls.Add(root);

            root.Controls.Add(BuildIdentity(member), 0, 0);
            root.Controls.Add(BuildScrollableBody(member, contributions, totalContribution), 0, 1);
            root.Controls.Add(BuildActions(), 0, 2);

            UiHelper.ScaleNewControlForCurrentDpi(root, _content);
        }
        catch (Exception ex)
        {
            AppLogger.Error("Load Member Details", ex);
            UiHelper.DisposeChildControls(_content);
            _content.Controls.Add(new Label
            {
                Text = "Member details could not be loaded. Close this window and try again.",
                Dock = DockStyle.Fill,
                Font = ThemeFonts.Body,
                ForeColor = ThemeColors.Danger,
                TextAlign = ContentAlignment.MiddleCenter,
                Padding = new Padding(24)
            });
        }
        finally
        {
            _content.ResumeLayout(true);
        }
    }

    private Control BuildIdentity(Member member)
    {
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

        var firstInitial = string.IsNullOrWhiteSpace(member.FirstName) ? '?' : char.ToUpperInvariant(member.FirstName[0]);
        var lastInitial = string.IsNullOrWhiteSpace(member.LastName) ? '?' : char.ToUpperInvariant(member.LastName[0]);

        var avatarHost = new Panel { Dock = DockStyle.Fill, Margin = Padding.Empty };
        var avatar = new MemberAvatar
        {
            Initials = $"{firstInitial}{lastInitial}",
            Anchor = AnchorStyles.Left | AnchorStyles.Top,
            Location = new Point(0, 6)
        };
        avatarHost.Controls.Add(avatar);
        identity.Controls.Add(avatarHost, 0, 0);
        identity.SetRowSpan(avatarHost, 2);

        identity.Controls.Add(new Label
        {
            Text = Fallback(member.FullName, "Unnamed Member"),
            Dock = DockStyle.Fill,
            Font = ThemeFonts.PageTitle,
            ForeColor = ThemeColors.TextPrimary,
            TextAlign = ContentAlignment.BottomLeft,
            AutoEllipsis = true,
            Margin = new Padding(4, 0, 0, 0)
        }, 1, 0);

        identity.Controls.Add(new Label
        {
            Text = $"{Fallback(member.Status, "Status Not Provided")}  •  {ChapterText(member)}",
            Dock = DockStyle.Fill,
            Font = ThemeFonts.Body,
            ForeColor = ThemeColors.TextSecondary,
            TextAlign = ContentAlignment.TopLeft,
            AutoEllipsis = true,
            Margin = new Padding(5, 2, 0, 0)
        }, 1, 1);

        return identity;
    }

    private Control BuildScrollableBody(Member member, List<GIGContribution> contributions, decimal totalContribution)
    {
        var scrollHost = new Panel
        {
            Dock = DockStyle.Fill,
            AutoScroll = true,
            Margin = Padding.Empty,
            Padding = Padding.Empty,
            BackColor = ThemeColors.Background
        };

        var body = new TableLayoutPanel
        {
            Dock = DockStyle.Top,
            AutoSize = true,
            AutoSizeMode = AutoSizeMode.GrowAndShrink,
            ColumnCount = 1,
            RowCount = 3,
            Margin = Padding.Empty,
            Padding = Padding.Empty,
            BackColor = ThemeColors.Background
        };
        body.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 100));
        body.RowStyles.Add(new RowStyle(SizeType.AutoSize));
        body.RowStyles.Add(new RowStyle(SizeType.Absolute, 42));
        body.RowStyles.Add(new RowStyle(SizeType.Absolute, 276));

        body.Controls.Add(BuildInformationGrid(member, totalContribution), 0, 0);
        body.Controls.Add(new Label
        {
            Text = "GIG Contribution History",
            Dock = DockStyle.Fill,
            Font = ThemeFonts.BodyBold,
            ForeColor = ThemeColors.TextPrimary,
            TextAlign = ContentAlignment.BottomLeft,
            Margin = Padding.Empty,
            Padding = new Padding(0, 10, 0, 6)
        }, 0, 1);
        body.Controls.Add(BuildGigHistory(contributions), 0, 2);

        scrollHost.Controls.Add(body);
        scrollHost.Resize += (_, _) => body.MaximumSize = new Size(Math.Max(0, scrollHost.ClientSize.Width - 2), 0);
        return scrollHost;
    }

    private Control BuildInformationGrid(Member member, decimal totalContribution)
    {
        var info = new TableLayoutPanel
        {
            Dock = DockStyle.Top,
            AutoSize = true,
            AutoSizeMode = AutoSizeMode.GrowAndShrink,
            ColumnCount = 2,
            RowCount = 9,
            Margin = Padding.Empty,
            Padding = new Padding(0, 8, 0, 4),
            BackColor = ThemeColors.Background
        };
        info.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 50));
        info.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 50));
        info.RowStyles.Add(new RowStyle(SizeType.Absolute, 74));
        info.RowStyles.Add(new RowStyle(SizeType.Absolute, 74));
        info.RowStyles.Add(new RowStyle(SizeType.Absolute, 74));
        info.RowStyles.Add(new RowStyle(SizeType.Absolute, 74));
        info.RowStyles.Add(new RowStyle(SizeType.Absolute, 86));
        info.RowStyles.Add(new RowStyle(SizeType.Absolute, 104));
        info.RowStyles.Add(new RowStyle(SizeType.Absolute, 74));
        info.RowStyles.Add(new RowStyle(SizeType.Absolute, 92));
        info.RowStyles.Add(new RowStyle(SizeType.Absolute, 78));

        AddInfo(info, "Full Name", Fallback(member.FullName, "Unnamed Member"), 0, 0, 2);
        AddInfo(info, "First Name", Fallback(member.FirstName, "Not Provided"), 0, 1);
        AddInfo(info, "Middle Name", Fallback(member.MiddleName, "No Middle Name Provided"), 1, 1);
        AddInfo(info, "Last Name", Fallback(member.LastName, "Not Provided"), 0, 2);
        AddInfo(info, "Current Age", FormattingHelper.Age(member.BirthDate).ToString(), 1, 2);
        AddInfo(info, "Birth Date", FormattingHelper.Date(member.BirthDate), 0, 3);
        AddInfo(info, "Status", Fallback(member.Status, "Status Not Provided"), 1, 3);
        AddInfo(info, "Contact Number", Fallback(member.ContactNumber, "No Contact Number Provided"), 0, 4);
        AddInfo(info, "Email Address", Fallback(member.EmailAddress, "No Email Provided"), 1, 4);
        AddInfo(info, "Address", Fallback(member.Address, "No Address Provided"), 0, 5, 2, wrap: true);
        AddInfo(info, "Assigned Chapter", ChapterText(member), 0, 6, 2);
        AddInfo(info, "Assigned Services", ServicesText(member), 0, 7, 2, wrap: true);
        AddInfo(info, "Total GIG Contributions", FormattingHelper.Peso(totalContribution), 0, 8, 2);

        return info;
    }

    private Control BuildGigHistory(List<GIGContribution> contributions)
    {
        var host = new Panel
        {
            Dock = DockStyle.Fill,
            Margin = Padding.Empty,
            Padding = Padding.Empty,
            BackColor = ThemeColors.Surface
        };

        if (contributions.Count == 0)
        {
            host.Controls.Add(new Label
            {
                Text = "No GIG contributions recorded",
                Dock = DockStyle.Fill,
                Font = ThemeFonts.Body,
                ForeColor = ThemeColors.TextSecondary,
                TextAlign = ContentAlignment.MiddleCenter,
                Padding = new Padding(16)
            });
            return host;
        }

        var grid = UiHelper.CreateGrid();
        grid.TabStop = false;
        grid.Columns.Add(new DataGridViewTextBoxColumn
        {
            Name = "Date",
            HeaderText = "Date",
            DataPropertyName = "Date",
            Width = 150
        });
        grid.Columns.Add(new DataGridViewTextBoxColumn
        {
            Name = "Amount",
            HeaderText = "Amount",
            DataPropertyName = "Amount",
            Width = 130
        });
        grid.Columns.Add(new DataGridViewTextBoxColumn
        {
            Name = "Note",
            HeaderText = "Note",
            DataPropertyName = "Note",
            AutoSizeMode = DataGridViewAutoSizeColumnMode.Fill,
            FillWeight = 180
        });
        grid.DataSource = contributions.Select(item => new
        {
            Date = FormattingHelper.Date(item.ContributionDate),
            Amount = FormattingHelper.Peso(item.Amount),
            Note = Fallback(item.Remarks, "No Note")
        }).ToList();
        host.Controls.Add(grid);
        return host;
    }

    private Control BuildActions()
    {
        var actions = new FlowLayoutPanel
        {
            Dock = DockStyle.Fill,
            FlowDirection = FlowDirection.RightToLeft,
            WrapContents = false,
            Padding = new Padding(0, 10, 0, 6),
            Margin = Padding.Empty,
            BackColor = ThemeColors.Background
        };
        var close = Btn("Close", 88, ModernButtonStyle.Primary);
        close.Click += (_, _) => Close();
        actions.Controls.Add(close);
        return actions;
    }

    private List<GIGContribution> LoadContributionsSafely()
    {
        try
        {
            return new GIGContributionRepository().GetByMember(_memberId);
        }
        catch (Exception ex)
        {
            // The profile itself should remain viewable even if a legacy/bad GIG row
            // cannot be parsed. The repository error is still recorded for diagnosis.
            AppLogger.Error("Load GIG history in Member Details", ex);
            return new List<GIGContribution>();
        }
    }

    private decimal LoadGigTotalSafely(List<GIGContribution> loadedContributions)
    {
        try
        {
            return new GIGContributionRepository().GetTotalForMember(_memberId);
        }
        catch (Exception ex)
        {
            AppLogger.Error("Load GIG total in Member Details", ex);
            return loadedContributions.Sum(item => item.Amount);
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
            Margin = Padding.Empty,
            BackColor = ThemeColors.Background
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

    private static string Fallback(string? value, string fallback) =>
        string.IsNullOrWhiteSpace(value) ? fallback : value.Trim();

    private static string ChapterText(Member member) =>
        string.IsNullOrWhiteSpace(member.ChapterName) ? "No Chapter Assigned" : member.ChapterName.Trim();

    private static string ServicesText(Member member)
    {
        if (string.IsNullOrWhiteSpace(member.Services) ||
            string.Equals(member.Services.Trim(), "No Service Assigned", StringComparison.OrdinalIgnoreCase))
            return "No Services Assigned";
        return member.Services.Trim();
    }
}
