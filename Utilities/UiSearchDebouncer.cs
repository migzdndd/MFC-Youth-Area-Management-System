using MFCYouthAreaManagementSystem.UI.Controls;

namespace MFCYouthAreaManagementSystem.Utilities;

public static class UiSearchDebouncer
{
    public static void Bind(Form owner, ModernTextBox searchBox, Action action, int delayMilliseconds = 250)
    {
        if (delayMilliseconds < 1) throw new ArgumentOutOfRangeException(nameof(delayMilliseconds));

        var timer = new System.Windows.Forms.Timer { Interval = delayMilliseconds };
        timer.Tick += (_, _) =>
        {
            timer.Stop();
            if (!owner.IsDisposed) action();
        };

        searchBox.TextValueChanged += (_, _) =>
        {
            timer.Stop();
            timer.Start();
        };

        owner.Disposed += (_, _) => timer.Dispose();
    }
}
