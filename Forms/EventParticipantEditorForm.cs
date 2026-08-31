using MFCYouthAreaManagementSystem.Models;
using MFCYouthAreaManagementSystem.Repositories;
using MFCYouthAreaManagementSystem.UI.Controls;
using MFCYouthAreaManagementSystem.UI.Theme;
using MFCYouthAreaManagementSystem.Utilities;

namespace MFCYouthAreaManagementSystem.Forms;

public sealed class EventParticipantEditorForm : Form
{
    private readonly long _eventId;
    private readonly long? _participantId;
    private readonly EventParticipantRepository _repo = new();
    private readonly ModernTextBox _first = new();
    private readonly ModernTextBox _last = new();
    private readonly ModernTextBox _middleInitial = new() { Placeholder = "Optional" };
    private readonly NumericUpDown _age = new();
    private readonly ModernTextBox _contact = new();
    private readonly ModernTextBox _address = new() { Multiline = true };
    private readonly ModernComboBox _chapter = new();
    private readonly ModernComboBox _service = new();
    private readonly ModernTextBox _modeOfPayment = new() { Placeholder = "e.g. Cash, GCash, Bank Transfer" };
    private readonly ModernComboBox _paymentStatus = new();
    private readonly Label _error = new()
    {
        AutoSize = false,
        Dock = DockStyle.Fill,
        ForeColor = ThemeColors.Danger,
        Font = ThemeFonts.Small,
        TextAlign = ContentAlignment.MiddleLeft
    };
    private bool _dirty;

    public string RegisteredParticipantName { get; private set; } = string.Empty;

