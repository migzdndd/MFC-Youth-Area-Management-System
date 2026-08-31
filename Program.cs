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
        Application.SetUnhandledExceptionMode(UnhandledExceptionMode.CatchException);
        Application.ThreadException += (_, args) => HandleUiException(args.Exception);
        AppDomain.CurrentDomain.UnhandledException += (_, args) =>
        {
            if (args.ExceptionObject is Exception ex)
                AppLogger.Error("Unhandled non-UI exception", ex);
        };

        try
        {
            DatabaseInitializer.Initialize();
        }
        catch (Exception ex)
        {
            AppLogger.Error("Database initialization", ex);
            MessageBox.Show(
                "The application could not start because the local database could not be initialized safely.\n\n" +
                "Your existing database was not deleted or replaced. Technical details were written to the local log when possible.",
                ApplicationConstants.AppName,
                MessageBoxButtons.OK,
                MessageBoxIcon.Error);
            return;
        }

        try
        {
            Application.Run(new Dashboard());
        }
        catch (Exception ex)
        {
            AppLogger.Error("Application runtime", ex);
            MessageBox.Show(
                "The application encountered an unexpected error and had to close.\n\n" +
                "Your local database was not intentionally deleted or replaced. Technical details were written to the local log when possible.",
                ApplicationConstants.AppName,
                MessageBoxButtons.OK,
                MessageBoxIcon.Error);
        }
    }

    private static void HandleUiException(Exception ex)
    {
        AppLogger.Error("Unhandled UI exception", ex);
        MessageBox.Show(
            "An unexpected error occurred while the application was running.\n\n" +
            "The error was logged. If the current screen behaves unexpectedly, close and reopen the application before making more changes.",
            ApplicationConstants.AppName,
            MessageBoxButtons.OK,
            MessageBoxIcon.Error);
    }
}
