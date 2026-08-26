using System.Data.SQLite;
using MFCYouthAreaManagementSystem.Database;
using MFCYouthAreaManagementSystem.Models;

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
       p.ModeOfPayment, p.PaymentStatus
FROM EventParticipant p
LEFT JOIN Chapter c ON c.ChapterID = p.ChapterID
LEFT JOIN Service s ON s.ServiceID = p.ServiceID
WHERE p.EventID=@EventID AND
      (@Search='' OR p.FirstName LIKE @Like OR p.LastName LIKE @Like OR p.MiddleInitial LIKE @Like OR
       p.ContactNumber LIKE @Like OR p.Address LIKE @Like OR (p.FirstName || ' ' || p.LastName) LIKE @Like OR
       COALESCE(c.ChapterName, p.ChapterNameSnapshot) LIKE @Like OR
       COALESCE(s.ServiceName, p.ServiceNameSnapshot) LIKE @Like OR
       p.ModeOfPayment LIKE @Like OR p.PaymentStatus LIKE @Like)
ORDER BY p.LastName COLLATE NOCASE, p.FirstName COLLATE NOCASE, p.ParticipantID;";
        command.Parameters.AddWithValue("@EventID", eventId);
        command.Parameters.AddWithValue("@Search", cleanSearch);
        command.Parameters.AddWithValue("@Like", $"%{cleanSearch}%");
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
       p.ModeOfPayment, p.PaymentStatus
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
        using var connection = DatabaseManager.OpenConnection();
        using var transaction = connection.BeginTransaction();
        var chapterName = ResolveChapterName(connection, transaction, participant.ChapterID);
        var serviceName = ResolveServiceName(connection, transaction, participant.ServiceID);
        EnsureEventExists(connection, transaction, participant.EventID);

        using var command = connection.CreateCommand();
        command.Transaction = transaction;
        command.CommandText = @"
INSERT INTO EventParticipant(EventID, FirstName, LastName, MiddleInitial, Age, ContactNumber, Address,
    ChapterID, ChapterNameSnapshot, ServiceID, ServiceNameSnapshot, ModeOfPayment, PaymentStatus, RegisteredAt, UpdatedAt)
VALUES(@EventID,@First,@Last,@Middle,@Age,@Contact,@Address,@ChapterID,@ChapterName,@ServiceID,@ServiceName,@Mode,@Status,@Now,@Now);
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
        var chapterName = ResolveChapterName(connection, transaction, participant.ChapterID);
        var serviceName = ResolveServiceName(connection, transaction, participant.ServiceID);
        EnsureEventExists(connection, transaction, participant.EventID);

        using var command = connection.CreateCommand();
        command.Transaction = transaction;
        command.CommandText = @"
UPDATE EventParticipant
SET FirstName=@First, LastName=@Last, MiddleInitial=@Middle, Age=@Age,
    ContactNumber=@Contact, Address=@Address, ChapterID=@ChapterID, ChapterNameSnapshot=@ChapterName,
    ServiceID=@ServiceID, ServiceNameSnapshot=@ServiceName, ModeOfPayment=@Mode,
    PaymentStatus=@Status, UpdatedAt=@Now
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
        var mode = string.IsNullOrWhiteSpace(participant.ModeOfPayment) ? null : participant.ModeOfPayment.Trim();
        command.Parameters.AddWithValue("@Mode", mode == null ? DBNull.Value : mode);
        command.Parameters.AddWithValue("@Status", participant.PaymentStatus.Trim());
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
            PaymentStatus = Convert.ToString(reader["PaymentStatus"]) ?? "Not Paid"
        };
    }
}
