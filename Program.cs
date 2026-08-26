using MFCYouthAreaManagementSystem.Database;
using MFCYouthAreaManagementSystem.Forms;
using MFCYouthAreaManagementSystem.Utilities;

namespace MFCYouthAreaManagementSystem;

internal static class Program
{
    [STAThread]
    static void Main()
    {
        ApplicationConfiguration.Initialize();
        try
        {
            DatabaseInitializer.Initialize();
            Application.Run(new Dashboard());
        }
        catch (Exception ex)
        {
            AppLogger.Error("Application startup", ex);
            MessageBox.Show(
                "The application could not start because the local database could not be initialized.\n\n" +
                "Your existing database was not deleted or replaced. Technical details were written to the local log when possible.",
                "MFC Youth Area Management System",
                MessageBoxButtons.OK,
                MessageBoxIcon.Error);
        }
    }
}
