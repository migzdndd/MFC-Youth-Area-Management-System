using System.Data.SQLite;
using MFCYouthAreaManagementSystem.Utilities;

namespace MFCYouthAreaManagementSystem.Database;

public static class DatabaseInitializer
{
    public static void Initialize()
    {
        Directory.CreateDirectory(DatabaseConfiguration.AppDataDirectory);
        Directory.CreateDirectory(DatabaseConfiguration.LogDirectory);
        using var connection = DatabaseManager.OpenConnection();
        DatabaseMigrator.Apply(connection);
        SeedServices(connection);
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
