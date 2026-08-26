using System.Data.SQLite;
using MFCYouthAreaManagementSystem.Database;
using MFCYouthAreaManagementSystem.Models;

namespace MFCYouthAreaManagementSystem.Repositories;

public sealed class MemberRepository
{
    private const string SelectBase = @"
SELECT m.MemberID, m.LastName, m.FirstName, m.MiddleName, m.BirthDate,
       m.ContactNumber, m.Address, m.EmailAddress, m.Status, m.ChapterID,
       c.ChapterName,
       COALESCE((
           SELECT GROUP_CONCAT(ordered.ServiceName, ', ')
           FROM (
               SELECT s2.ServiceName
               FROM MemberService ms2
               JOIN Service s2 ON s2.ServiceID = ms2.ServiceID
               WHERE ms2.MemberID = m.MemberID
               ORDER BY s2.DisplayOrder, s2.ServiceName COLLATE NOCASE
           ) AS ordered
       ), 'No Service Assigned') AS Services
FROM Member m
JOIN Chapter c ON c.ChapterID = m.ChapterID";

    public List<Member> GetAll() => Search(string.Empty);

    public List<Member> Search(string search)
    {
        var cleanSearch = search.Trim();
        using var connection = DatabaseManager.OpenConnection();
        using var command = connection.CreateCommand();
        command.CommandText = SelectBase + @"
WHERE @Search = '' OR
      m.FirstName LIKE @Like OR IFNULL(m.MiddleName, '') LIKE @Like OR m.LastName LIKE @Like OR
      TRIM(m.FirstName || ' ' || IFNULL(m.MiddleName || ' ', '') || m.LastName) LIKE @Like OR
      c.ChapterName LIKE @Like OR m.ContactNumber LIKE @Like OR IFNULL(m.EmailAddress, '') LIKE @Like OR
      m.Address LIKE @Like OR m.Status LIKE @Like OR
      EXISTS (
          SELECT 1
          FROM MemberService msSearch
          JOIN Service sSearch ON sSearch.ServiceID = msSearch.ServiceID
          WHERE msSearch.MemberID = m.MemberID AND sSearch.ServiceName LIKE @Like
      )
ORDER BY m.LastName COLLATE NOCASE, m.FirstName COLLATE NOCASE, m.MemberID;";
        command.Parameters.AddWithValue("@Search", cleanSearch);
        command.Parameters.AddWithValue("@Like", $"%{cleanSearch}%");
        return ReadMembers(command);
    }

    public Member? GetById(long memberId)
    {
        using var connection = DatabaseManager.OpenConnection();
        using var command = connection.CreateCommand();
        command.CommandText = SelectBase + @"
WHERE m.MemberID = @MemberID;";
        command.Parameters.AddWithValue("@MemberID", memberId);
        using var reader = command.ExecuteReader();
        return reader.Read() ? Map(reader) : null;
    }

    public List<Member> GetByChapter(long chapterId, string search = "")
    {
        var cleanSearch = search.Trim();
        using var connection = DatabaseManager.OpenConnection();
        using var command = connection.CreateCommand();
        command.CommandText = SelectBase + @"
WHERE m.ChapterID = @ChapterID
AND (@Search = '' OR
     m.FirstName LIKE @Like OR IFNULL(m.MiddleName, '') LIKE @Like OR m.LastName LIKE @Like OR
     TRIM(m.FirstName || ' ' || IFNULL(m.MiddleName || ' ', '') || m.LastName) LIKE @Like OR
     m.ContactNumber LIKE @Like OR IFNULL(m.EmailAddress,'') LIKE @Like OR m.Address LIKE @Like OR
     m.Status LIKE @Like OR
     EXISTS (
         SELECT 1
         FROM MemberService msSearch
         JOIN Service sSearch ON sSearch.ServiceID = msSearch.ServiceID
         WHERE msSearch.MemberID = m.MemberID AND sSearch.ServiceName LIKE @Like
     ))
ORDER BY m.LastName COLLATE NOCASE, m.FirstName COLLATE NOCASE, m.MemberID;";
        command.Parameters.AddWithValue("@ChapterID", chapterId);
        command.Parameters.AddWithValue("@Search", cleanSearch);
        command.Parameters.AddWithValue("@Like", $"%{cleanSearch}%");
        return ReadMembers(command);
    }

    public List<Member> GetByService(long serviceId, string search = "")
    {
        var cleanSearch = search.Trim();
        using var connection = DatabaseManager.OpenConnection();
        using var command = connection.CreateCommand();
        command.CommandText = SelectBase + @"
WHERE EXISTS (
    SELECT 1 FROM MemberService assigned
    WHERE assigned.MemberID = m.MemberID AND assigned.ServiceID = @ServiceID
)
AND (@Search = '' OR
     m.FirstName LIKE @Like OR IFNULL(m.MiddleName, '') LIKE @Like OR m.LastName LIKE @Like OR
     TRIM(m.FirstName || ' ' || IFNULL(m.MiddleName || ' ', '') || m.LastName) LIKE @Like OR
     c.ChapterName LIKE @Like OR m.ContactNumber LIKE @Like OR IFNULL(m.EmailAddress,'') LIKE @Like OR
     m.Address LIKE @Like OR m.Status LIKE @Like)
ORDER BY m.LastName COLLATE NOCASE, m.FirstName COLLATE NOCASE, m.MemberID;";
        command.Parameters.AddWithValue("@ServiceID", serviceId);
        command.Parameters.AddWithValue("@Search", cleanSearch);
        command.Parameters.AddWithValue("@Like", $"%{cleanSearch}%");
        return ReadMembers(command);
    }

