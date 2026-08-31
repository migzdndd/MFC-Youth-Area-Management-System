using MFCYouthAreaManagementSystem.Database;

namespace MFCYouthAreaManagementSystem.Utilities;

public static class AppLogger
{
    private static readonly object Sync = new();

    public static void Error(string operation, Exception ex)
    {
        try
        {
            Directory.CreateDirectory(DatabaseConfiguration.LogDirectory);
            var path = Path.Combine(DatabaseConfiguration.LogDirectory, $"{DateTime.Now:yyyy-MM-dd}.log");
            var entry =
                $"[{DateTimeOffset.Now:O}] {operation}{Environment.NewLine}" +
                $"{ex}{Environment.NewLine}{Environment.NewLine}";

            lock (Sync)
            {
                File.AppendAllText(path, entry);
            }
        }
        catch
        {
            // Logging must never cause a second application failure.
        }
    }
}
