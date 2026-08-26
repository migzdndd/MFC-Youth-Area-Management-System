using MFCYouthAreaManagementSystem.Models;
using MFCYouthAreaManagementSystem.Repositories;
using MFCYouthAreaManagementSystem.UI.Controls;
using MFCYouthAreaManagementSystem.UI.Theme;
using MFCYouthAreaManagementSystem.Utilities;

namespace MFCYouthAreaManagementSystem.Forms;

public sealed class MemberEditorForm : Form
{
    private readonly long? _id;
    private readonly MemberRepository _repo = new();
    private readonly ModernTextBox _first = new();
    private readonly ModernTextBox _middle = new();
    private readonly ModernTextBox _last = new();
    private readonly ModernTextBox _contact = new();
    private readonly ModernTextBox _email = new();
    private readonly ModernTextBox _address = new() { Multiline = true };
    private readonly DateTimePicker _birth = new() { Format = DateTimePickerFormat.Long, MaxDate = DateTime.Today };
    private readonly ModernComboBox _status = new();
    private readonly ModernComboBox _chapter = new();
    private readonly Label _error = new() { AutoSize = false, Dock = DockStyle.Fill, ForeColor = ThemeColors.Danger, Font = ThemeFonts.Small, TextAlign = ContentAlignment.MiddleLeft };
    private bool _dirty;

