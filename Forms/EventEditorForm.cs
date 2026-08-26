using System.Globalization;
using MFCYouthAreaManagementSystem.Models;
using MFCYouthAreaManagementSystem.Repositories;
using MFCYouthAreaManagementSystem.UI.Controls;
using MFCYouthAreaManagementSystem.UI.Theme;
using MFCYouthAreaManagementSystem.Utilities;

namespace MFCYouthAreaManagementSystem.Forms;

public sealed class EventEditorForm : Form
{
    private readonly long? _id;
    private readonly EventRepository _repo = new();
    private readonly ModernTextBox _name = new();
    private readonly ModernTextBox _description = new() { Multiline = true };
    private readonly ModernTextBox _registrationFee = new() { Placeholder = "Leave blank for no registration fee" };
    private readonly ModernTextBox _venue = new();
    private readonly NumericUpDown _peopleAttended = new();
    private readonly DateTimePicker _eventDateTime = new();
    private readonly Label _error = new()
    {
        AutoSize = false,
        Dock = DockStyle.Fill,
        ForeColor = ThemeColors.Danger,
        Font = ThemeFonts.Small,
        TextAlign = ContentAlignment.MiddleLeft
    };
    private bool _dirty;

    public EventEditorForm(long? id = null)
    {
        _id = id;
        Text = id.HasValue ? "Edit Event" : "Add Event";
        StartPosition = FormStartPosition.CenterParent;
        Size = new Size(780, 700);
        MinimumSize = new Size(740, 670);
        BackColor = ThemeColors.Background;
        Font = ThemeFonts.Body;
        Padding = new Padding(24);
        FormBorderStyle = FormBorderStyle.FixedDialog;
        MaximizeBox = false;
        MinimizeBox = false;
        AutoScaleMode = AutoScaleMode.Dpi;

        _peopleAttended.Minimum = 0;
        _peopleAttended.Maximum = 100000;
        _peopleAttended.Font = ThemeFonts.Body;
        _peopleAttended.BackColor = ThemeColors.Surface;
        _peopleAttended.BorderStyle = BorderStyle.FixedSingle;
        _peopleAttended.ThousandsSeparator = true;
        _peopleAttended.Dock = DockStyle.Fill;

        _eventDateTime.Format = DateTimePickerFormat.Custom;
        _eventDateTime.CustomFormat = "MMMM d, yyyy   h:mm tt";
        _eventDateTime.Font = ThemeFonts.Body;
        _eventDateTime.CalendarForeColor = ThemeColors.TextPrimary;
        _eventDateTime.CalendarMonthBackground = ThemeColors.Surface;
        _eventDateTime.Dock = DockStyle.Fill;

        var root = new TableLayoutPanel
        {
            Dock = DockStyle.Fill,
            ColumnCount = 2,
            RowCount = 6,
            Margin = Padding.Empty,
            Padding = Padding.Empty
        };
        root.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 50));
        root.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 50));
        root.RowStyles.Add(new RowStyle(SizeType.Absolute, 90));
        root.RowStyles.Add(new RowStyle(SizeType.Absolute, 90));
        root.RowStyles.Add(new RowStyle(SizeType.Absolute, 90));
        root.RowStyles.Add(new RowStyle(SizeType.Absolute, 180));
        root.RowStyles.Add(new RowStyle(SizeType.Absolute, 48));
        root.RowStyles.Add(new RowStyle(SizeType.Absolute, ThemeSizes.DialogActionsHeight));
        Controls.Add(root);

        var nameField = Field("Event Name *", _name);
        root.Controls.Add(nameField, 0, 0);
        root.SetColumnSpan(nameField, 2);

        root.Controls.Add(Field("Date & Time *", _eventDateTime), 0, 1);
        root.Controls.Add(Field("Registration Fee (Optional)", _registrationFee), 1, 1);
        root.Controls.Add(Field("Venue *", _venue), 0, 2);
        root.Controls.Add(Field("People Attended", _peopleAttended), 1, 2);

        var descriptionField = Field("Event Description *", _description, true);
        root.Controls.Add(descriptionField, 0, 3);
        root.SetColumnSpan(descriptionField, 2);

        root.Controls.Add(_error, 0, 4);
        root.SetColumnSpan(_error, 2);

        var actions = new FlowLayoutPanel
        {
            Dock = DockStyle.Fill,
            FlowDirection = FlowDirection.RightToLeft,
            WrapContents = false,
            Padding = new Padding(0, 8, 0, 0),
            Margin = Padding.Empty
        };
        var save = new ModernButton { Text = id.HasValue ? "Save Changes" : "Create Event", Width = 135 };
        var cancel = new ModernButton { Text = "Cancel", Width = 90, ButtonStyle = ModernButtonStyle.Secondary };
        save.Click += (_, _) => Save(save);
        cancel.Click += (_, _) => Close();
        actions.Controls.AddRange(new Control[] { save, cancel });
        root.Controls.Add(actions, 0, 5);
        root.SetColumnSpan(actions, 2);
        AcceptButton = save;
        CancelButton = cancel;

        if (id.HasValue) LoadEvent(id.Value);

        foreach (var textBox in new[] { _name, _description, _registrationFee, _venue })
            textBox.TextValueChanged += (_, _) => _dirty = true;
        _peopleAttended.ValueChanged += (_, _) => _dirty = true;
        _eventDateTime.ValueChanged += (_, _) => _dirty = true;
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

    private void LoadEvent(long id)
    {
        var areaEvent = _repo.GetById(id) ?? throw new InvalidOperationException("Event not found.");
        _name.TextValue = areaEvent.EventName;
        _description.TextValue = areaEvent.EventDescription;
        _registrationFee.TextValue = areaEvent.RegistrationFee?.ToString("0.##", CultureInfo.InvariantCulture) ?? string.Empty;
        _venue.TextValue = areaEvent.Venue;
        _peopleAttended.Value = Math.Min(_peopleAttended.Maximum, Math.Max(_peopleAttended.Minimum, areaEvent.PeopleAttended));
        _eventDateTime.Value = areaEvent.EventDateTime;
        _dirty = false;
    }

    private void Save(Control button)
    {
        _error.Text = string.Empty;
        var name = ValidationHelper.Clean(_name.TextValue);
        var description = ValidationHelper.Clean(_description.TextValue);
        var venue = ValidationHelper.Clean(_venue.TextValue);

        if (name.Length == 0 || description.Length == 0 || venue.Length == 0)
        {
            _error.Text = "Event Name, Event Description, and Venue are required.";
            return;
        }

        decimal? registrationFee = null;
        var feeText = ValidationHelper.Clean(_registrationFee.TextValue);
        if (feeText.Length > 0)
        {
            if (!ValidationHelper.TryParsePositiveAmount(feeText, out var fee))
            {
                _error.Text = "Registration Fee must be a number greater than zero, or left blank.";
                return;
            }
            registrationFee = fee;
        }

        button.Enabled = false;
        try
        {
            var areaEvent = new AreaEvent
            {
                EventID = _id ?? 0,
                EventName = name,
                EventDescription = description,
                RegistrationFee = registrationFee,
                PeopleAttended = decimal.ToInt32(_peopleAttended.Value),
                Venue = venue,
                EventDateTime = _eventDateTime.Value
            };

            if (_id.HasValue) _repo.Update(areaEvent); else _repo.Add(areaEvent);
            _dirty = false;
            DialogResult = DialogResult.OK;
            Close();
        }
        catch (Exception ex)
        {
            AppLogger.Error("Save Event", ex);
            _error.Text = "Could not save the Event. " + ex.Message;
            button.Enabled = true;
        }
    }

    private void OnFormClosing(object? sender, FormClosingEventArgs e)
    {
        if (DialogResult == DialogResult.OK || !_dirty) return;
        if (!CustomDialog.Confirm(this, "Discard Changes?", "You have unsaved Event changes.", "Discard", true)) e.Cancel = true;
    }
}
