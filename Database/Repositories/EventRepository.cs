using System.Data.SQLite;
using MFCYouthAreaManagementSystem.Database;
using MFCYouthAreaManagementSystem.Models;

namespace MFCYouthAreaManagementSystem.Repositories;

public sealed class EventRepository
{
    public List<AreaEvent> GetAll(string search = "")
    {
        var cleanSearch = search.Trim();
        using var connection = DatabaseManager.OpenConnection();
        using var command = connection.CreateCommand();
        command.CommandText = @"
SELECT e.EventID, e.EventName, e.EventDescription, e.RegistrationFee, e.PeopleAttended,
       e.Venue, e.EventDateTime,
       COUNT(p.ParticipantID) AS RegisteredCount,
       COALESCE(SUM(CASE WHEN p.PaymentStatus='Paid' THEN 1 ELSE 0 END), 0) AS PaidCount,
       CASE WHEN e.RegistrationFee IS NULL THEN 0
            ELSE e.RegistrationFee * COALESCE(SUM(CASE WHEN p.PaymentStatus='Paid' THEN 1 ELSE 0 END), 0)
       END AS TotalRegistrationFees
FROM AreaEvent e
LEFT JOIN EventParticipant p ON p.EventID = e.EventID
WHERE @Search='' OR e.EventName LIKE @Like OR e.EventDescription LIKE @Like OR e.Venue LIKE @Like
GROUP BY e.EventID, e.EventName, e.EventDescription, e.RegistrationFee, e.PeopleAttended, e.Venue, e.EventDateTime
ORDER BY e.EventDateTime DESC, e.EventID DESC;";
        command.Parameters.AddWithValue("@Search", cleanSearch);
        command.Parameters.AddWithValue("@Like", $"%{cleanSearch}%");
        using var reader = command.ExecuteReader();
        var result = new List<AreaEvent>();
        while (reader.Read()) result.Add(Map(reader));
        return result;
    }

    public AreaEvent? GetById(long eventId)
    {
        using var connection = DatabaseManager.OpenConnection();
        using var command = connection.CreateCommand();
        command.CommandText = @"
SELECT e.EventID, e.EventName, e.EventDescription, e.RegistrationFee, e.PeopleAttended,
       e.Venue, e.EventDateTime,
       COUNT(p.ParticipantID) AS RegisteredCount,
       COALESCE(SUM(CASE WHEN p.PaymentStatus='Paid' THEN 1 ELSE 0 END), 0) AS PaidCount,
       CASE WHEN e.RegistrationFee IS NULL THEN 0
            ELSE e.RegistrationFee * COALESCE(SUM(CASE WHEN p.PaymentStatus='Paid' THEN 1 ELSE 0 END), 0)
       END AS TotalRegistrationFees
FROM AreaEvent e
LEFT JOIN EventParticipant p ON p.EventID = e.EventID
WHERE e.EventID=@EventID
GROUP BY e.EventID, e.EventName, e.EventDescription, e.RegistrationFee, e.PeopleAttended, e.Venue, e.EventDateTime;";
        command.Parameters.AddWithValue("@EventID", eventId);
        using var reader = command.ExecuteReader();
        return reader.Read() ? Map(reader) : null;
    }

    public long Add(AreaEvent areaEvent)
    {
        using var connection = DatabaseManager.OpenConnection();
        using var command = connection.CreateCommand();
        command.CommandText = @"
INSERT INTO AreaEvent(EventName, EventDescription, RegistrationFee, PeopleAttended, Venue, EventDateTime, CreatedAt, UpdatedAt)
VALUES(@Name,@Description,@Fee,@Attended,@Venue,@DateTime,@Now,@Now);
SELECT last_insert_rowid();";
        AddParameters(command, areaEvent);
        command.Parameters.AddWithValue("@Now", DateTime.UtcNow.ToString("O"));
        return Convert.ToInt64(command.ExecuteScalar());
    }

    public void Update(AreaEvent areaEvent)
    {
        using var connection = DatabaseManager.OpenConnection();
        using var command = connection.CreateCommand();
        command.CommandText = @"
UPDATE AreaEvent
SET EventName=@Name, EventDescription=@Description, RegistrationFee=@Fee,
    PeopleAttended=@Attended, Venue=@Venue, EventDateTime=@DateTime, UpdatedAt=@Now
WHERE EventID=@EventID;";
        AddParameters(command, areaEvent);
        command.Parameters.AddWithValue("@Now", DateTime.UtcNow.ToString("O"));
        command.Parameters.AddWithValue("@EventID", areaEvent.EventID);
        if (command.ExecuteNonQuery() != 1) throw new InvalidOperationException("Event was not found.");
    }

    public void Delete(long eventId)
    {
        using var connection = DatabaseManager.OpenConnection();
        using var command = connection.CreateCommand();
        command.CommandText = "DELETE FROM AreaEvent WHERE EventID=@EventID;";
        command.Parameters.AddWithValue("@EventID", eventId);
        if (command.ExecuteNonQuery() != 1) throw new InvalidOperationException("Event was not found.");
    }

    public int GetTotalCount()
    {
        using var connection = DatabaseManager.OpenConnection();
        using var command = connection.CreateCommand();
        command.CommandText = "SELECT COUNT(*) FROM AreaEvent;";
        return Convert.ToInt32(command.ExecuteScalar());
    }

    private static void AddParameters(SQLiteCommand command, AreaEvent areaEvent)
    {
        command.Parameters.AddWithValue("@Name", areaEvent.EventName.Trim());
        command.Parameters.AddWithValue("@Description", areaEvent.EventDescription.Trim());
        command.Parameters.AddWithValue("@Fee", areaEvent.RegistrationFee.HasValue ? areaEvent.RegistrationFee.Value : DBNull.Value);
        command.Parameters.AddWithValue("@Attended", areaEvent.PeopleAttended);
        command.Parameters.AddWithValue("@Venue", areaEvent.Venue.Trim());
        command.Parameters.AddWithValue("@DateTime", areaEvent.EventDateTime.ToString("yyyy-MM-dd HH:mm:ss", System.Globalization.CultureInfo.InvariantCulture));
    }

    private static AreaEvent Map(SQLiteDataReader reader)
    {
        return new AreaEvent
        {
            EventID = Convert.ToInt64(reader["EventID"]),
            EventName = Convert.ToString(reader["EventName"]) ?? string.Empty,
            EventDescription = Convert.ToString(reader["EventDescription"]) ?? string.Empty,
            RegistrationFee = reader["RegistrationFee"] == DBNull.Value ? null : Convert.ToDecimal(reader["RegistrationFee"]),
            PeopleAttended = Convert.ToInt32(reader["PeopleAttended"]),
            Venue = Convert.ToString(reader["Venue"]) ?? string.Empty,
            EventDateTime = ParseDateTime(reader["EventDateTime"]),
            RegisteredCount = Convert.ToInt32(reader["RegisteredCount"]),
            PaidCount = Convert.ToInt32(reader["PaidCount"]),
            TotalRegistrationFees = Convert.ToDecimal(reader["TotalRegistrationFees"])
        };
    }

    private static DateTime ParseDateTime(object value)
    {
        var text = Convert.ToString(value) ?? string.Empty;
        if (DateTime.TryParseExact(text, "yyyy-MM-dd HH:mm:ss", System.Globalization.CultureInfo.InvariantCulture,
                System.Globalization.DateTimeStyles.None, out var parsed)) return parsed;
        if (DateTime.TryParse(text, out parsed)) return parsed;
        throw new FormatException($"Invalid stored Event date/time: '{text}'.");
    }
}