    public MemberEditorForm(long? id = null)
    {
        _id = id;
        Text = id.HasValue ? "Edit Member" : "Add Member";
        StartPosition = FormStartPosition.CenterParent;
        Size = new Size(680, 720);
        MinimumSize = new Size(650, 690);
        BackColor = ThemeColors.Background;
        Font = ThemeFonts.Body;
        Padding = new Padding(24);
        FormBorderStyle = FormBorderStyle.FixedDialog;
        MaximizeBox = false;
        MinimizeBox = false;
        AutoScaleMode = AutoScaleMode.Dpi;

        var root = new TableLayoutPanel { Dock = DockStyle.Fill, ColumnCount = 2, RowCount = 7, Margin = Padding.Empty, Padding = Padding.Empty };
        root.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 50));
        root.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 50));
        root.RowStyles.Add(new RowStyle(SizeType.Absolute, 90));
        root.RowStyles.Add(new RowStyle(SizeType.Absolute, 90));
        root.RowStyles.Add(new RowStyle(SizeType.Absolute, 90));
        root.RowStyles.Add(new RowStyle(SizeType.Absolute, 90));
        root.RowStyles.Add(new RowStyle(SizeType.Absolute, 160));
        root.RowStyles.Add(new RowStyle(SizeType.Absolute, 48));
        root.RowStyles.Add(new RowStyle(SizeType.Absolute, ThemeSizes.DialogActionsHeight));
        Controls.Add(root);

        root.Controls.Add(Field("First Name *", _first), 0, 0);
        root.Controls.Add(Field("Middle Name", _middle), 1, 0);
        root.Controls.Add(Field("Last Name *", _last), 0, 1);
        root.Controls.Add(Field("Birth Date *", _birth), 1, 1);
        root.Controls.Add(Field("Contact Number *", _contact), 0, 2);
        root.Controls.Add(Field("Email Address", _email), 1, 2);
        root.Controls.Add(Field("Status *", _status), 0, 3);
        root.Controls.Add(Field("Chapter *", _chapter), 1, 3);

        var address = Field("Address *", _address, true);
        root.Controls.Add(address, 0, 4);
        root.SetColumnSpan(address, 2);
        root.Controls.Add(_error, 0, 5);
        root.SetColumnSpan(_error, 2);

        var actions = new FlowLayoutPanel { Dock = DockStyle.Fill, FlowDirection = FlowDirection.RightToLeft, WrapContents = false, Padding = new Padding(0, 8, 0, 0), Margin = Padding.Empty };
        var save = new ModernButton { Text = id.HasValue ? "Save Changes" : "Save Member", Width = 130 };
        var cancel = new ModernButton { Text = "Cancel", Width = 90, ButtonStyle = ModernButtonStyle.Secondary };
        save.Click += (_, _) => Save(save);
        cancel.Click += (_, _) => Close();
        actions.Controls.AddRange(new Control[] { save, cancel });
        root.Controls.Add(actions, 0, 6);
        root.SetColumnSpan(actions, 2);
        AcceptButton = save;

        _status.Items.AddRange(ApplicationConstants.MemberStatuses.Cast<object>().ToArray());
        _status.SelectedIndex = 0;
        LoadChapters();
        if (id.HasValue) LoadMember(id.Value);

        foreach (var textBox in new[] { _first, _middle, _last, _contact, _email, _address })
            textBox.TextValueChanged += (_, _) => _dirty = true;
        _status.SelectedIndexChanged += (_, _) => _dirty = true;
        _chapter.SelectedIndexChanged += (_, _) => _dirty = true;
        _birth.ValueChanged += (_, _) => _dirty = true;
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

    private void LoadChapters()
    {
        _chapter.DisplayMember = "ChapterName";
        _chapter.ValueMember = "ChapterID";
        _chapter.DataSource = new ChapterRepository().GetAll();
    }

    private void LoadMember(long id)
    {
        var member = _repo.GetById(id) ?? throw new InvalidOperationException("Member not found.");
        _first.TextValue = member.FirstName;
        _middle.TextValue = member.MiddleName ?? string.Empty;
        _last.TextValue = member.LastName;
        _birth.Value = member.BirthDate.Date > DateTime.Today ? DateTime.Today : member.BirthDate.Date;
        _contact.TextValue = member.ContactNumber;
        _email.TextValue = member.EmailAddress ?? string.Empty;
        _address.TextValue = member.Address;
        if (!_status.Items.Cast<object>().Any(item => string.Equals(Convert.ToString(item), member.Status, StringComparison.OrdinalIgnoreCase)))
            _status.Items.Add(member.Status);
        _status.SelectedItem = _status.Items.Cast<object>().FirstOrDefault(item => string.Equals(Convert.ToString(item), member.Status, StringComparison.OrdinalIgnoreCase));
        _chapter.SelectedValue = member.ChapterID;
        _dirty = false;
    }

    private void Save(Control button)
    {
        _error.Text = string.Empty;
        var first = ValidationHelper.Clean(_first.TextValue);
        var last = ValidationHelper.Clean(_last.TextValue);
        var contact = ValidationHelper.Clean(_contact.TextValue);
        var address = ValidationHelper.Clean(_address.TextValue);

        if (first.Length == 0 || last.Length == 0 || contact.Length == 0 || address.Length == 0 || _chapter.SelectedValue == null || _status.SelectedItem == null)
        {
            _error.Text = "Please complete all required fields.";
            return;
        }
        if (_birth.Value.Date > DateTime.Today)
        {
            _error.Text = "Birth Date cannot be in the future.";
            return;
        }
        if (!ValidationHelper.IsValidContact(contact))
        {
            _error.Text = "Contact Number must contain exactly 11 digits.";
            return;
        }
        if (!ValidationHelper.IsValidOptionalEmail(_email.TextValue))
        {
            _error.Text = "Enter a valid email address or leave Email blank.";
            return;
        }

        button.Enabled = false;
        try
        {
            var member = new Member
            {
                MemberID = _id ?? 0,
                FirstName = first,
                MiddleName = ValidationHelper.Clean(_middle.TextValue),
                LastName = last,
                BirthDate = _birth.Value.Date,
                ContactNumber = contact,
                EmailAddress = ValidationHelper.Clean(_email.TextValue),
                Address = address,
                Status = Convert.ToString(_status.SelectedItem)!,
                ChapterID = Convert.ToInt64(_chapter.SelectedValue)
            };
            if (_id.HasValue) _repo.Update(member); else _repo.Add(member);
            _dirty = false;
            DialogResult = DialogResult.OK;
            Close();
        }
        catch (Exception ex)
        {
            AppLogger.Error("Save Member", ex);
            _error.Text = "Could not save the Member. " + ex.Message;
            button.Enabled = true;
        }
    }

    private void OnFormClosing(object? sender, FormClosingEventArgs e)
    {
        if (DialogResult == DialogResult.OK || !_dirty) return;
        if (!CustomDialog.Confirm(this, "Discard Changes?", "You have unsaved changes.", "Discard", true)) e.Cancel = true;
    }
}
