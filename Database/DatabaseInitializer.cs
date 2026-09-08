using System.Data.SQLite;
using MFCYouthAreaManagementSystem.Utilities;

namespace MFCYouthAreaManagementSystem.Database;

public static class DatabaseInitializer
{
    public static void Initialize()
    {
        MigrateLegacyDatabaseIfNeeded();
        Directory.CreateDirectory(DatabaseConfiguration.AppDataDirectory);
        Directory.CreateDirectory(DatabaseConfiguration.LogDirectory);
        using var connection = DatabaseManager.OpenConnection();
        VerifyIntegrity(connection);
        DatabaseMigrator.Apply(connection);
        VerifyForeignKeys(connection);
        SeedServices(connection);
    }


    private static void MigrateLegacyDatabaseIfNeeded()
    {
        // Preserve the v1 database location used by early public-beta builds.
        // Never replace an existing current database.
        if (File.Exists(DatabaseConfiguration.DatabasePath))
            return;

        var localAppData = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
        var legacyDatabasePath = Path.Combine(localAppData, "MFC Youth Database", "MFCYouth.db");

        if (!File.Exists(legacyDatabasePath))
            return;

        Directory.CreateDirectory(DatabaseConfiguration.AppDataDirectory);
        File.Copy(legacyDatabasePath, DatabaseConfiguration.DatabasePath, overwrite: false);
    }

    private static void VerifyIntegrity(SQLiteConnection connection)
    {
        using var command = connection.CreateCommand();
        command.CommandText = "PRAGMA quick_check;";
        using var reader = command.ExecuteReader();
        var errors = new List<string>();
        while (reader.Read())
        {
            var result = Convert.ToString(reader[0]) ?? string.Empty;
            if (string.Equals(result, "ok", StringComparison.OrdinalIgnoreCase)) continue;
            if (result.Length > 0) errors.Add(result);
            if (errors.Count >= 5) break;
        }

        if (errors.Count > 0)
            throw new InvalidOperationException(
                "The local database failed an integrity check. No migration was attempted. " +
                "Restore a known-good backup before continuing. Details: " + string.Join(" | ", errors));
    }

    private static void VerifyForeignKeys(SQLiteConnection connection)
    {
        using var command = connection.CreateCommand();
        command.CommandText = "PRAGMA foreign_key_check;";
        using var reader = command.ExecuteReader();
        var violations = new List<string>();
        while (reader.Read())
        {
            violations.Add($"{reader[0]} row {reader[1]} references {reader[2]}");
            if (violations.Count >= 5) break;
        }

        if (violations.Count > 0)
            throw new InvalidOperationException(
                "The local database contains broken record relationships and cannot be opened safely. " +
                "Details: " + string.Join(" | ", violations));
    }

    private static void SeedServices(SQLiteConnection connection)
    {
        using var tx = connection.BeginTransaction();
        for (var i = 0; i < ApplicationConstants.DefaultServices.Length; i++)
        {
            using var command = connection.CreateCommand();
            command.Transaction = tx;
            command.CommandText = @"
INSERT INTO Service(ServiceName, DisplayOrder)
SELECT @Name, @Order
WHERE NOT EXISTS (SELECT 1 FROM Service WHERE ServiceName = @Name COLLATE NOCASE);
UPDATE Service SET DisplayOrder = @Order WHERE ServiceName = @Name COLLATE NOCASE;";
            command.Parameters.AddWithValue("@Name", ApplicationConstants.DefaultServices[i]);
            command.Parameters.AddWithValue("@Order", i + 1);
            command.ExecuteNonQuery();
        }
        tx.Commit();
    }
}
