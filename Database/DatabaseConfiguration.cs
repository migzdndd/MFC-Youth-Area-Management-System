namespace MFCYouthAreaManagementSystem.Database;

public static class DatabaseConfiguration
{
    public static string AppDataDirectory => Path.Combine(
        Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
        "MFCYouthAreaManagementSystem");
    public static string DatabasePath => Path.Combine(AppDataDirectory, "mfcyouth.db");
    public static string LogDirectory => Path.Combine(AppDataDirectory, "Logs");
}
