using System.Data.SQLite;
using MFCYouthAreaManagementSystem.Models;
using MFCYouthAreaManagementSystem.Repositories;
using MFCYouthAreaManagementSystem.UI.Controls;
using MFCYouthAreaManagementSystem.UI.Theme;
using MFCYouthAreaManagementSystem.Utilities;

namespace MFCYouthAreaManagementSystem.Forms;

public sealed class ChapterDialogForm : Form
{
    private readonly Chapter? _chapter;
    private readonly ModernTextBox _name = new() { Placeholder = "Chapter name" };
    private readonly Label _error = new() { AutoSize = false, Dock = DockStyle.Fill, ForeColor = ThemeColors.Danger, TextAlign = ContentAlignment.MiddleLeft };

    public ChapterDialogForm(Chapter? chapter = null)
    {
        _chapter = chapter;
        Text = chapter == null ? "Add Chapter" : "Rename Chapter";
        StartPosition = FormStartPosition.CenterParent;
        Size = new Size(480, 400);
        BackColor = ThemeColors.Background;
        Font = ThemeFonts.Body;
        Padding = new Padding(24);
        FormBorderStyle = FormBorderStyle.FixedDialog;
        MaximizeBox = false;
        MinimizeBox = false;
        AutoScaleMode = AutoScaleMode.Dpi;

        var root = new TableLayoutPanel { Dock = DockStyle.Fill, ColumnCount = 1, RowCount = 4, Margin = Padding.Empty, Padding = Padding.Empty };
        root.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 100));
        root.RowStyles.Add(new RowStyle(SizeType.Absolute, ThemeSizes.PageHeaderHeight));
        root.RowStyles.Add(new RowStyle(SizeType.Absolute, 94));
        root.RowStyles.Add(new RowStyle(SizeType.Absolute, 48));
        root.RowStyles.Add(new RowStyle(SizeType.Absolute, ThemeSizes.DialogActionsHeight));
        Controls.Add(root);

        root.Controls.Add(new PageHeader(Text, chapter == null ? "Create a Chapter for organizing Members." : "Update the Chapter name. Names must remain unique."), 0, 0);

        var field = new TableLayoutPanel { Dock = DockStyle.Fill, ColumnCount = 1, RowCount = 2, Margin = Padding.Empty, Padding = new Padding(0, 0, 0, 8) };
        field.RowStyles.Add(new RowStyle(SizeType.Absolute, ThemeSizes.FieldLabelHeight));
        field.RowStyles.Add(new RowStyle(SizeType.Percent, 100));
        field.Controls.Add(new Label
        {
            Text = "Chapter Name",
            Dock = DockStyle.Fill,
            Font = ThemeFonts.BodyBold,
            ForeColor = ThemeColors.TextPrimary,
            TextAlign = ContentAlignment.MiddleLeft,
            Margin = Padding.Empty
        }, 0, 0);
        _name.Dock = DockStyle.Fill;
        field.Controls.Add(_name, 0, 1);
        root.Controls.Add(field, 0, 1);
        root.Controls.Add(_error, 0, 2);

        var actions = new FlowLayoutPanel { Dock = DockStyle.Fill, FlowDirection = FlowDirection.RightToLeft, WrapContents = false, Padding = new Padding(0, 8, 0, 0), Margin = Padding.Empty };
        var save = new ModernButton { Text = chapter == null ? "Add Chapter" : "Save Changes", Width = 120 };
        var cancel = new ModernButton { Text = "Cancel", Width = 90, ButtonStyle = ModernButtonStyle.Secondary };
        save.Click += (_, _) => Save(save);
        cancel.Click += (_, _) => Close();
        actions.Controls.AddRange(new Control[] { save, cancel });
        root.Controls.Add(actions, 0, 3);
        AcceptButton = save;

        if (chapter != null) _name.TextValue = chapter.ChapterName;
    }

    private void Save(Control button)
    {
        _error.Text = string.Empty;
        var name = ValidationHelper.Clean(_name.TextValue);
        if (name.Length == 0)
        {
            _error.Text = "Chapter Name is required.";
            return;
        }
        if (name.Length > 100)
        {
            _error.Text = "Chapter Name must be 100 characters or fewer.";
            return;
        }

        button.Enabled = false;
        try
        {
            var repository = new ChapterRepository();
            if (_chapter == null) repository.Add(name); else repository.Rename(_chapter.ChapterID, name);
            DialogResult = DialogResult.OK;
            Close();
        }
        catch (SQLiteException ex) when (ex.ResultCode == SQLiteErrorCode.Constraint)
        {
            _error.Text = "A Chapter with this name already exists.";
            button.Enabled = true;
        }
        catch (Exception ex)
        {
            AppLogger.Error("Save Chapter", ex);
            _error.Text = "Could not save the Chapter. " + ex.Message;
            button.Enabled = true;
        }
    }
}
