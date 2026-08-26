using MFCYouthAreaManagementSystem.UI.Theme;

namespace MFCYouthAreaManagementSystem.UI.Controls;

public static class ToastNotification
{
    public static void Show(Form owner, string message, bool error = false)
    {
        if (owner.IsDisposed || !owner.IsHandleCreated) return;

        var toast = new Form
        {
            FormBorderStyle = FormBorderStyle.None,
            ShowInTaskbar = false,
            StartPosition = FormStartPosition.Manual,
            Size = new Size(330, 64),
            BackColor = error ? ThemeColors.Danger : ThemeColors.Success,
            TopMost = true,
            AutoScaleMode = AutoScaleMode.Dpi,
            Font = ThemeFonts.Body
        };
        toast.Controls.Add(new Label
        {
            Text = message,
            Dock = DockStyle.Fill,
            ForeColor = Color.White,
            Font = ThemeFonts.BodyBold,
            TextAlign = ContentAlignment.MiddleCenter,
            Padding = new Padding(10),
            AutoEllipsis = true
        });

        var screen = Screen.FromControl(owner).WorkingArea;
        toast.Location = new Point(screen.Right - toast.Width - 20, screen.Bottom - toast.Height - 20);

        var timer = new System.Windows.Forms.Timer { Interval = 2200 };
        timer.Tick += (_, _) =>
        {
            timer.Stop();
            if (!toast.IsDisposed) toast.Close();
        };
        toast.FormClosed += (_, _) => timer.Dispose();
        toast.Shown += (_, _) => timer.Start();
        toast.Show(owner);
    }
}
