using System.Data.SQLite;
using MFCYouthAreaManagementSystem.Database;
using MFCYouthAreaManagementSystem.Models;

namespace MFCYouthAreaManagementSystem.Repositories;

public sealed class ActivityReportRepository
{
    public List<ActivityReport> GetAll(string search = "")
    {
        var cleanSearch = search.Trim();
        using var connection = DatabaseManager.OpenConnection();
        using var command = connection.CreateCommand();
        command.CommandText = @"
SELECT r.ReportID, r.Title, r.ChapterID, c.ChapterName, r.ReportType, r.Activity, r.ReportDate, r.PreparedBy, r.Description
FROM ActivityReport r
JOIN Chapter c ON c.ChapterID = r.ChapterID
WHERE @Search = '' OR r.Title LIKE @Like OR c.ChapterName LIKE @Like OR r.ReportType LIKE @Like OR
      r.Activity LIKE @Like OR r.PreparedBy LIKE @Like OR r.Description LIKE @Like
ORDER BY r.ReportDate DESC, r.ReportID DESC;";
        command.Parameters.AddWithValue("@Search", cleanSearch);
        command.Parameters.AddWithValue("@Like", $"%{cleanSearch}%");
        using var reader = command.ExecuteReader();
        var list = new List<ActivityReport>();
        while (reader.Read()) list.Add(Map(reader));
        return list;
    }

    public ActivityReport? GetById(long id)
    {
        using var connection = DatabaseManager.OpenConnection();
        using var command = connection.CreateCommand();
        command.CommandText = @"
SELECT r.ReportID, r.Title, r.ChapterID, c.ChapterName, r.ReportType, r.Activity, r.ReportDate, r.PreparedBy, r.Description
FROM ActivityReport r
JOIN Chapter c ON c.ChapterID = r.ChapterID
WHERE r.ReportID = @Id;";
        command.Parameters.AddWithValue("@Id", id);
        using var reader = command.ExecuteReader();
        return reader.Read() ? Map(reader) : null;
    }

    public long Add(ActivityReport report)
    {
        using var connection = DatabaseManager.OpenConnection();
        using var command = connection.CreateCommand();
        command.CommandText = @"
INSERT INTO ActivityReport(Title, ChapterID, ReportType, Activity, ReportDate, PreparedBy, Description, CreatedAt, UpdatedAt)
VALUES(@Title,@ChapterID,@Type,@Activity,@Date,@PreparedBy,@Description,@Now,@Now);
SELECT last_insert_rowid();";
        AddParams(command, report);
        command.Parameters.AddWithValue("@Now", DateTime.UtcNow.ToString("O"));
        return Convert.ToInt64(command.ExecuteScalar());
    }

    public void Update(ActivityReport report)
    {
        using var connection = DatabaseManager.OpenConnection();
        using var command = connection.CreateCommand();
        command.CommandText = @"
UPDATE ActivityReport
SET Title=@Title, ChapterID=@ChapterID, ReportType=@Type, Activity=@Activity, ReportDate=@Date,
    PreparedBy=@PreparedBy, Description=@Description, UpdatedAt=@Now
WHERE ReportID=@Id;";
        AddParams(command, report);
        command.Parameters.AddWithValue("@Now", DateTime.UtcNow.ToString("O"));
        command.Parameters.AddWithValue("@Id", report.ReportID);
        if (command.ExecuteNonQuery() != 1) throw new InvalidOperationException("Activity Report was not found.");
    }

    public void Delete(long id)
    {
        using var connection = DatabaseManager.OpenConnection();
        using var command = connection.CreateCommand();
        command.CommandText = "DELETE FROM ActivityReport WHERE ReportID=@Id;";
        command.Parameters.AddWithValue("@Id", id);
        if (command.ExecuteNonQuery() != 1) throw new InvalidOperationException("Activity Report was not found.");
    }

    public int GetTotalCount()
    {
        using var connection = DatabaseManager.OpenConnection();
        using var command = connection.CreateCommand();
        command.CommandText = "SELECT COUNT(*) FROM ActivityReport;";
        return Convert.ToInt32(command.ExecuteScalar());
    }

    private static void AddParams(SQLiteCommand command, ActivityReport report)
    {
        command.Parameters.AddWithValue("@Title", report.Title.Trim());
        command.Parameters.AddWithValue("@ChapterID", report.ChapterID);
        command.Parameters.AddWithValue("@Type", report.ReportType.Trim());
        command.Parameters.AddWithValue("@Activity", report.Activity.Trim());
        command.Parameters.AddWithValue("@Date", report.ReportDate.ToString("yyyy-MM-dd", System.Globalization.CultureInfo.InvariantCulture));
        command.Parameters.AddWithValue("@PreparedBy", report.PreparedBy.Trim());
        command.Parameters.AddWithValue("@Description", report.Description.Trim());
    }

    private static ActivityReport Map(SQLiteDataReader reader) => new()
    {
        ReportID = Convert.ToInt64(reader["ReportID"]),
        Title = Convert.ToString(reader["Title"]) ?? string.Empty,
        ChapterID = Convert.ToInt64(reader["ChapterID"]),
        ChapterName = Convert.ToString(reader["ChapterName"]) ?? string.Empty,
        ReportType = Convert.ToString(reader["ReportType"]) ?? string.Empty,
        Activity = Convert.ToString(reader["Activity"]) ?? string.Empty,
        ReportDate = ParseDate(reader["ReportDate"]),
        PreparedBy = Convert.ToString(reader["PreparedBy"]) ?? string.Empty,
        Description = Convert.ToString(reader["Description"]) ?? string.Empty
    };

    private static DateTime ParseDate(object value)
    {
        var text = Convert.ToString(value) ?? string.Empty;
        if (DateTime.TryParseExact(text, "yyyy-MM-dd", System.Globalization.CultureInfo.InvariantCulture,
                System.Globalization.DateTimeStyles.None, out var parsed)) return parsed;
        if (DateTime.TryParse(text, out parsed)) return parsed.Date;
        throw new FormatException($"Invalid stored report date: '{text}'.");
    }
}
