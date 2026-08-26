using MFCYouthAreaManagementSystem.UI.Theme;

namespace MFCYouthAreaManagementSystem.UI.Controls;

public sealed class CustomDialog : Form
{
    private bool _result;

    private CustomDialog(string title, string message, bool confirm, string actionText, bool danger)
    {
        Text = title;
        FormBorderStyle = FormBorderStyle.FixedDialog;
        StartPosition = FormStartPosition.CenterParent;
        Size = new Size(500, 300);
        MinimumSize = new Size(460, 270);
        MaximizeBox = false;
        MinimizeBox = false;
        ShowInTaskbar = false;
        BackColor = ThemeColors.Surface;
        Font = ThemeFonts.Body;
        Padding = new Padding(24);
        AutoScaleMode = AutoScaleMode.Dpi;

        var root = new TableLayoutPanel
        {
            Dock = DockStyle.Fill,
            ColumnCount = 1,
            RowCount = 3,
            Margin = Padding.Empty,
            Padding = Padding.Empty
        };
        root.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 100));
        root.RowStyles.Add(new RowStyle(SizeType.Absolute, 54));
        root.RowStyles.Add(new RowStyle(SizeType.Percent, 100));
        root.RowStyles.Add(new RowStyle(SizeType.Absolute, ThemeSizes.DialogActionsHeight));
        Controls.Add(root);

        root.Controls.Add(new Label
        {
            Text = title,
            Dock = DockStyle.Fill,
            Font = ThemeFonts.SectionTitle,
            ForeColor = ThemeColors.TextPrimary,
            TextAlign = ContentAlignment.MiddleLeft,
            AutoEllipsis = true,
            Margin = Padding.Empty
        }, 0, 0);

        root.Controls.Add(new Label
        {
            Text = message,
            Dock = DockStyle.Fill,
            Font = ThemeFonts.Body,
            ForeColor = ThemeColors.TextSecondary,
            TextAlign = ContentAlignment.TopLeft,
            AutoEllipsis = false,
            Margin = Padding.Empty,
            Padding = new Padding(0, 6, 0, 6)
        }, 0, 1);

        var actions = new FlowLayoutPanel
        {
            Dock = DockStyle.Fill,
            FlowDirection = FlowDirection.RightToLeft,
            WrapContents = false,
            Padding = new Padding(0, 10, 0, 4),
            Margin = Padding.Empty
        };
        var ok = new ModernButton
        {
            Text = actionText,
            Width = 130,
            ButtonStyle = danger ? ModernButtonStyle.Danger : ModernButtonStyle.Primary
        };
        ok.Click += (_, _) =>
        {
            _result = true;
            DialogResult = DialogResult.OK;
            Close();
        };
        actions.Controls.Add(ok);
        AcceptButton = ok;

        if (confirm)
        {
            var cancel = new ModernButton { Text = "Cancel", Width = 100, ButtonStyle = ModernButtonStyle.Secondary };
            cancel.Click += (_, _) =>
            {
                DialogResult = DialogResult.Cancel;
                Close();
            };
            actions.Controls.Add(cancel);
            CancelButton = cancel;
        }

        root.Controls.Add(actions, 0, 2);
    }

    public static bool Confirm(IWin32Window owner, string title, string message, string actionText = "Confirm", bool danger = false)
    {
        using var dialog = new CustomDialog(title, message, true, actionText, danger);
        dialog.ShowDialog(owner);
        return dialog._result;
    }

    public static void Show(IWin32Window owner, string title, string message, bool error = false)
    {
        using var dialog = new CustomDialog(title, message, false, "Close", error);
        dialog.ShowDialog(owner);
    }
}
