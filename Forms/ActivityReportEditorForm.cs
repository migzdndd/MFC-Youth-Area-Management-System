using MFCYouthAreaManagementSystem.Models;
using MFCYouthAreaManagementSystem.Repositories;
using MFCYouthAreaManagementSystem.UI.Controls;
using MFCYouthAreaManagementSystem.UI.Theme;
using MFCYouthAreaManagementSystem.Utilities;

namespace MFCYouthAreaManagementSystem.Forms;

public sealed class ActivityReportEditorForm : Form
{
    private readonly long? _id;
    private readonly ActivityReportRepository _repo = new();
    private readonly ModernTextBox _title = new();
    private readonly ModernTextBox _activity = new();
    private readonly ModernTextBox _prepared = new();
    private readonly ModernTextBox _description = new() { Multiline = true };
    private readonly ModernComboBox _chapter = new();
    private readonly ModernComboBox _type = new();
    private readonly DateTimePicker _date = new() { Format = DateTimePickerFormat.Long };
    private readonly Label _error = new() { AutoSize = false, Dock = DockStyle.Fill, ForeColor = ThemeColors.Danger, Font = ThemeFonts.Small, TextAlign = ContentAlignment.MiddleLeft };
    private bool _dirty;

    public ActivityReportEditorForm(long? id = null)
    {
        _id = id;
        Text = id.HasValue ? "Edit Activity Report" : "Add Activity Report";
        StartPosition = FormStartPosition.CenterParent;
        Size = new Size(740, 720);
        MinimumSize = new Size(700, 690);
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

        var titleField = Field("Report Title *", _title);
        root.Controls.Add(titleField, 0, 0);
        root.SetColumnSpan(titleField, 2);
        root.Controls.Add(Field("Chapter *", _chapter), 0, 1);
        root.Controls.Add(Field("Report Type *", _type), 1, 1);
        root.Controls.Add(Field("Activity *", _activity), 0, 2);
        root.Controls.Add(Field("Report Date *", _date), 1, 2);
        var prepared = Field("Prepared By *", _prepared);
        root.Controls.Add(prepared, 0, 3);
        root.SetColumnSpan(prepared, 2);
        var description = Field("Description *", _description, true);
        root.Controls.Add(description, 0, 4);
        root.SetColumnSpan(description, 2);
        root.Controls.Add(_error, 0, 5);
        root.SetColumnSpan(_error, 2);

        var actions = new FlowLayoutPanel { Dock = DockStyle.Fill, FlowDirection = FlowDirection.RightToLeft, WrapContents = false, Padding = new Padding(0, 8, 0, 0), Margin = Padding.Empty };
        var save = new ModernButton { Text = id.HasValue ? "Save Changes" : "Save Report", Width = 120 };
        var cancel = new ModernButton { Text = "Cancel", Width = 90, ButtonStyle = ModernButtonStyle.Secondary };
        save.Click += (_, _) => Save(save);
        cancel.Click += (_, _) => Close();
        actions.Controls.AddRange(new Control[] { save, cancel });
        root.Controls.Add(actions, 0, 6);
        root.SetColumnSpan(actions, 2);
        AcceptButton = save;

        _chapter.DisplayMember = "ChapterName";
        _chapter.ValueMember = "ChapterID";
        _chapter.DataSource = new ChapterRepository().GetAll();
        _type.Items.AddRange(ApplicationConstants.ReportTypes.Cast<object>().ToArray());
        if (_type.Items.Count > 0) _type.SelectedIndex = 0;
        if (id.HasValue) LoadReport(id.Value);

        foreach (var textBox in new[] { _title, _activity, _prepared, _description })
            textBox.TextValueChanged += (_, _) => _dirty = true;
        _chapter.SelectedIndexChanged += (_, _) => _dirty = true;
        _type.SelectedIndexChanged += (_, _) => _dirty = true;
        _date.ValueChanged += (_, _) => _dirty = true;
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

    private void LoadReport(long id)
    {
        var report = _repo.GetById(id) ?? throw new InvalidOperationException("Report not found.");
        _title.TextValue = report.Title;
        if (report.ChapterID.HasValue)
        {
            _chapter.SelectedValue = report.ChapterID.Value;
        }
        else
        {
            _chapter.SelectedIndex = -1;
            _error.Text = $"The original Chapter ({report.ChapterName}) was deleted. Select a Chapter before saving changes.";
        }
        if (!_type.Items.Cast<object>().Any(item => string.Equals(Convert.ToString(item), report.ReportType, StringComparison.OrdinalIgnoreCase)))
            _type.Items.Add(report.ReportType);
        _type.SelectedItem = _type.Items.Cast<object>().FirstOrDefault(item => string.Equals(Convert.ToString(item), report.ReportType, StringComparison.OrdinalIgnoreCase));
        _activity.TextValue = report.Activity;
        _date.Value = report.ReportDate;
        _prepared.TextValue = report.PreparedBy;
        _description.TextValue = report.Description;
        _dirty = false;
    }

    private void Save(Control button)
    {
        _error.Text = string.Empty;
        var values = new[]
        {
            ValidationHelper.Clean(_title.TextValue),
            ValidationHelper.Clean(_activity.TextValue),
            ValidationHelper.Clean(_prepared.TextValue),
            ValidationHelper.Clean(_description.TextValue)
        };
        if (values.Any(string.IsNullOrWhiteSpace) || _chapter.SelectedValue == null || _type.SelectedItem == null)
        {
            _error.Text = "Please complete all required Report fields.";
            return;
        }

        button.Enabled = false;
        try
        {
            var report = new ActivityReport
            {
                ReportID = _id ?? 0,
                Title = values[0],
                ChapterID = Convert.ToInt64(_chapter.SelectedValue),
                ReportType = Convert.ToString(_type.SelectedItem)!,
                Activity = values[1],
                ReportDate = _date.Value.Date,
                PreparedBy = values[2],
                Description = values[3]
            };
            if (_id.HasValue) _repo.Update(report); else _repo.Add(report);
            _dirty = false;
            DialogResult = DialogResult.OK;
            Close();
        }
        catch (Exception ex)
        {
            AppLogger.Error("Save Activity Report", ex);
            _error.Text = "Could not save the Report. " + ex.Message;
            button.Enabled = true;
        }
    }

    private void OnFormClosing(object? sender, FormClosingEventArgs e)
    {
        if (DialogResult == DialogResult.OK || !_dirty) return;
        if (!CustomDialog.Confirm(this, "Discard Changes?", "You have unsaved changes.", "Discard", true)) e.Cancel = true;
    }
}