    public EventParticipantEditorForm(long eventId, long? participantId = null)
    {
        _eventId = eventId;
        _participantId = participantId;
        Text = participantId.HasValue ? "Edit Participant" : "Register Participant";
        StartPosition = FormStartPosition.CenterParent;
        Size = new Size(820, 790);
        MinimumSize = new Size(780, 760);
        BackColor = ThemeColors.Background;
        Font = ThemeFonts.Body;
        Padding = new Padding(24);
        FormBorderStyle = FormBorderStyle.FixedDialog;
        MaximizeBox = false;
        MinimizeBox = false;
        AutoScaleMode = AutoScaleMode.Dpi;

        _age.Minimum = 1;
        _age.Maximum = 120;
        _age.Value = 18;
        _age.Font = ThemeFonts.Body;
        _age.BackColor = ThemeColors.Surface;
        _age.BorderStyle = BorderStyle.FixedSingle;
        _age.Dock = DockStyle.Fill;

        var root = new TableLayoutPanel
        {
            Dock = DockStyle.Fill,
            ColumnCount = 2,
            RowCount = 8,
            Margin = Padding.Empty,
            Padding = Padding.Empty
        };
        root.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 50));
        root.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 50));
        root.RowStyles.Add(new RowStyle(SizeType.Absolute, 90));
        root.RowStyles.Add(new RowStyle(SizeType.Absolute, 90));
        root.RowStyles.Add(new RowStyle(SizeType.Absolute, 90));
        root.RowStyles.Add(new RowStyle(SizeType.Absolute, 90));
        root.RowStyles.Add(new RowStyle(SizeType.Absolute, 90));
        root.RowStyles.Add(new RowStyle(SizeType.Absolute, 150));
        root.RowStyles.Add(new RowStyle(SizeType.Absolute, 48));
        root.RowStyles.Add(new RowStyle(SizeType.Absolute, ThemeSizes.DialogActionsHeight));
        Controls.Add(root);

        root.Controls.Add(Field("First Name *", _first), 0, 0);
        root.Controls.Add(Field("Last Name *", _last), 1, 0);
        root.Controls.Add(Field("Middle Initial", _middleInitial), 0, 1);
        root.Controls.Add(Field("Age *", _age), 1, 1);
        root.Controls.Add(Field("Contact Number *", _contact), 0, 2);
        root.Controls.Add(Field("Chapter *", _chapter), 1, 2);
        root.Controls.Add(Field("Service *", _service), 0, 3);
        root.Controls.Add(Field("Payment Status *", _paymentStatus), 1, 3);

        var payment = Field("Mode of Payment", _modeOfPayment);
        root.Controls.Add(payment, 0, 4);
        root.SetColumnSpan(payment, 2);

        var address = Field("Address *", _address, true);
        root.Controls.Add(address, 0, 5);
        root.SetColumnSpan(address, 2);

        root.Controls.Add(_error, 0, 6);
        root.SetColumnSpan(_error, 2);

        var actions = new FlowLayoutPanel
        {
            Dock = DockStyle.Fill,
            FlowDirection = FlowDirection.RightToLeft,
            WrapContents = false,
            Padding = new Padding(0, 8, 0, 0),
            Margin = Padding.Empty
        };
        var save = new ModernButton { Text = participantId.HasValue ? "Save Changes" : "Register", Width = 130 };
        var cancel = new ModernButton { Text = "Cancel", Width = 90, ButtonStyle = ModernButtonStyle.Secondary };
        save.Click += (_, _) => Save(save);
        cancel.Click += (_, _) => Close();
        actions.Controls.AddRange(new Control[] { save, cancel });
        root.Controls.Add(actions, 0, 7);
        root.SetColumnSpan(actions, 2);
        AcceptButton = save;
        CancelButton = cancel;

        LoadChoices();
        if (participantId.HasValue) LoadParticipant(participantId.Value);

        foreach (var textBox in new[] { _first, _last, _middleInitial, _contact, _address, _modeOfPayment })
            textBox.TextValueChanged += (_, _) => _dirty = true;
        _age.ValueChanged += (_, _) => _dirty = true;
        _chapter.SelectedIndexChanged += (_, _) => _dirty = true;
        _service.SelectedIndexChanged += (_, _) => _dirty = true;
        _paymentStatus.SelectedIndexChanged += (_, _) => _dirty = true;
        FormClosing += OnFormClosing;
    }

    private static Control Field(string label, Control control, bool multiline = false)
    {
        var panel = new TableLayoutPanel
        {
            Dock = DockStyle.Fill,
            ColumnCount = 1,
            RowCount = 2,
            Padding = new Padding(0, 0, 12, 8),
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
            ForeColor = ThemeColors.TextPrimary,
            TextAlign = ContentAlignment.MiddleLeft,
            AutoEllipsis = true,
            Margin = Padding.Empty
        }, 0, 0);
        control.Dock = DockStyle.Fill;
        control.Margin = new Padding(0, 2, 0, 0);
        if (multiline && control is ModernTextBox box) box.Multiline = true;
        panel.Controls.Add(control, 0, 1);
        return panel;
    }

    private void LoadChoices()
    {
        var chapters = new ChapterRepository().GetAll();
        if (chapters.Count == 0) throw new InvalidOperationException("Create at least one Chapter before registering Event participants.");
        _chapter.DisplayMember = "ChapterName";
        _chapter.ValueMember = "ChapterID";
        _chapter.DataSource = chapters;
        _chapter.SelectedIndex = -1;

        var services = new ServiceRepository().GetAll();
        if (services.Count == 0) throw new InvalidOperationException("No Services are available for participant registration.");
        _service.DisplayMember = "ServiceName";
        _service.ValueMember = "ServiceID";
        _service.DataSource = services;
        _service.SelectedIndex = -1;

        _paymentStatus.Items.AddRange(ApplicationConstants.PaymentStatuses.Cast<object>().ToArray());
        _paymentStatus.SelectedItem = "Not Paid";
    }

    private void LoadParticipant(long participantId)
    {
        var participant = _repo.GetById(participantId) ?? throw new InvalidOperationException("Event participant not found.");
        if (participant.EventID != _eventId) throw new InvalidOperationException("This participant belongs to another Event.");

        _first.TextValue = participant.FirstName;
        _last.TextValue = participant.LastName;
        _middleInitial.TextValue = participant.MiddleInitial ?? string.Empty;
        _age.Value = Math.Min(_age.Maximum, Math.Max(_age.Minimum, participant.Age));
        _contact.TextValue = participant.ContactNumber;
        _address.TextValue = participant.Address;
        if (participant.ChapterID.HasValue) _chapter.SelectedValue = participant.ChapterID.Value; else _chapter.SelectedIndex = -1;
        if (participant.ServiceID.HasValue) _service.SelectedValue = participant.ServiceID.Value; else _service.SelectedIndex = -1;
        _modeOfPayment.TextValue = participant.ModeOfPayment ?? string.Empty;
        _paymentStatus.SelectedItem = participant.PaymentStatus;
        _dirty = false;
    }

    private void Save(Control button)
    {
        _error.Text = string.Empty;
        var first = ValidationHelper.Clean(_first.TextValue);
        var last = ValidationHelper.Clean(_last.TextValue);
        var middle = ValidationHelper.Clean(_middleInitial.TextValue);
        var contact = ValidationHelper.Clean(_contact.TextValue);
        var address = ValidationHelper.Clean(_address.TextValue);
        var mode = ValidationHelper.Clean(_modeOfPayment.TextValue);
        var paymentStatus = Convert.ToString(_paymentStatus.SelectedItem) ?? string.Empty;

        if (first.Length == 0 || last.Length == 0 || contact.Length == 0 || address.Length == 0 ||
            _chapter.SelectedValue == null || _service.SelectedValue == null || paymentStatus.Length == 0)
        {
            _error.Text = "Please complete all required participant fields.";
            return;
        }

        if (!ValidationHelper.IsValidMiddleInitial(middle))
        {
            _error.Text = "Middle Initial must be one letter, with an optional period (for example M or M.).";
            return;
        }

        if (!ValidationHelper.IsValidContact(contact))
        {
            _error.Text = "Contact Number must contain exactly 11 digits.";
            return;
        }

        if (string.Equals(paymentStatus, "Paid", StringComparison.OrdinalIgnoreCase) && mode.Length == 0)
        {
            _error.Text = "Enter the Mode of Payment for a Paid participant.";
            return;
        }

        button.Enabled = false;
        try
        {
            var participant = new EventParticipant
            {
                ParticipantID = _participantId ?? 0,
                EventID = _eventId,
                FirstName = first,
                LastName = last,
                MiddleInitial = middle.Length == 0 ? null : middle,
                Age = decimal.ToInt32(_age.Value),
                ContactNumber = contact,
                Address = address,
                ChapterID = Convert.ToInt64(_chapter.SelectedValue),
                ServiceID = Convert.ToInt64(_service.SelectedValue),
                ModeOfPayment = mode.Length == 0 ? null : mode,
                PaymentStatus = paymentStatus
            };

            if (_participantId.HasValue) _repo.Update(participant); else _repo.Add(participant);
            RegisteredParticipantName = participant.FullName;
            _dirty = false;
            DialogResult = DialogResult.OK;
            Close();
        }
        catch (Exception ex)
        {
            AppLogger.Error("Save Event Participant", ex);
            _error.Text = "Could not save the participant. " + ex.Message;
            button.Enabled = true;
        }
    }

    private void OnFormClosing(object? sender, FormClosingEventArgs e)
    {
        if (DialogResult == DialogResult.OK || !_dirty) return;
        if (!CustomDialog.Confirm(this, "Discard Changes?", "You have unsaved participant changes.", "Discard", true)) e.Cancel = true;
    }
}
