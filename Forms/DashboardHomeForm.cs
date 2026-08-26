using MFCYouthAreaManagementSystem.Repositories;
using MFCYouthAreaManagementSystem.UI.Controls;
using MFCYouthAreaManagementSystem.UI.Theme;
using MFCYouthAreaManagementSystem.Utilities;

namespace MFCYouthAreaManagementSystem.Forms;

public sealed class DashboardHomeForm : Form
{
    private readonly StatCard _members = new() { Title = "Total Members" };
    private readonly StatCard _chapters = new() { Title = "Total Chapters" };
    private readonly StatCard _services = new() { Title = "Total Services" };
    private readonly StatCard _reports = new() { Title = "Activity Reports" };

    public DashboardHomeForm()
    {
        BackColor = ThemeColors.Background;
        Font = ThemeFonts.Body;
        AutoScaleMode = AutoScaleMode.Dpi;
        Padding = Padding.Empty;

        var root = new TableLayoutPanel { Dock = DockStyle.Fill, ColumnCount = 1, RowCount = 4, Margin = Padding.Empty, Padding = Padding.Empty };
        root.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 100));
        root.RowStyles.Add(new RowStyle(SizeType.Absolute, ThemeSizes.PageHeaderHeight));
        root.RowStyles.Add(new RowStyle(SizeType.Absolute, 178));
        root.RowStyles.Add(new RowStyle(SizeType.Absolute, 112));
        root.RowStyles.Add(new RowStyle(SizeType.Percent, 100));
        Controls.Add(root);

        root.Controls.Add(new PageHeader("Dashboard", "A quick overview of your MFC Youth Area records."), 0, 0);

        var cards = new TableLayoutPanel { Dock = DockStyle.Fill, ColumnCount = 4, RowCount = 1, Padding = new Padding(0, 18, 0, 0), Margin = Padding.Empty };
        for (var i = 0; i < 4; i++) cards.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 25));
        cards.RowStyles.Add(new RowStyle(SizeType.Percent, 100));
        var statCards = new[] { _members, _chapters, _services, _reports };
        for (var i = 0; i < statCards.Length; i++)
        {
            statCards[i].Dock = DockStyle.Fill;
            statCards[i].Margin = new Padding(i == 0 ? 0 : 8, 0, i == statCards.Length - 1 ? 0 : 8, 16);
            cards.Controls.Add(statCards[i], i, 0);
        }
        root.Controls.Add(cards, 0, 1);

        var note = new Label
        {
            Dock = DockStyle.Fill,
            Text = "Local-first management\nAll records are stored on this computer and remain available without internet access.",
            Font = ThemeFonts.SectionTitle,
            ForeColor = ThemeColors.Primary,
            Padding = new Padding(16),
            BackColor = ThemeColors.Surface,
            TextAlign = ContentAlignment.MiddleLeft
        };
        root.Controls.Add(note, 0, 2);

        Shown += (_, _) => RefreshStats();
    }

    public void RefreshStats()
    {
        try
        {
            _members.Value = new MemberRepository().GetTotalCount().ToString();
            _chapters.Value = new ChapterRepository().GetTotalCount().ToString();
            _services.Value = new ServiceRepository().GetTotalCount().ToString();
            _reports.Value = new ActivityReportRepository().GetTotalCount().ToString();
        }
        catch (Exception ex)
        {
            AppLogger.Error("Refresh Dashboard", ex);
            _members.Value = _chapters.Value = _services.Value = _reports.Value = "—";
        }
    }
}
