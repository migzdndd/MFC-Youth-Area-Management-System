using System.Windows;
using MFCYouthAreaManagementSystem.Database;
using MFCYouthAreaManagementSystem.Utilities;
using MFCYouthAreaManagementSystem.Views;

namespace MFCYouthAreaManagementSystem;

public partial class App : Application
{
    private void Application_Startup(object sender, StartupEventArgs e)
    {
        Current.DispatcherUnhandledException += (s, args) =>
        {
            AppLogger.Error("Unhandled UI exception", args.Exception);
            MessageBox.Show(
                "An unexpected error occurred while the application was running.\n\n" +
                "The error was logged. If the current screen behaves unexpectedly, close and reopen the application before making more changes.",
                ApplicationConstants.AppName,
                MessageBoxButton.OK,
                MessageBoxImage.Error);
            args.Handled = true;
        };

        AppDomain.CurrentDomain.UnhandledException += (s, args) =>
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
                MessageBoxButton.OK,
                MessageBoxImage.Error);
            Shutdown();
            return;
        }

        var mainWindow = new MainWindow();
        mainWindow.Show();
    }
}
