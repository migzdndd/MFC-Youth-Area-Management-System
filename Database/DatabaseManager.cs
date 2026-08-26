using System.Data.SQLite;

namespace MFCYouthAreaManagementSystem.Database;

public static class DatabaseManager
{
    public static SQLiteConnection OpenConnection()
    {
        Directory.CreateDirectory(DatabaseConfiguration.AppDataDirectory);
        var cs = $"Data Source={DatabaseConfiguration.DatabasePath};Version=3;";
        var connection = new SQLiteConnection(cs);
        connection.Open();
        using var command = connection.CreateCommand();
        command.CommandText = "PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;";
        command.ExecuteNonQuery();
        return connection;
    }
}
