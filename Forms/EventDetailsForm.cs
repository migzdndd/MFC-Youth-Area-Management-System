using MFCYouthAreaManagementSystem.Models;
using MFCYouthAreaManagementSystem.Repositories;
using MFCYouthAreaManagementSystem.UI.Controls;
using MFCYouthAreaManagementSystem.UI.Theme;
using MFCYouthAreaManagementSystem.Utilities;

namespace MFCYouthAreaManagementSystem.Forms;

public sealed class EventDetailsForm : Form
{
    private readonly long _eventId;
    private readonly EventRepository _eventRepo = new();
    private readonly EventParticipantRepository _participantRepo = new();
    private readonly DataGridView _grid = UiHelper.CreateGrid();
    private readonly ModernTextBox _search = new() { Placeholder = "Search registered participants..." };
    private readonly EmptyStatePanel _empty = new("No Participants Registered", "Register the first participant for this Event.");
    private readonly Label _eventName = InfoValue();
    private readonly Label _dateTime = InfoValue();
    private readonly Label _venue = InfoValue();
    private readonly Label _fee = InfoValue();
    private readonly Label _description = InfoValue();
    private readonly StatCard _registered = new() { Title = "Registered" };
    private readonly StatCard _attended = new() { Title = "People Attended" };
    private readonly StatCard _paid = new() { Title = "Paid" };
    private readonly StatCard _totalFees = new() { Title = "Fees Collected" };
    private AreaEvent? _event;

