using MFCYouthAreaManagementSystem.Database;

namespace MFCYouthAreaManagementSystem.Utilities;

public static class AppLogger
{
    public static void Error(string operation, Exception ex)
    {
        try
        {
            Directory.CreateDirectory(DatabaseConfiguration.LogDirectory);
            var path = Path.Combine(DatabaseConfiguration.LogDirectory, $"{DateTime.Now:yyyy-MM-dd}.log");
            File.AppendAllText(path,
                $"[{DateTimeOffset.Now:O}] {operation}{Environment.NewLine}" +
                $"{ex.GetType().FullName}: {ex.Message}{Environment.NewLine}{ex.StackTrace}{Environment.NewLine}{Environment.NewLine}");
        }
        catch { }
    }
}
