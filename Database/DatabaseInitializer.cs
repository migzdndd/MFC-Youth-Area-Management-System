using System;
using System.Data.SQLite;
using System.IO;
using System.Windows.Forms;

namespace MFC_Youth_Database.Database
{
    public static class DatabaseInitializer
    {
        private static readonly string AppFolder =
            Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                "MFC Youth Database");

        private static readonly string DatabaseFile =
            Path.Combine(AppFolder, "MFCYouth.db");

        private const string SchemaFile =
            "Scripts\\SQLiteSchema.sql";

        public static void Initialize()
        {
            Directory.CreateDirectory(AppFolder);

            bool newDatabase = !File.Exists(DatabaseFile);

            if (newDatabase)
            {
                SQLiteConnection.CreateFile(DatabaseFile);
                ExecuteSchema();
            }

            UpdateDatabase();
        }

        private static void ExecuteSchema()
        {
            try
            {
                string sql = File.ReadAllText(SchemaFile);

                using (SQLiteConnection conn =
                    new SQLiteConnection(
                        $"Data Source={DatabaseFile};Version=3;"))
                {
                    conn.Open();

                    SQLiteCommand cmd =
                        new SQLiteCommand(sql, conn);

                    cmd.ExecuteNonQuery();
                }
            }
            catch (Exception ex)
            {
                MessageBox.Show(
                    ex.ToString(),
                    "Schema Error");
            }
        }

        private static void UpdateDatabase()
        {
            using (SQLiteConnection conn = DatabaseManager.GetConnection())
            {
                conn.Open();

                string query = @"
            CREATE TABLE IF NOT EXISTS Report
            (
                ReportID INTEGER PRIMARY KEY AUTOINCREMENT,

                Title TEXT NOT NULL,
                ChapterID INTEGER NOT NULL,
                ReportType TEXT NOT NULL,
                Activity TEXT,
                ReportDate TEXT NOT NULL,
                PreparedBy TEXT,
                Description TEXT NOT NULL,
                CreatedAt TEXT DEFAULT CURRENT_TIMESTAMP,

                FOREIGN KEY (ChapterID)
                    REFERENCES Chapter(ChapterID)
            );";

                using (SQLiteCommand cmd = new SQLiteCommand(query, conn))
                {
                    cmd.ExecuteNonQuery();
                }
            }
        }
    }
}