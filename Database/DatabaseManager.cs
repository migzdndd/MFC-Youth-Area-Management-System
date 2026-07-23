using System;
using System.Data.SQLite;
using System.IO;

namespace MFC_Youth_Database.Database
{
    public static class DatabaseManager
    {
        private static readonly string DatabasePath =
            Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                "MFC Youth Database",
                "MFCYouth.db");

        private static readonly string ConnectionString =
            $"Data Source={DatabasePath};Version=3;";

        public static SQLiteConnection GetConnection()
        {
            return new SQLiteConnection(ConnectionString);
        }
    }
}