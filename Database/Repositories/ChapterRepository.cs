using MFCYouthAreaManagementSystem.Database;
using MFCYouthAreaManagementSystem.Models;
using MFCYouthAreaManagementSystem.Utilities;

namespace MFCYouthAreaManagementSystem.Repositories;

public sealed class ChapterRepository
{
    public List<Chapter> GetAll(string search = "")
    {
        var cleanSearch = search.Trim();
        using var connection = DatabaseManager.OpenConnection();
        using var command = connection.CreateCommand();
        command.CommandText = @"
SELECT c.ChapterID,
       c.ChapterName,
       COUNT(m.MemberID) AS MemberCount,
       SUM(CASE
               WHEN LOWER(TRIM(IFNULL(m.Status, ''))) = 'active' THEN 1
               ELSE 0
           END) AS ActiveMemberCount
FROM Chapter c
LEFT JOIN Member m ON m.ChapterID = c.ChapterID
WHERE @Search='' OR c.ChapterName LIKE @Like ESCAPE '\'
GROUP BY c.ChapterID, c.ChapterName
ORDER BY c.ChapterName COLLATE NOCASE, c.ChapterID;";
        command.Parameters.AddWithValue("@Search", cleanSearch);
        command.Parameters.AddWithValue("@Like", SearchPatternHelper.Contains(cleanSearch));
        using var reader = command.ExecuteReader();
        var result = new List<Chapter>();
        while (reader.Read()) result.Add(Map(reader));
        return result;
    }

    public Chapter? GetById(long id)
    {
        using var connection = DatabaseManager.OpenConnection();
        using var command = connection.CreateCommand();
        command.CommandText = @"
SELECT c.ChapterID,
       c.ChapterName,
       COUNT(m.MemberID) AS MemberCount,
       SUM(CASE
               WHEN LOWER(TRIM(IFNULL(m.Status, ''))) = 'active' THEN 1
               ELSE 0
           END) AS ActiveMemberCount
FROM Chapter c
LEFT JOIN Member m ON m.ChapterID = c.ChapterID
WHERE c.ChapterID = @Id
GROUP BY c.ChapterID, c.ChapterName;";
        command.Parameters.AddWithValue("@Id", id);
        using var reader = command.ExecuteReader();
        return reader.Read() ? Map(reader) : null;
    }

    public long Add(string name)
    {
        using var connection = DatabaseManager.OpenConnection();
        using var command = connection.CreateCommand();
        command.CommandText = "INSERT INTO Chapter(ChapterName) VALUES(@Name); SELECT last_insert_rowid();";
        command.Parameters.AddWithValue("@Name", name.Trim());
        return Convert.ToInt64(command.ExecuteScalar());
    }

    public void Rename(long id, string name)
    {
        var cleanName = name.Trim();
        using var connection = DatabaseManager.OpenConnection();
        using var transaction = connection.BeginTransaction();

        using (var rename = connection.CreateCommand())
        {
            rename.Transaction = transaction;
            rename.CommandText = "UPDATE Chapter SET ChapterName=@Name WHERE ChapterID=@Id;";
            rename.Parameters.AddWithValue("@Name", cleanName);
            rename.Parameters.AddWithValue("@Id", id);
            if (rename.ExecuteNonQuery() != 1) throw new InvalidOperationException("Chapter was not found.");
        }

        // Keep the stored historical label synchronized while records are still
        // linked to this Chapter. If the Chapter is later deleted, the latest
        // visible Chapter name is retained instead of reverting to an older name.
        using (var reports = connection.CreateCommand())
        {
            reports.Transaction = transaction;
            reports.CommandText = "UPDATE ActivityReport SET ChapterNameSnapshot=@Name WHERE ChapterID=@Id;";
            reports.Parameters.AddWithValue("@Name", cleanName);
            reports.Parameters.AddWithValue("@Id", id);
            reports.ExecuteNonQuery();
        }

        using (var participants = connection.CreateCommand())
        {
            participants.Transaction = transaction;
            participants.CommandText = "UPDATE EventParticipant SET ChapterNameSnapshot=@Name WHERE ChapterID=@Id;";
            participants.Parameters.AddWithValue("@Name", cleanName);
            participants.Parameters.AddWithValue("@Id", id);
            participants.ExecuteNonQuery();
        }

        transaction.Commit();
    }

    public int GetMemberCount(long id)
    {
        using var connection = DatabaseManager.OpenConnection();
        using var command = connection.CreateCommand();
        command.CommandText = "SELECT COUNT(*) FROM Member WHERE ChapterID=@Id;";
        command.Parameters.AddWithValue("@Id", id);
        return Convert.ToInt32(command.ExecuteScalar());
    }

    public void Delete(long id)
    {
        using var connection = DatabaseManager.OpenConnection();
        using var transaction = connection.BeginTransaction();

        using (var count = connection.CreateCommand())
        {
            count.Transaction = transaction;
            count.CommandText = "SELECT COUNT(*) FROM Member WHERE ChapterID=@Id;";
            count.Parameters.AddWithValue("@Id", id);
            if (Convert.ToInt32(count.ExecuteScalar()) > 0)
                throw new InvalidOperationException("This Chapter still has Members assigned. Move them to another Chapter before deleting it.");
        }

        // Historical records must survive Chapter deletion. Explicitly detach them first
        // instead of relying only on the FK action so upgraded databases are safe as well.
        using (var detachReports = connection.CreateCommand())
        {
            detachReports.Transaction = transaction;
            detachReports.CommandText = @"
UPDATE ActivityReport
SET ChapterNameSnapshot = COALESCE(NULLIF(TRIM(ChapterNameSnapshot), ''),
        (SELECT ChapterName FROM Chapter WHERE ChapterID=@Id), 'Deleted Chapter'),
    ChapterID = NULL
WHERE ChapterID=@Id;";
            detachReports.Parameters.AddWithValue("@Id", id);
            detachReports.ExecuteNonQuery();
        }

        using (var detachParticipants = connection.CreateCommand())
        {
            detachParticipants.Transaction = transaction;
            detachParticipants.CommandText = @"
UPDATE EventParticipant
SET ChapterNameSnapshot = COALESCE(NULLIF(TRIM(ChapterNameSnapshot), ''),
        (SELECT ChapterName FROM Chapter WHERE ChapterID=@Id), 'Deleted Chapter'),
    ChapterID = NULL
WHERE ChapterID=@Id;";
            detachParticipants.Parameters.AddWithValue("@Id", id);
            detachParticipants.ExecuteNonQuery();
        }

        using (var delete = connection.CreateCommand())
        {
            delete.Transaction = transaction;
            delete.CommandText = "DELETE FROM Chapter WHERE ChapterID=@Id;";
            delete.Parameters.AddWithValue("@Id", id);
            if (delete.ExecuteNonQuery() != 1) throw new InvalidOperationException("Chapter was not found.");
        }

        transaction.Commit();
    }

    public int GetTotalCount()
    {
        using var connection = DatabaseManager.OpenConnection();
        using var command = connection.CreateCommand();
        command.CommandText = "SELECT COUNT(*) FROM Chapter;";
        return Convert.ToInt32(command.ExecuteScalar());
    }

    private static Chapter Map(System.Data.SQLite.SQLiteDataReader reader) => new()
    {
        ChapterID = Convert.ToInt64(reader["ChapterID"]),
        ChapterName = Convert.ToString(reader["ChapterName"]) ?? string.Empty,
        MemberCount = Convert.ToInt32(reader["MemberCount"]),
        ActiveMemberCount = Convert.ToInt32(reader["ActiveMemberCount"])
    };
}
