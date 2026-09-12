using System.Data.SQLite;
using MFCYouthAreaManagementSystem.Database;
using MFCYouthAreaManagementSystem.Models;
using MFCYouthAreaManagementSystem.Utilities;

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
LEFT JOIN Chapter c ON c.ChapterID = m.ChapterID";

    public List<Member> GetAll() => Search(string.Empty);

    public List<Member> Search(string search, string? status = null, long? chapterId = null)
    {
        var cleanSearch = search.Trim();
        var cleanStatus = string.IsNullOrWhiteSpace(status) ? null : status.Trim();
        using var connection = DatabaseManager.OpenConnection();
        using var command = connection.CreateCommand();
        command.CommandText = SelectBase + @"
WHERE (@Status IS NULL OR m.Status = @Status COLLATE NOCASE)
  AND (@ChapterID IS NULL OR m.ChapterID = @ChapterID)
  AND (
      @Search = '' OR
      m.FirstName LIKE @Like ESCAPE '\' OR
      IFNULL(m.MiddleName, '') LIKE @Like ESCAPE '\' OR
      m.LastName LIKE @Like ESCAPE '\' OR
      TRIM(m.FirstName || ' ' || IFNULL(m.MiddleName || ' ', '') || m.LastName) LIKE @Like ESCAPE '\' OR
      TRIM(m.FirstName || ' ' || m.LastName) LIKE @Like ESCAPE '\' OR
      TRIM(m.LastName || ' ' || m.FirstName || CASE WHEN IFNULL(TRIM(m.MiddleName), '') = '' THEN '' ELSE ' ' || TRIM(m.MiddleName) END) LIKE @Like ESCAPE '\' OR
      IFNULL(c.ChapterName, '') LIKE @Like ESCAPE '\' OR
      m.ContactNumber LIKE @Like ESCAPE '\' OR
      IFNULL(m.EmailAddress, '') LIKE @Like ESCAPE '\' OR
      m.Address LIKE @Like ESCAPE '\' OR
      m.Status LIKE @Like ESCAPE '\' OR
      EXISTS (
          SELECT 1
          FROM MemberService msSearch
          JOIN Service sSearch ON sSearch.ServiceID = msSearch.ServiceID
          WHERE msSearch.MemberID = m.MemberID
            AND sSearch.ServiceName LIKE @Like ESCAPE '\'
      )
  )
ORDER BY m.LastName COLLATE NOCASE, m.FirstName COLLATE NOCASE, m.MemberID;";
        command.Parameters.AddWithValue("@Search", cleanSearch);
        command.Parameters.AddWithValue("@Like", SearchPatternHelper.Contains(cleanSearch));
        command.Parameters.AddWithValue("@Status", cleanStatus is null ? DBNull.Value : cleanStatus);
        command.Parameters.AddWithValue("@ChapterID", chapterId.HasValue ? chapterId.Value : DBNull.Value);
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
     m.FirstName LIKE @Like ESCAPE '\' OR IFNULL(m.MiddleName, '') LIKE @Like ESCAPE '\' OR m.LastName LIKE @Like ESCAPE '\' OR
     TRIM(m.FirstName || ' ' || IFNULL(m.MiddleName || ' ', '') || m.LastName) LIKE @Like ESCAPE '\' OR
     m.ContactNumber LIKE @Like ESCAPE '\' OR IFNULL(m.EmailAddress,'') LIKE @Like ESCAPE '\' OR m.Address LIKE @Like ESCAPE '\' OR
     m.Status LIKE @Like ESCAPE '\' OR
     EXISTS (
         SELECT 1
         FROM MemberService msSearch
         JOIN Service sSearch ON sSearch.ServiceID = msSearch.ServiceID
         WHERE msSearch.MemberID = m.MemberID AND sSearch.ServiceName LIKE @Like ESCAPE '\'
     ))