    public EventDetailsForm(long eventId)
    {
        _eventId = eventId;
        Text = "Event Details";
        StartPosition = FormStartPosition.CenterParent;
        Size = new Size(1120, 820);
        MinimumSize = new Size(980, 720);
        BackColor = ThemeColors.Background;
        Font = ThemeFonts.Body;
        Padding = new Padding(22);
        AutoScaleMode = AutoScaleMode.Dpi;

        var root = new TableLayoutPanel
        {
            Dock = DockStyle.Fill,
            ColumnCount = 1,
            RowCount = 6,
            Margin = Padding.Empty,
            Padding = Padding.Empty
        };
        root.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 100));
        root.RowStyles.Add(new RowStyle(SizeType.Absolute, ThemeSizes.PageHeaderHeight));
        root.RowStyles.Add(new RowStyle(SizeType.Absolute, 154));
        root.RowStyles.Add(new RowStyle(SizeType.Absolute, 150));
        root.RowStyles.Add(new RowStyle(SizeType.Absolute, ThemeSizes.ToolbarSearchHeight + ThemeSizes.ToolbarActionsHeight + 8));
        root.RowStyles.Add(new RowStyle(SizeType.Percent, 100));
        root.RowStyles.Add(new RowStyle(SizeType.Absolute, ThemeSizes.DialogActionsHeight));
        Controls.Add(root);

        root.Controls.Add(new PageHeader("Event Details", "Review Event information, registration summary, and participants."), 0, 0);
        root.Controls.Add(BuildInfoCard(), 0, 1);
        root.Controls.Add(BuildSummary(), 0, 2);
        root.Controls.Add(BuildParticipantTools(), 0, 3);

        _grid.Columns.Add(new DataGridViewTextBoxColumn { HeaderText = "Participant", DataPropertyName = "FullName", AutoSizeMode = DataGridViewAutoSizeColumnMode.Fill, MinimumWidth = 180 });
        _grid.Columns.Add(new DataGridViewTextBoxColumn { HeaderText = "Age", DataPropertyName = "Age", Width = 58 });
        _grid.Columns.Add(new DataGridViewTextBoxColumn { HeaderText = "Chapter", DataPropertyName = "ChapterName", Width = 145 });
        _grid.Columns.Add(new DataGridViewTextBoxColumn { HeaderText = "Service", DataPropertyName = "ServiceName", Width = 145 });
        _grid.Columns.Add(new DataGridViewTextBoxColumn { HeaderText = "Contact", DataPropertyName = "ContactNumber", Width = 115 });
        _grid.Columns.Add(new DataGridViewTextBoxColumn { HeaderText = "Payment", DataPropertyName = "ModeOfPayment", Width = 105 });
        _grid.Columns.Add(new DataGridViewTextBoxColumn { HeaderText = "Status", DataPropertyName = "PaymentStatus", Width = 90 });
        _grid.DoubleClick += (_, _) => EditParticipant();

        var content = new Panel { Dock = DockStyle.Fill, Margin = Padding.Empty };
        content.Controls.Add(_grid);
        content.Controls.Add(_empty);
        root.Controls.Add(content, 0, 4);

        var footer = new FlowLayoutPanel
        {
            Dock = DockStyle.Fill,
            FlowDirection = FlowDirection.RightToLeft,
            WrapContents = false,
            Padding = new Padding(0, 10, 0, 0),
            Margin = Padding.Empty
        };
        var close = new ModernButton { Text = "Close", Width = 100, ButtonStyle = ModernButtonStyle.Secondary };
        var editEvent = new ModernButton { Text = "Edit Event", Width = 110, ButtonStyle = ModernButtonStyle.Ghost };
        close.Click += (_, _) => Close();
        editEvent.Click += (_, _) => EditEvent();
        footer.Controls.AddRange(new Control[] { close, editEvent });
        root.Controls.Add(footer, 0, 5);
        CancelButton = close;

        _search.TextValueChanged += (_, _) => LoadParticipants();
        Shown += (_, _) => ReloadAll();
    }

    private Control BuildInfoCard()
    {
        var card = new TableLayoutPanel
        {
            Dock = DockStyle.Fill,
            BackColor = ThemeColors.Surface,
            ColumnCount = 4,
            RowCount = 2,
            Padding = new Padding(18, 12, 18, 12),
            Margin = new Padding(0, 0, 0, 10)
        };
        card.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 25));
        card.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 25));
        card.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 25));
        card.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 25));
        card.RowStyles.Add(new RowStyle(SizeType.Absolute, 56));
        card.RowStyles.Add(new RowStyle(SizeType.Percent, 100));

        card.Controls.Add(InfoBlock("Event", _eventName), 0, 0);
        card.Controls.Add(InfoBlock("Date & Time", _dateTime), 1, 0);
        card.Controls.Add(InfoBlock("Venue", _venue), 2, 0);
        card.Controls.Add(InfoBlock("Registration Fee", _fee), 3, 0);
        var description = InfoBlock("Description", _description);
        card.Controls.Add(description, 0, 1);
        card.SetColumnSpan(description, 4);
        return card;
    }

    private Control BuildSummary()
    {
        var cards = new TableLayoutPanel
        {
            Dock = DockStyle.Fill,
            ColumnCount = 4,
            RowCount = 1,
            Padding = new Padding(0, 6, 0, 8),
            Margin = Padding.Empty
        };
        for (var i = 0; i < 4; i++) cards.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 25));
        cards.RowStyles.Add(new RowStyle(SizeType.Percent, 100));
        var statCards = new[] { _registered, _attended, _paid, _totalFees };
        for (var i = 0; i < statCards.Length; i++)
        {
            statCards[i].Dock = DockStyle.Fill;
            statCards[i].Margin = new Padding(i == 0 ? 0 : 7, 0, i == statCards.Length - 1 ? 0 : 7, 0);
            cards.Controls.Add(statCards[i], i, 0);
        }
        return cards;
    }

    private Control BuildParticipantTools()
    {
        var tools = new TableLayoutPanel
        {
            Dock = DockStyle.Fill,
            ColumnCount = 1,
            RowCount = 2,
            Margin = Padding.Empty,
            Padding = new Padding(0, 3, 0, 3)
        };
        tools.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 100));
        tools.RowStyles.Add(new RowStyle(SizeType.Absolute, ThemeSizes.ToolbarSearchHeight));
        tools.RowStyles.Add(new RowStyle(SizeType.Absolute, ThemeSizes.ToolbarActionsHeight));

        _search.Dock = DockStyle.Fill;
        _search.Margin = new Padding(0, 3, 0, 3);
        tools.Controls.Add(_search, 0, 0);

        var actions = new FlowLayoutPanel
        {
            Dock = DockStyle.Fill,
            FlowDirection = FlowDirection.RightToLeft,
            WrapContents = false,
            Padding = new Padding(0, 6, 0, 6),
            Margin = Padding.Empty,
            BackColor = ThemeColors.Background
        };
        var add = Btn("+ Register Participant", 160, ModernButtonStyle.Primary);
        var edit = Btn("Edit", 82, ModernButtonStyle.Secondary);
        var delete = Btn("Delete", 82, ModernButtonStyle.Danger);
        var refresh = Btn("Refresh", 86, ModernButtonStyle.Ghost);
        add.Click += (_, _) => AddParticipant();
        edit.Click += (_, _) => EditParticipant();
        delete.Click += (_, _) => DeleteParticipant();
        refresh.Click += (_, _) => ReloadAll();
        actions.Controls.AddRange(new Control[] { add, delete, edit, refresh });
        tools.Controls.Add(actions, 0, 1);
        return tools;
    }

    private static Control InfoBlock(string label, Label value)
    {
        var panel = new TableLayoutPanel { Dock = DockStyle.Fill, ColumnCount = 1, RowCount = 2, Margin = Padding.Empty, Padding = new Padding(0, 0, 12, 0) };
        panel.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 100));
        panel.RowStyles.Add(new RowStyle(SizeType.Absolute, 20));
        panel.RowStyles.Add(new RowStyle(SizeType.Percent, 100));
        panel.Controls.Add(new Label
        {
            Text = label,
            Dock = DockStyle.Fill,
            Font = ThemeFonts.Small,
            ForeColor = ThemeColors.TextSecondary,
            TextAlign = ContentAlignment.MiddleLeft,
            Margin = Padding.Empty
        }, 0, 0);
        panel.Controls.Add(value, 0, 1);
        return panel;
    }

    private static Label InfoValue() => new()
    {
        Dock = DockStyle.Fill,
        Font = ThemeFonts.BodyBold,
        ForeColor = ThemeColors.TextPrimary,
        TextAlign = ContentAlignment.TopLeft,
        AutoEllipsis = true,
        Margin = Padding.Empty,
        Padding = new Padding(0, 2, 0, 0)
    };

    private static ModernButton Btn(string text, int width, ModernButtonStyle style) => new()
    {
        Text = text,
        Width = width,
        ButtonStyle = style,
        Margin = new Padding(6, 0, 0, 0)
    };

    private EventParticipant? SelectedParticipant() => _grid.CurrentRow?.DataBoundItem as EventParticipant;

    private void ReloadAll()
    {
        try
        {
            _event = _eventRepo.GetById(_eventId) ?? throw new InvalidOperationException("Event was not found.");
            _eventName.Text = _event.EventName;
            _dateTime.Text = FormattingHelper.DateTimeDisplay(_event.EventDateTime);
            _venue.Text = _event.Venue;
            _fee.Text = _event.RegistrationFee.HasValue ? FormattingHelper.Peso(_event.RegistrationFee.Value) + " per person" : "No registration fee";
            _description.Text = _event.EventDescription;
            _registered.Value = _event.RegisteredCount.ToString();
            _attended.Value = _event.PeopleAttended.ToString();
            _paid.Value = _event.PaidCount.ToString();
            _totalFees.Value = FormattingHelper.Peso(_event.TotalRegistrationFees);
            Text = _event.EventName + " - Event Details";
            LoadParticipants();
        }
        catch (Exception ex)
        {
            AppLogger.Error("Load Event Details", ex);
            CustomDialog.Show(this, "Unable to Load Event", ex.Message, true);
        }
    }

    private void LoadParticipants()
    {
        try
        {
            var rows = _participantRepo.GetByEvent(_eventId, _search.TextValue);
            _grid.DataSource = rows;
            _grid.Visible = rows.Count > 0;
            _empty.Visible = rows.Count == 0;
            if (_grid.Visible) _grid.BringToFront(); else _empty.BringToFront();
        }
        catch (Exception ex)
        {
            AppLogger.Error("Load Event Participants", ex);
            CustomDialog.Show(this, "Participants Could Not Load", "The participant list could not be loaded.", true);
        }
    }

    private void AddParticipant()
    {
        try
        {
            if (new ChapterRepository().GetTotalCount() == 0)
            {
                CustomDialog.Show(this, "Chapter Required", "Create at least one Chapter before registering Event participants.");
                return;
            }

            using var form = new EventParticipantEditorForm(_eventId);
            if (form.ShowDialog(this) != DialogResult.OK) return;
            ReloadAll();
            CustomDialog.Show(this, "Participant Registered", $"{form.RegisteredParticipantName} has been registered successfully and is now listed in this Event.");
        }
        catch (Exception ex)
        {
            AppLogger.Error("Register Event Participant", ex);
            CustomDialog.Show(this, "Registration Failed", ex.Message, true);
        }
    }

    private void EditParticipant()
    {
        var participant = SelectedParticipant();
        if (participant == null) return;
        try
        {
            using var form = new EventParticipantEditorForm(_eventId, participant.ParticipantID);
            if (form.ShowDialog(this) != DialogResult.OK) return;
            ReloadAll();
        }
        catch (Exception ex)
        {
            AppLogger.Error("Edit Event Participant", ex);
            CustomDialog.Show(this, "Update Failed", ex.Message, true);
        }
    }

    private void DeleteParticipant()
    {
        var participant = SelectedParticipant();
        if (participant == null) return;
        if (!CustomDialog.Confirm(this, "Remove Participant?", $"{participant.FullName} will be removed from this Event registration.\n\nThis action cannot be undone.", "Remove", true)) return;
        try
        {
            _participantRepo.Delete(participant.ParticipantID, _eventId);
            ReloadAll();
        }
        catch (Exception ex)
        {
            AppLogger.Error("Delete Event Participant", ex);
            CustomDialog.Show(this, "Remove Failed", ex.Message, true);
        }
    }

    private void EditEvent()
    {
        try
        {
            using var form = new EventEditorForm(_eventId);
            if (form.ShowDialog(this) != DialogResult.OK) return;
            ReloadAll();
        }
        catch (Exception ex)
        {
            AppLogger.Error("Edit Event from Details", ex);
            CustomDialog.Show(this, "Update Failed", ex.Message, true);
        }
    }

    protected override bool ProcessCmdKey(ref Message msg, Keys keyData)
    {
        if (keyData == Keys.F5) { ReloadAll(); return true; }
        if (keyData == (Keys.Control | Keys.N)) { AddParticipant(); return true; }
        if (keyData == Keys.Enter && _grid.Focused) { EditParticipant(); return true; }
        if (keyData == Keys.Delete && _grid.Focused) { DeleteParticipant(); return true; }
        return base.ProcessCmdKey(ref msg, keyData);
    }
}
