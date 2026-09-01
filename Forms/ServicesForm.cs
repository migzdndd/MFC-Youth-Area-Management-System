using MFCYouthAreaManagementSystem.Repositories;
using MFCYouthAreaManagementSystem.UI.Controls;
using MFCYouthAreaManagementSystem.UI.Theme;
using MFCYouthAreaManagementSystem.Utilities;

namespace MFCYouthAreaManagementSystem.Forms;

public sealed class ServicesForm : Form
{
    private readonly Dashboard _dashboard;
    private readonly ServiceRepository _repo = new();
    private readonly FlowLayoutPanel _cards = new() { Dock = DockStyle.Fill, AutoScroll = true, WrapContents = true, Padding = new Padding(0, 8, 0, 0), Margin = Padding.Empty };
    private readonly ModernTextBox _search = new() { Placeholder = "Search Services..." };

    public ServicesForm(Dashboard dashboard)
    {
        _dashboard = dashboard;
        BackColor = ThemeColors.Background;
        Font = ThemeFonts.Body;
        AutoScaleMode = AutoScaleMode.Dpi;

        var root = new TableLayoutPanel { Dock = DockStyle.Fill, ColumnCount = 1, RowCount = 3, Margin = Padding.Empty, Padding = Padding.Empty };
        root.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 100));
        root.RowStyles.Add(new RowStyle(SizeType.Absolute, ThemeSizes.PageHeaderHeight));
        root.RowStyles.Add(new RowStyle(SizeType.Absolute, ThemeSizes.ToolbarSearchHeight + 8));
        root.RowStyles.Add(new RowStyle(SizeType.Percent, 100));
        Controls.Add(root);

        root.Controls.Add(new PageHeader("Services", "Review the seven MFC Youth service assignments and the Members serving in each."), 0, 0);
        _search.Dock = DockStyle.Fill;
        _search.Margin = new Padding(0, 6, 0, 6);
        root.Controls.Add(_search, 0, 1);
        root.Controls.Add(_cards, 0, 2);

        _search.TextValueChanged += (_, _) => LoadCards();
        Shown += (_, _) => LoadCards();
    }

    private void LoadCards()
    {
        try
        {
            var services = _repo.GetAll(_search.TextValue);
            _cards.SuspendLayout();
            _cards.Controls.Clear();
            foreach (var service in services)
            {
                var serviceId = service.ServiceID;
                var card = new ServiceCard(service);
                UiHelper.ScaleNewControlForCurrentDpi(card, _cards);
                card.ViewClicked += (_, _) =>
                {
                    ModalHelper.Show(this, () => new ServiceMembersForm(serviceId, _dashboard), "Open Service Members");
                    LoadCards();
                };
                _cards.Controls.Add(card);
            }
            if (services.Count == 0)
            {
                _cards.Controls.Add(new Label
                {
                    Text = "No Services match your search.",
                    AutoSize = true,
                    Font = ThemeFonts.Body,
                    ForeColor = ThemeColors.TextSecondary,
                    Margin = new Padding(8, 16, 0, 0)
                });
            }
        }
        catch (Exception ex)
        {
            AppLogger.Error("Load Services", ex);
            _dashboard.Notify("Could not load Services.", true);
        }
        finally
        {
            _cards.ResumeLayout();
        }
    }
}
