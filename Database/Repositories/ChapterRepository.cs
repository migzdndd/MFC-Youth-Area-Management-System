using MFCYouthAreaManagementSystem.Database;
using MFCYouthAreaManagementSystem.Models;

namespace MFCYouthAreaManagementSystem.Repositories;

public sealed class ChapterRepository
{
    public List<Chapter> GetAll(string search = "")
    {
        var cleanSearch = search.Trim();
        using var connection = DatabaseManager.OpenConnection();
        using var command = connection.CreateCommand();
        command.CommandText = @"
SELECT c.ChapterID, c.ChapterName, COUNT(m.MemberID) AS MemberCount
FROM Chapter c
LEFT JOIN Member m ON m.ChapterID = c.ChapterID
WHERE @Search='' OR c.ChapterName LIKE @Like
GROUP BY c.ChapterID, c.ChapterName
ORDER BY c.ChapterName COLLATE NOCASE, c.ChapterID;";
        command.Parameters.AddWithValue("@Search", cleanSearch);
        command.Parameters.AddWithValue("@Like", $"%{cleanSearch}%");
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
SELECT c.ChapterID, c.ChapterName, COUNT(m.MemberID) AS MemberCount
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
        using var connection = DatabaseManager.OpenConnection();
        using var command = connection.CreateCommand();
        command.CommandText = "UPDATE Chapter SET ChapterName=@Name WHERE ChapterID=@Id;";
        command.Parameters.AddWithValue("@Name", name.Trim());
        command.Parameters.AddWithValue("@Id", id);
        if (command.ExecuteNonQuery() != 1) throw new InvalidOperationException("Chapter was not found.");
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
        MemberCount = Convert.ToInt32(reader["MemberCount"])
    };
}