    public long Add(Member member)
    {
        using var connection = DatabaseManager.OpenConnection();
        using var command = connection.CreateCommand();
        command.CommandText = @"
INSERT INTO Member(LastName, FirstName, MiddleName, BirthDate, ContactNumber, Address, EmailAddress, Status, ChapterID, CreatedAt, UpdatedAt)
VALUES(@LastName,@FirstName,@MiddleName,@BirthDate,@Contact,@Address,@Email,@Status,@ChapterID,@Now,@Now);
SELECT last_insert_rowid();";
        AddParameters(command, member);
        command.Parameters.AddWithValue("@Now", DateTime.UtcNow.ToString("O"));
        return Convert.ToInt64(command.ExecuteScalar());
    }

    public void Update(Member member)
    {
        using var connection = DatabaseManager.OpenConnection();
        using var command = connection.CreateCommand();
        command.CommandText = @"
UPDATE Member SET LastName=@LastName, FirstName=@FirstName, MiddleName=@MiddleName, BirthDate=@BirthDate,
ContactNumber=@Contact, Address=@Address, EmailAddress=@Email, Status=@Status, ChapterID=@ChapterID, UpdatedAt=@Now
WHERE MemberID=@MemberID;";
        AddParameters(command, member);
        command.Parameters.AddWithValue("@Now", DateTime.UtcNow.ToString("O"));
        command.Parameters.AddWithValue("@MemberID", member.MemberID);
        if (command.ExecuteNonQuery() != 1)
            throw new InvalidOperationException("Member was not found or could not be updated.");
    }

    public void Delete(long memberId)
    {
        using var connection = DatabaseManager.OpenConnection();
        using var command = connection.CreateCommand();
        command.CommandText = "DELETE FROM Member WHERE MemberID=@MemberID;";
        command.Parameters.AddWithValue("@MemberID", memberId);
        if (command.ExecuteNonQuery() != 1)
            throw new InvalidOperationException("Member was not found or could not be deleted.");
    }

    public int GetTotalCount()
    {
        using var connection = DatabaseManager.OpenConnection();
        using var command = connection.CreateCommand();
        command.CommandText = "SELECT COUNT(*) FROM Member;";
        return Convert.ToInt32(command.ExecuteScalar());
    }

    private static List<Member> ReadMembers(SQLiteCommand command)
    {
        using var reader = command.ExecuteReader();
        var result = new List<Member>();
        while (reader.Read()) result.Add(Map(reader));
        return result;
    }

    private static void AddParameters(SQLiteCommand command, Member member)
    {
        command.Parameters.AddWithValue("@LastName", member.LastName.Trim());
        command.Parameters.AddWithValue("@FirstName", member.FirstName.Trim());
        command.Parameters.AddWithValue("@MiddleName", string.IsNullOrWhiteSpace(member.MiddleName) ? DBNull.Value : member.MiddleName.Trim());
        command.Parameters.AddWithValue("@BirthDate", member.BirthDate.ToString("yyyy-MM-dd", System.Globalization.CultureInfo.InvariantCulture));
        command.Parameters.AddWithValue("@Contact", member.ContactNumber.Trim());
        command.Parameters.AddWithValue("@Address", member.Address.Trim());
        command.Parameters.AddWithValue("@Email", string.IsNullOrWhiteSpace(member.EmailAddress) ? DBNull.Value : member.EmailAddress.Trim());
        command.Parameters.AddWithValue("@Status", member.Status.Trim());
        command.Parameters.AddWithValue("@ChapterID", member.ChapterID);
    }

    private static Member Map(SQLiteDataReader reader) => new()
    {
        MemberID = Convert.ToInt64(reader["MemberID"]),
        LastName = Convert.ToString(reader["LastName"]) ?? string.Empty,
        FirstName = Convert.ToString(reader["FirstName"]) ?? string.Empty,
        MiddleName = reader["MiddleName"] == DBNull.Value ? null : Convert.ToString(reader["MiddleName"]),
        BirthDate = ParseDate(reader["BirthDate"]),
        ContactNumber = Convert.ToString(reader["ContactNumber"]) ?? string.Empty,
        Address = Convert.ToString(reader["Address"]) ?? string.Empty,
        EmailAddress = reader["EmailAddress"] == DBNull.Value ? null : Convert.ToString(reader["EmailAddress"]),
        Status = Convert.ToString(reader["Status"]) ?? string.Empty,
        ChapterID = Convert.ToInt64(reader["ChapterID"]),
        ChapterName = Convert.ToString(reader["ChapterName"]) ?? string.Empty,
        Services = Convert.ToString(reader["Services"]) ?? "No Service Assigned"
    };

    private static DateTime ParseDate(object value)
    {
        var text = Convert.ToString(value) ?? string.Empty;
        if (DateTime.TryParseExact(text, "yyyy-MM-dd", System.Globalization.CultureInfo.InvariantCulture,
                System.Globalization.DateTimeStyles.None, out var parsed))
            return parsed;
        if (DateTime.TryParse(text, out parsed)) return parsed.Date;
        throw new FormatException($"Invalid stored member date: '{text}'.");
    }
}