ORDER BY m.LastName COLLATE NOCASE, m.FirstName COLLATE NOCASE, m.MemberID;";
        command.Parameters.AddWithValue("@ChapterID", chapterId);
        command.Parameters.AddWithValue("@Search", cleanSearch);
        command.Parameters.AddWithValue("@Like", SearchPatternHelper.Contains(cleanSearch));
        return ReadMembers(command);
    }

    public List<Member> GetUnassigned(string search = "")
    {
        var cleanSearch = search.Trim();
        using var connection = DatabaseManager.OpenConnection();
        using var command = connection.CreateCommand();
        command.CommandText = SelectBase + @"
WHERE m.ChapterID IS NULL
AND (@Search = '' OR
     m.FirstName LIKE @Like ESCAPE '\' OR
     IFNULL(m.MiddleName, '') LIKE @Like ESCAPE '\' OR
     m.LastName LIKE @Like ESCAPE '\' OR
     TRIM(m.FirstName || ' ' || IFNULL(m.MiddleName || ' ', '') || m.LastName) LIKE @Like ESCAPE '\' OR
     TRIM(m.FirstName || ' ' || m.LastName) LIKE @Like ESCAPE '\' OR
     m.ContactNumber LIKE @Like ESCAPE '\' OR
     IFNULL(m.EmailAddress, '') LIKE @Like ESCAPE '\' OR
     EXISTS (
         SELECT 1
         FROM MemberService msSearch
         JOIN Service sSearch ON sSearch.ServiceID = msSearch.ServiceID
         WHERE msSearch.MemberID = m.MemberID
           AND sSearch.ServiceName LIKE @Like ESCAPE '\'
     ))
ORDER BY m.LastName COLLATE NOCASE, m.FirstName COLLATE NOCASE, m.MemberID;";
        command.Parameters.AddWithValue("@Search", cleanSearch);
        command.Parameters.AddWithValue("@Like", SearchPatternHelper.Contains(cleanSearch));
        return ReadMembers(command);
    }

    public void AssignUnassignedMembersToChapter(long chapterId, IEnumerable<long> memberIds)
    {
        var ids = memberIds.Distinct().ToArray();
        if (ids.Length == 0)
            throw new InvalidOperationException("Select at least one Member to add.");

        using var connection = DatabaseManager.OpenConnection();
        using var transaction = connection.BeginTransaction();

        using (var chapterCheck = connection.CreateCommand())
        {
            chapterCheck.Transaction = transaction;
            chapterCheck.CommandText = "SELECT EXISTS(SELECT 1 FROM Chapter WHERE ChapterID=@ChapterID);";
            chapterCheck.Parameters.AddWithValue("@ChapterID", chapterId);
            if (Convert.ToInt32(chapterCheck.ExecuteScalar()) != 1)
                throw new InvalidOperationException("The selected Chapter no longer exists.");
        }

        var now = DateTime.UtcNow.ToString("O");
        foreach (var memberId in ids)
        {
            using var update = connection.CreateCommand();
            update.Transaction = transaction;
            update.CommandText = @"
UPDATE Member
SET ChapterID=@ChapterID, UpdatedAt=@Now
WHERE MemberID=@MemberID AND ChapterID IS NULL;";
            update.Parameters.AddWithValue("@ChapterID", chapterId);
            update.Parameters.AddWithValue("@Now", now);
            update.Parameters.AddWithValue("@MemberID", memberId);
            if (update.ExecuteNonQuery() != 1)
                throw new InvalidOperationException("One or more selected Members are no longer unassigned. Refresh the list and try again.");
        }

        transaction.Commit();
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
     m.FirstName LIKE @Like ESCAPE '\' OR IFNULL(m.MiddleName, '') LIKE @Like ESCAPE '\' OR m.LastName LIKE @Like ESCAPE '\' OR
     TRIM(m.FirstName || ' ' || IFNULL(m.MiddleName || ' ', '') || m.LastName) LIKE @Like ESCAPE '\' OR
     IFNULL(c.ChapterName, '') LIKE @Like ESCAPE '\' OR m.ContactNumber LIKE @Like ESCAPE '\' OR IFNULL(m.EmailAddress,'') LIKE @Like ESCAPE '\' OR
     m.Address LIKE @Like ESCAPE '\' OR m.Status LIKE @Like ESCAPE '\')
ORDER BY m.LastName COLLATE NOCASE, m.FirstName COLLATE NOCASE, m.MemberID;";
        command.Parameters.AddWithValue("@ServiceID", serviceId);
        command.Parameters.AddWithValue("@Search", cleanSearch);
        command.Parameters.AddWithValue("@Like", SearchPatternHelper.Contains(cleanSearch));
        return ReadMembers(command);
    }

    public bool ContactNumberExists(string contactNumber, long? excludeMemberId = null)
    {
        var clean = ValidationHelper.Clean(contactNumber);
        if (clean.Length == 0) return false;
        using var connection = DatabaseManager.OpenConnection();
        return ContactNumberExists(connection, clean, excludeMemberId);
    }

    public bool EmailAddressExists(string? emailAddress, long? excludeMemberId = null)
    {
        var clean = ValidationHelper.Clean(emailAddress);
        if (clean.Length == 0) return false;
        using var connection = DatabaseManager.OpenConnection();
        return EmailAddressExists(connection, clean, excludeMemberId);
    }

    public long Add(Member member)
    {
        ValidateForSave(member);
        using var connection = DatabaseManager.OpenConnection();
        EnsureUniqueContactAndEmail(connection, member, null);
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
        ValidateForSave(member);
        using var connection = DatabaseManager.OpenConnection();
        EnsureUniqueContactAndEmail(connection, member, member.MemberID);
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

    private static void ValidateForSave(Member member)
    {
        if (string.IsNullOrWhiteSpace(member.FirstName))
            throw new InvalidOperationException("First Name is required.");
        if (string.IsNullOrWhiteSpace(member.LastName))
            throw new InvalidOperationException("Last Name is required.");
        if (member.BirthDate == default)
            throw new InvalidOperationException("Birth Date is required.");
        if (member.BirthDate.Date > DateTime.Today)
            throw new InvalidOperationException("Birth Date cannot be in the future.");
        if (!ValidationHelper.IsValidContact(member.ContactNumber))
            throw new InvalidOperationException("Contact Number must contain exactly 11 digits.");
        if (!ValidationHelper.IsValidOptionalEmail(member.EmailAddress))
            throw new InvalidOperationException("Enter a valid email address or leave Email blank.");
    }

    private static void EnsureUniqueContactAndEmail(SQLiteConnection connection, Member member, long? excludeMemberId)
    {
        var contact = ValidationHelper.Clean(member.ContactNumber);
        if (ContactNumberExists(connection, contact, excludeMemberId))
            throw new InvalidOperationException("Contact Number is already used by another Member.");

        var email = ValidationHelper.Clean(member.EmailAddress);
        if (email.Length > 0 && EmailAddressExists(connection, email, excludeMemberId))
            throw new InvalidOperationException("Email Address is already used by another Member.");
    }

    private static bool ContactNumberExists(SQLiteConnection connection, string contactNumber, long? excludeMemberId)
    {
        using var command = connection.CreateCommand();
        command.CommandText = @"
SELECT EXISTS(
    SELECT 1
    FROM Member
    WHERE TRIM(ContactNumber) = @Contact
      AND (@ExcludeMemberID IS NULL OR MemberID <> @ExcludeMemberID)
);";
        command.Parameters.AddWithValue("@Contact", contactNumber);
        command.Parameters.AddWithValue("@ExcludeMemberID", excludeMemberId.HasValue ? excludeMemberId.Value : DBNull.Value);
        return Convert.ToInt32(command.ExecuteScalar()) == 1;
    }

    private static bool EmailAddressExists(SQLiteConnection connection, string emailAddress, long? excludeMemberId)
    {
        using var command = connection.CreateCommand();
        command.CommandText = @"
SELECT EXISTS(
    SELECT 1
    FROM Member
    WHERE TRIM(IFNULL(EmailAddress, '')) = @Email COLLATE NOCASE
      AND (@ExcludeMemberID IS NULL OR MemberID <> @ExcludeMemberID)
);";
        command.Parameters.AddWithValue("@Email", emailAddress);
        command.Parameters.AddWithValue("@ExcludeMemberID", excludeMemberId.HasValue ? excludeMemberId.Value : DBNull.Value);
        return Convert.ToInt32(command.ExecuteScalar()) == 1;
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
        command.Parameters.AddWithValue("@ChapterID", member.ChapterID.HasValue ? member.ChapterID.Value : DBNull.Value);
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
        ChapterID = reader["ChapterID"] == DBNull.Value ? null : Convert.ToInt64(reader["ChapterID"]),
        ChapterName = reader["ChapterName"] == DBNull.Value ? string.Empty : Convert.ToString(reader["ChapterName"]) ?? string.Empty,
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
