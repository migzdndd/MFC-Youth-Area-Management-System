using MFCYouthAreaManagementSystem.Models;
using MFCYouthAreaManagementSystem.Repositories;
using MFCYouthAreaManagementSystem.UI.Controls;
using MFCYouthAreaManagementSystem.UI.Theme;
using MFCYouthAreaManagementSystem.Utilities;

namespace MFCYouthAreaManagementSystem.Forms;

public sealed class GIGContributionEditorForm : Form
{
    private readonly long _memberId;
    private readonly long? _id;
    private readonly DateTimePicker _date = new() { Format = DateTimePickerFormat.Long, Value = DateTime.Today };
    private readonly ModernTextBox _amount = new() { Placeholder = "0.00" };
    private readonly ModernTextBox _remarks = new() { Multiline = true };
    private readonly Label _error = new() { AutoSize = false, Dock = DockStyle.Fill, ForeColor = ThemeColors.Danger, TextAlign = ContentAlignment.MiddleLeft };

    public GIGContributionEditorForm(long memberId, long? id = null)
    {
        _memberId = memberId;
        _id = id;
        Text = id.HasValue ? "Edit Contribution" : "Add Contribution";
        StartPosition = FormStartPosition.CenterParent;
        Size = new Size(540, 540);
        BackColor = ThemeColors.Background;
        Font = ThemeFonts.Body;
        Padding = new Padding(24);
        FormBorderStyle = FormBorderStyle.FixedDialog;
        MaximizeBox = false;
        MinimizeBox = false;
        AutoScaleMode = AutoScaleMode.Dpi;

        var root = new TableLayoutPanel { Dock = DockStyle.Fill, ColumnCount = 1, RowCount = 5, Margin = Padding.Empty, Padding = Padding.Empty };
        root.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 100));
        root.RowStyles.Add(new RowStyle(SizeType.Absolute, 90));
        root.RowStyles.Add(new RowStyle(SizeType.Absolute, 90));
        root.RowStyles.Add(new RowStyle(SizeType.Absolute, 160));
        root.RowStyles.Add(new RowStyle(SizeType.Absolute, 48));
        root.RowStyles.Add(new RowStyle(SizeType.Absolute, ThemeSizes.DialogActionsHeight));
        Controls.Add(root);

        root.Controls.Add(Field("Contribution Date *", _date), 0, 0);
        root.Controls.Add(Field("Amount *", _amount), 0, 1);
        root.Controls.Add(Field("Remarks", _remarks, true), 0, 2);
        root.Controls.Add(_error, 0, 3);

        var actions = new FlowLayoutPanel { Dock = DockStyle.Fill, FlowDirection = FlowDirection.RightToLeft, WrapContents = false, Padding = new Padding(0, 8, 0, 0), Margin = Padding.Empty };
        var save = new ModernButton { Text = id.HasValue ? "Save Changes" : "Add Contribution", Width = 130 };
        var cancel = new ModernButton { Text = "Cancel", Width = 90, ButtonStyle = ModernButtonStyle.Secondary };
        save.Click += (_, _) => Save(save);
        cancel.Click += (_, _) => Close();
        actions.Controls.AddRange(new Control[] { save, cancel });
        root.Controls.Add(actions, 0, 4);
        AcceptButton = save;

        if (id.HasValue) LoadContribution(id.Value);
    }

    private static Control Field(string label, Control control, bool multiline = false)
    {
        var panel = new TableLayoutPanel { Dock = DockStyle.Fill, ColumnCount = 1, RowCount = 2, Padding = new Padding(0, 0, 0, 8), Margin = Padding.Empty };
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

    private void LoadContribution(long id)
    {
        var contribution = new GIGContributionRepository().GetById(id) ?? throw new InvalidOperationException("Contribution not found.");
        if (contribution.MemberID != _memberId) throw new InvalidOperationException("Contribution does not belong to this Member.");
        _date.Value = contribution.ContributionDate;
        _amount.TextValue = contribution.Amount.ToString("0.00", System.Globalization.CultureInfo.GetCultureInfo("en-PH"));
        _remarks.TextValue = contribution.Remarks ?? string.Empty;
    }

    private void Save(Control button)
    {
        _error.Text = string.Empty;
        if (!ValidationHelper.TryParsePositiveAmount(_amount.TextValue, out var amount))
        {
            _error.Text = "Amount must be a number greater than zero.";
            return;
        }

        button.Enabled = false;
        try
        {
            var repository = new GIGContributionRepository();
            var contribution = new GIGContribution
            {
                ContributionID = _id ?? 0,
                MemberID = _memberId,
                ContributionDate = _date.Value.Date,
                Amount = amount,
                Remarks = ValidationHelper.Clean(_remarks.TextValue)
            };
            if (_id.HasValue) repository.Update(contribution); else repository.Add(contribution);
            DialogResult = DialogResult.OK;
            Close();
        }
        catch (Exception ex)
        {
            AppLogger.Error("Save GIG Contribution", ex);
            _error.Text = "Could not save the Contribution. " + ex.Message;
            button.Enabled = true;
        }
    }
}
