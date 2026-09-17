using System.Data.SQLite;
using MFCYouthAreaManagementSystem.Database;
using MFCYouthAreaManagementSystem.Models;
using MFCYouthAreaManagementSystem.Utilities;

namespace MFCYouthAreaManagementSystem.Repositories;

public sealed class EventParticipantRepository
{
    public List<EventParticipant> GetByEvent(long eventId, string search = "")
    {
        var cleanSearch = search.Trim();
        using var connection = DatabaseManager.OpenConnection();
        using var command = connection.CreateCommand();
        command.CommandText = @"
SELECT p.ParticipantID, p.EventID, p.FirstName, p.LastName, p.MiddleInitial, p.Age,
       p.ContactNumber, p.Address, p.ChapterID,
       COALESCE(c.ChapterName, p.ChapterNameSnapshot) AS ChapterName,
       p.ServiceID, COALESCE(s.ServiceName, p.ServiceNameSnapshot) AS ServiceName,
       p.ModeOfPayment, p.PaymentStatus, p.Attended
FROM EventParticipant p
LEFT JOIN Chapter c ON c.ChapterID = p.ChapterID
LEFT JOIN Service s ON s.ServiceID = p.ServiceID
WHERE p.EventID=@EventID AND
      (@Search='' OR p.FirstName LIKE @Like ESCAPE '\' OR p.LastName LIKE @Like ESCAPE '\' OR IFNULL(p.MiddleInitial,'') LIKE @Like ESCAPE '\' OR
       p.ContactNumber LIKE @Like ESCAPE '\' OR p.Address LIKE @Like ESCAPE '\' OR (p.FirstName || ' ' || p.LastName) LIKE @Like ESCAPE '\' OR
       COALESCE(c.ChapterName, p.ChapterNameSnapshot) LIKE @Like ESCAPE '\' OR
       COALESCE(s.ServiceName, p.ServiceNameSnapshot) LIKE @Like ESCAPE '\' OR
       IFNULL(p.ModeOfPayment,'') LIKE @Like ESCAPE '\' OR p.PaymentStatus LIKE @Like ESCAPE '\' OR
       CASE WHEN p.Attended=1 THEN 'Attended' ELSE 'Not Attended' END LIKE @Like ESCAPE '\')
ORDER BY p.LastName COLLATE NOCASE, p.FirstName COLLATE NOCASE, p.ParticipantID;";
        command.Parameters.AddWithValue("@EventID", eventId);
        command.Parameters.AddWithValue("@Search", cleanSearch);
        command.Parameters.AddWithValue("@Like", SearchPatternHelper.Contains(cleanSearch));
        using var reader = command.ExecuteReader();
        var result = new List<EventParticipant>();
        while (reader.Read()) result.Add(Map(reader));
        return result;
    }

    public EventParticipant? GetById(long participantId)
    {
        using var connection = DatabaseManager.OpenConnection();
        using var command = connection.CreateCommand();
        command.CommandText = @"
SELECT p.ParticipantID, p.EventID, p.FirstName, p.LastName, p.MiddleInitial, p.Age,
       p.ContactNumber, p.Address, p.ChapterID,
       COALESCE(c.ChapterName, p.ChapterNameSnapshot) AS ChapterName,
       p.ServiceID, COALESCE(s.ServiceName, p.ServiceNameSnapshot) AS ServiceName,
       p.ModeOfPayment, p.PaymentStatus, p.Attended
FROM EventParticipant p
LEFT JOIN Chapter c ON c.ChapterID = p.ChapterID
LEFT JOIN Service s ON s.ServiceID = p.ServiceID
WHERE p.ParticipantID=@ParticipantID;";
        command.Parameters.AddWithValue("@ParticipantID", participantId);
        using var reader = command.ExecuteReader();
        return reader.Read() ? Map(reader) : null;
    }

    public long Add(EventParticipant participant)
    {
        ValidateForSave(participant, existingLegacyMode: null);

        using var connection = DatabaseManager.OpenConnection();
        using var transaction = connection.BeginTransaction();
        var chapterName = ResolveChapterName(connection, transaction, participant.ChapterID);
        var serviceName = ResolveServiceName(connection, transaction, participant.ServiceID);
        EnsureEventExists(connection, transaction, participant.EventID);

        using var command = connection.CreateCommand();
        command.Transaction = transaction;
        command.CommandText = @"
INSERT INTO EventParticipant(EventID, FirstName, LastName, MiddleInitial, Age, ContactNumber, Address,
    ChapterID, ChapterNameSnapshot, ServiceID, ServiceNameSnapshot, ModeOfPayment, PaymentStatus, Attended, RegisteredAt, UpdatedAt)
VALUES(@EventID,@First,@Last,@Middle,@Age,@Contact,@Address,@ChapterID,@ChapterName,@ServiceID,@ServiceName,@Mode,@Status,@Attended,@Now,@Now);
SELECT last_insert_rowid();";
        AddParameters(command, participant, chapterName, serviceName);
        command.Parameters.AddWithValue("@Now", DateTime.UtcNow.ToString("O"));
        var id = Convert.ToInt64(command.ExecuteScalar());
        transaction.Commit();
        return id;
    }

    public void Update(EventParticipant participant)
    {
        using var connection = DatabaseManager.OpenConnection();
        using var transaction = connection.BeginTransaction();
        var existing = GetExistingState(connection, transaction, participant.ParticipantID, participant.EventID);
        ValidateForSave(participant, existing.ModeOfPayment);

        var chapterName = participant.ChapterID.HasValue
            ? ResolveChapterName(connection, transaction, participant.ChapterID)
            : existing.ChapterName;
        var serviceName = participant.ServiceID.HasValue
            ? ResolveServiceName(connection, transaction, participant.ServiceID)
            : existing.ServiceName;
        EnsureEventExists(connection, transaction, participant.EventID);

        using var command = connection.CreateCommand();
        command.Transaction = transaction;
        command.CommandText = @"
UPDATE EventParticipant
SET FirstName=@First, LastName=@Last, MiddleInitial=@Middle, Age=@Age,
    ContactNumber=@Contact, Address=@Address, ChapterID=@ChapterID, ChapterNameSnapshot=@ChapterName,
    ServiceID=@ServiceID, ServiceNameSnapshot=@ServiceName, ModeOfPayment=@Mode,
    PaymentStatus=@Status, Attended=@Attended, UpdatedAt=@Now
WHERE ParticipantID=@ParticipantID AND EventID=@EventID;";
        AddParameters(command, participant, chapterName, serviceName);
        command.Parameters.AddWithValue("@Now", DateTime.UtcNow.ToString("O"));
        command.Parameters.AddWithValue("@ParticipantID", participant.ParticipantID);
        if (command.ExecuteNonQuery() != 1) throw new InvalidOperationException("Event participant was not found.");
        transaction.Commit();
    }

    public void Delete(long participantId, long eventId)
    {
        using var connection = DatabaseManager.OpenConnection();
        using var command = connection.CreateCommand();
        command.CommandText = "DELETE FROM EventParticipant WHERE ParticipantID=@ParticipantID AND EventID=@EventID;";
        command.Parameters.AddWithValue("@ParticipantID", participantId);
        command.Parameters.AddWithValue("@EventID", eventId);
        if (command.ExecuteNonQuery() != 1) throw new InvalidOperationException("Event participant was not found.");
    }

    public int GetTotalCount()
    {
        using var connection = DatabaseManager.OpenConnection();
        using var command = connection.CreateCommand();
        command.CommandText = "SELECT COUNT(*) FROM EventParticipant;";
        return Convert.ToInt32(command.ExecuteScalar());
    }

    public int GetAttendedCount()
    {
        using var connection = DatabaseManager.OpenConnection();
        using var command = connection.CreateCommand();
        command.CommandText = "SELECT COUNT(*) FROM EventParticipant WHERE Attended=1;";
        return Convert.ToInt32(command.ExecuteScalar());
    }

    public int GetAttendedCountByEvent(long eventId)
    {
        using var connection = DatabaseManager.OpenConnection();
        using var command = connection.CreateCommand();
        command.CommandText = "SELECT COUNT(*) FROM EventParticipant WHERE EventID=@EventID AND Attended=1;";
        command.Parameters.AddWithValue("@EventID", eventId);
        return Convert.ToInt32(command.ExecuteScalar());
    }

    private static void ValidateForSave(EventParticipant participant, string? existingLegacyMode)
    {
        if (string.IsNullOrWhiteSpace(participant.FirstName))
            throw new InvalidOperationException("First Name is required.");
        if (string.IsNullOrWhiteSpace(participant.LastName))
            throw new InvalidOperationException("Last Name is required.");
        if (participant.Age is < 1 or > 120)
            throw new InvalidOperationException("Age must be between 1 and 120.");
        if (!ValidationHelper.IsValidContact(participant.ContactNumber))
            throw new InvalidOperationException("Contact Number must contain exactly 11 digits.");
        if (string.IsNullOrWhiteSpace(participant.Address))
            throw new InvalidOperationException("Address is required.");
        if (!ValidationHelper.IsValidMiddleInitial(participant.MiddleInitial))
            throw new InvalidOperationException("Middle Initial must be one letter, with an optional period.");

        var status = participant.PaymentStatus.Trim();
        if (!ApplicationConstants.PaymentStatuses.Contains(status, StringComparer.OrdinalIgnoreCase))
            throw new InvalidOperationException("Select a valid Payment Status.");

        if (string.Equals(status, "Paid", StringComparison.OrdinalIgnoreCase))
        {
            var mode = ValidationHelper.Clean(participant.ModeOfPayment);
            if (mode.Length == 0)
                throw new InvalidOperationException("Select a Mode of Payment for a Paid participant.");

            var isStandard = ApplicationConstants.PaymentModes.Contains(mode, StringComparer.OrdinalIgnoreCase);
            var isUnchangedLegacy = !string.IsNullOrWhiteSpace(existingLegacyMode) &&
                                    string.Equals(mode, existingLegacyMode.Trim(), StringComparison.OrdinalIgnoreCase);
            if (!isStandard && !isUnchangedLegacy)
                throw new InvalidOperationException("Select a valid Mode of Payment.");
        }
    }

    private static void AddParameters(SQLiteCommand command, EventParticipant participant, string chapterName, string serviceName)
    {
        command.Parameters.AddWithValue("@EventID", participant.EventID);
        command.Parameters.AddWithValue("@First", participant.FirstName.Trim());
        command.Parameters.AddWithValue("@Last", participant.LastName.Trim());
        var middle = string.IsNullOrWhiteSpace(participant.MiddleInitial) ? null : participant.MiddleInitial.Trim();
        command.Parameters.AddWithValue("@Middle", middle == null ? DBNull.Value : middle);
        command.Parameters.AddWithValue("@Age", participant.Age);
        command.Parameters.AddWithValue("@Contact", participant.ContactNumber.Trim());
        command.Parameters.AddWithValue("@Address", participant.Address.Trim());
        command.Parameters.AddWithValue("@ChapterID", participant.ChapterID.HasValue ? participant.ChapterID.Value : DBNull.Value);
        command.Parameters.AddWithValue("@ChapterName", chapterName);
        command.Parameters.AddWithValue("@ServiceID", participant.ServiceID.HasValue ? participant.ServiceID.Value : DBNull.Value);
        command.Parameters.AddWithValue("@ServiceName", serviceName);

        var isPaid = string.Equals(participant.PaymentStatus.Trim(), "Paid", StringComparison.OrdinalIgnoreCase);
        var mode = isPaid ? ValidationHelper.Clean(participant.ModeOfPayment) : string.Empty;
        command.Parameters.AddWithValue("@Mode", mode.Length == 0 ? DBNull.Value : mode);
        command.Parameters.AddWithValue("@Status", participant.PaymentStatus.Trim());
        command.Parameters.AddWithValue("@Attended", participant.Attended ? 1 : 0);
    }

    private static (string ChapterName, string ServiceName, string? ModeOfPayment) GetExistingState(
        SQLiteConnection connection, SQLiteTransaction transaction, long participantId, long eventId)
    {
        using var command = connection.CreateCommand();
        command.Transaction = transaction;
        command.CommandText = @"
SELECT ChapterNameSnapshot, ServiceNameSnapshot, ModeOfPayment
FROM EventParticipant
WHERE ParticipantID=@ParticipantID AND EventID=@EventID;";
        command.Parameters.AddWithValue("@ParticipantID", participantId);
        command.Parameters.AddWithValue("@EventID", eventId);
        using var reader = command.ExecuteReader();
        if (!reader.Read()) throw new InvalidOperationException("Event participant was not found.");

        var chapterName = Convert.ToString(reader["ChapterNameSnapshot"]);
        var serviceName = Convert.ToString(reader["ServiceNameSnapshot"]);
        if (string.IsNullOrWhiteSpace(chapterName)) chapterName = "Deleted Chapter";
        if (string.IsNullOrWhiteSpace(serviceName)) serviceName = "Deleted Service";
        var mode = reader["ModeOfPayment"] == DBNull.Value ? null : Convert.ToString(reader["ModeOfPayment"]);
        return (chapterName!, serviceName!, mode);
    }

    private static void EnsureEventExists(SQLiteConnection connection, SQLiteTransaction transaction, long eventId)
    {
        using var command = connection.CreateCommand();
        command.Transaction = transaction;
        command.CommandText = "SELECT COUNT(*) FROM AreaEvent WHERE EventID=@EventID;";
        command.Parameters.AddWithValue("@EventID", eventId);
        if (Convert.ToInt32(command.ExecuteScalar()) != 1) throw new InvalidOperationException("Event was not found.");
    }

    private static string ResolveChapterName(SQLiteConnection connection, SQLiteTransaction transaction, long? chapterId)
    {
        if (!chapterId.HasValue) throw new InvalidOperationException("Select a Chapter.");
        using var command = connection.CreateCommand();
        command.Transaction = transaction;
        command.CommandText = "SELECT ChapterName FROM Chapter WHERE ChapterID=@ChapterID;";
        command.Parameters.AddWithValue("@ChapterID", chapterId.Value);
        var value = command.ExecuteScalar();
        if (value == null || value == DBNull.Value) throw new InvalidOperationException("Selected Chapter no longer exists.");
        return Convert.ToString(value) ?? throw new InvalidOperationException("Selected Chapter no longer exists.");
    }

    private static string ResolveServiceName(SQLiteConnection connection, SQLiteTransaction transaction, long? serviceId)
    {
        if (!serviceId.HasValue) throw new InvalidOperationException("Select a Service.");
        using var command = connection.CreateCommand();
        command.Transaction = transaction;
        command.CommandText = "SELECT ServiceName FROM Service WHERE ServiceID=@ServiceID;";
        command.Parameters.AddWithValue("@ServiceID", serviceId.Value);
        var value = command.ExecuteScalar();
        if (value == null || value == DBNull.Value) throw new InvalidOperationException("Selected Service no longer exists.");
        return Convert.ToString(value) ?? throw new InvalidOperationException("Selected Service no longer exists.");
    }

    private static EventParticipant Map(SQLiteDataReader reader)
    {
        return new EventParticipant
        {
            ParticipantID = Convert.ToInt64(reader["ParticipantID"]),
            EventID = Convert.ToInt64(reader["EventID"]),
            FirstName = Convert.ToString(reader["FirstName"]) ?? string.Empty,
            LastName = Convert.ToString(reader["LastName"]) ?? string.Empty,
            MiddleInitial = reader["MiddleInitial"] == DBNull.Value ? null : Convert.ToString(reader["MiddleInitial"]),
            Age = Convert.ToInt32(reader["Age"]),
            ContactNumber = Convert.ToString(reader["ContactNumber"]) ?? string.Empty,
            Address = Convert.ToString(reader["Address"]) ?? string.Empty,
            ChapterID = reader["ChapterID"] == DBNull.Value ? null : Convert.ToInt64(reader["ChapterID"]),
            ChapterName = Convert.ToString(reader["ChapterName"]) ?? string.Empty,
            ServiceID = reader["ServiceID"] == DBNull.Value ? null : Convert.ToInt64(reader["ServiceID"]),
            ServiceName = Convert.ToString(reader["ServiceName"]) ?? string.Empty,
            ModeOfPayment = reader["ModeOfPayment"] == DBNull.Value ? null : Convert.ToString(reader["ModeOfPayment"]),
            PaymentStatus = Convert.ToString(reader["PaymentStatus"]) ?? "Not Paid",
            Attended = Convert.ToInt32(reader["Attended"]) == 1
        };
    }
}
