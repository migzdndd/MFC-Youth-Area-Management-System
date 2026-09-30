using System.Data.SQLite;
using MFCYouthAreaManagementSystem.Database;
using MFCYouthAreaManagementSystem.Models;
using MFCYouthAreaManagementSystem.Utilities;

namespace MFCYouthAreaManagementSystem.Repositories;

public sealed class ActivityReportRepository
{
    public List<ActivityReport> GetAll(string search = "") =>
        GetAll(new ActivityReportFilter { Search = search });

    public List<ActivityReport> GetAll(ActivityReportFilter filter)
    {
        ArgumentNullException.ThrowIfNull(filter);

        var cleanSearch = filter.Search.Trim();
        using var connection = DatabaseManager.OpenConnection();
        using var command = connection.CreateCommand();
        command.CommandText = @"
SELECT r.ReportID, r.Title, r.ChapterID, COALESCE(c.ChapterName, r.ChapterNameSnapshot) AS ChapterName,
       r.EventID, COALESCE(e.EventName, r.EventNameSnapshot, '') AS EventName,
       r.ReportType, r.Activity, r.ReportDate, r.PreparedBy, r.Description
FROM ActivityReport r
LEFT JOIN Chapter c ON c.ChapterID = r.ChapterID
LEFT JOIN AreaEvent e ON e.EventID = r.EventID
WHERE (@Search = '' OR r.Title LIKE @Like ESCAPE '\' OR COALESCE(c.ChapterName, r.ChapterNameSnapshot) LIKE @Like ESCAPE '\' OR
       COALESCE(e.EventName, r.EventNameSnapshot, '') LIKE @Like ESCAPE '\' OR r.ReportType LIKE @Like ESCAPE '\' OR
       r.Activity LIKE @Like ESCAPE '\' OR r.PreparedBy LIKE @Like ESCAPE '\' OR r.Description LIKE @Like ESCAPE '\')
  AND (
      (@ChapterID IS NULL AND @HistoricalChapterName = '')
      OR r.ChapterID = @ChapterID
      OR (
          r.ChapterID IS NULL
          AND @HistoricalChapterName <> ''
          AND TRIM(IFNULL(r.ChapterNameSnapshot, '')) = @HistoricalChapterName COLLATE NOCASE
      )
  )
  AND (@ReportType = '' OR TRIM(r.ReportType) = @ReportType COLLATE NOCASE)
  AND (@DateFrom = '' OR r.ReportDate >= @DateFrom)
  AND (@DateTo = '' OR r.ReportDate <= @DateTo)
ORDER BY r.ReportDate DESC, r.ReportID DESC;";
        command.Parameters.AddWithValue("@Search", cleanSearch);
        command.Parameters.AddWithValue("@Like", SearchPatternHelper.Contains(cleanSearch));
        command.Parameters.AddWithValue("@ChapterID", filter.ChapterID.HasValue ? filter.ChapterID.Value : DBNull.Value);
        command.Parameters.AddWithValue("@HistoricalChapterName", filter.HistoricalChapterName?.Trim() ?? string.Empty);
        command.Parameters.AddWithValue("@ReportType", filter.ReportType?.Trim() ?? string.Empty);
        command.Parameters.AddWithValue("@DateFrom", FormatOptionalDate(filter.DateFrom));
        command.Parameters.AddWithValue("@DateTo", FormatOptionalDate(filter.DateTo));

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
SELECT r.ReportID, r.Title, r.ChapterID, COALESCE(c.ChapterName, r.ChapterNameSnapshot) AS ChapterName,
       r.EventID, COALESCE(e.EventName, r.EventNameSnapshot, '') AS EventName,
       r.ReportType, r.Activity, r.ReportDate, r.PreparedBy, r.Description
FROM ActivityReport r
LEFT JOIN Chapter c ON c.ChapterID = r.ChapterID
LEFT JOIN AreaEvent e ON e.EventID = r.EventID
WHERE r.ReportID = @Id;";
        command.Parameters.AddWithValue("@Id", id);
        using var reader = command.ExecuteReader();
        return reader.Read() ? Map(reader) : null;
    }

    public long Add(ActivityReport report)
    {
        ValidateForSave(report, requireChapter: true);
        using var connection = DatabaseManager.OpenConnection();
        EnsureReferencesExist(connection, report);
        using var command = connection.CreateCommand();
        command.CommandText = @"
INSERT INTO ActivityReport(Title, ChapterID, ChapterNameSnapshot, EventID, EventNameSnapshot, ReportType, Activity, ReportDate, PreparedBy, Description, CreatedAt, UpdatedAt)
VALUES(@Title,@ChapterID,(SELECT ChapterName FROM Chapter WHERE ChapterID=@ChapterID),
       @EventID, CASE WHEN @EventID IS NULL THEN NULLIF(@EventNameSnapshot, '') ELSE (SELECT EventName FROM AreaEvent WHERE EventID=@EventID) END,
       @Type,@Activity,@Date,@PreparedBy,@Description,@Now,@Now);
SELECT last_insert_rowid();";
        AddParams(command, report);
        command.Parameters.AddWithValue("@Now", DateTime.UtcNow.ToString("O"));
        return Convert.ToInt64(command.ExecuteScalar());
    }

    public void Update(ActivityReport report)
    {
        ValidateForSave(report, requireChapter: false);
        using var connection = DatabaseManager.OpenConnection();
        EnsureReferencesExist(connection, report);
        using var command = connection.CreateCommand();
        command.CommandText = @"
UPDATE ActivityReport
SET Title=@Title, ChapterID=@ChapterID,
    ChapterNameSnapshot=CASE
        WHEN @ChapterID IS NULL THEN ChapterNameSnapshot
        ELSE (SELECT ChapterName FROM Chapter WHERE ChapterID=@ChapterID)
    END,
    EventID=@EventID,
    EventNameSnapshot=CASE
        WHEN @EventID IS NULL THEN NULLIF(@EventNameSnapshot, '')
        ELSE (SELECT EventName FROM AreaEvent WHERE EventID=@EventID)
    END,
    ReportType=@Type, Activity=@Activity, ReportDate=@Date,
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

    public List<string> GetHistoricalChapterNames()
    {
        using var connection = DatabaseManager.OpenConnection();
        using var command = connection.CreateCommand();
        command.CommandText = @"
SELECT MIN(TRIM(ChapterNameSnapshot)) AS ChapterName
FROM ActivityReport
WHERE ChapterID IS NULL
  AND NULLIF(TRIM(IFNULL(ChapterNameSnapshot, '')), '') IS NOT NULL
GROUP BY TRIM(ChapterNameSnapshot) COLLATE NOCASE
ORDER BY ChapterName COLLATE NOCASE;";

        using var reader = command.ExecuteReader();
        var names = new List<string>();
        while (reader.Read())
        {
            var name = Convert.ToString(reader["ChapterName"])?.Trim();
            if (!string.IsNullOrWhiteSpace(name))
                names.Add(name);
        }

        return names;
    }

    private static void ValidateForSave(ActivityReport report, bool requireChapter)
    {
        if (string.IsNullOrWhiteSpace(report.Title)) throw new InvalidOperationException("Report Title is required.");
        if (requireChapter && !report.ChapterID.HasValue) throw new InvalidOperationException("Select a Chapter.");
        if (string.IsNullOrWhiteSpace(report.ReportType)) throw new InvalidOperationException("Report Type is required.");
        if (string.IsNullOrWhiteSpace(report.Activity)) throw new InvalidOperationException("Activity is required.");
        if (report.ReportDate == default) throw new InvalidOperationException("Report Date is required.");
        if (string.IsNullOrWhiteSpace(report.PreparedBy)) throw new InvalidOperationException("Prepared By is required.");
        if (string.IsNullOrWhiteSpace(report.Description)) throw new InvalidOperationException("Description is required.");
    }

    private static void EnsureReferencesExist(SQLiteConnection connection, ActivityReport report)
    {
        if (report.ChapterID.HasValue)
        {
            using var chapter = connection.CreateCommand();
            chapter.CommandText = "SELECT EXISTS(SELECT 1 FROM Chapter WHERE ChapterID=@Id);";
            chapter.Parameters.AddWithValue("@Id", report.ChapterID.Value);
            if (Convert.ToInt32(chapter.ExecuteScalar()) != 1)
                throw new InvalidOperationException("Selected Chapter no longer exists. Refresh the form and try again.");
        }

        if (report.EventID.HasValue)
        {
            using var areaEvent = connection.CreateCommand();
            areaEvent.CommandText = "SELECT EXISTS(SELECT 1 FROM AreaEvent WHERE EventID=@Id);";
            areaEvent.Parameters.AddWithValue("@Id", report.EventID.Value);
            if (Convert.ToInt32(areaEvent.ExecuteScalar()) != 1)
                throw new InvalidOperationException("Selected Event no longer exists. Refresh the form and try again.");
        }
    }

    private static void AddParams(SQLiteCommand command, ActivityReport report)
    {
        command.Parameters.AddWithValue("@Title", report.Title.Trim());
        command.Parameters.AddWithValue("@ChapterID", report.ChapterID.HasValue ? report.ChapterID.Value : DBNull.Value);
        command.Parameters.AddWithValue("@EventID", report.EventID.HasValue ? report.EventID.Value : DBNull.Value);
        command.Parameters.AddWithValue("@EventNameSnapshot", report.EventName?.Trim() ?? string.Empty);
        command.Parameters.AddWithValue("@Type", report.ReportType.Trim());
        command.Parameters.AddWithValue("@Activity", report.Activity.Trim());
        command.Parameters.AddWithValue("@Date", report.ReportDate.ToString("yyyy-MM-dd", System.Globalization.CultureInfo.InvariantCulture));
        command.Parameters.AddWithValue("@PreparedBy", report.PreparedBy.Trim());
        command.Parameters.AddWithValue("@Description", report.Description.Trim());
    }

    private static string FormatOptionalDate(DateTime? date) =>
        date.HasValue
            ? date.Value.Date.ToString("yyyy-MM-dd", System.Globalization.CultureInfo.InvariantCulture)
            : string.Empty;

    private static ActivityReport Map(SQLiteDataReader reader) => new()
    {
        ReportID = Convert.ToInt64(reader["ReportID"]),
        Title = Convert.ToString(reader["Title"]) ?? string.Empty,
        ChapterID = reader["ChapterID"] == DBNull.Value ? null : Convert.ToInt64(reader["ChapterID"]),
        ChapterName = Convert.ToString(reader["ChapterName"]) ?? string.Empty,
        EventID = reader["EventID"] == DBNull.Value ? null : Convert.ToInt64(reader["EventID"]),
        EventName = Convert.ToString(reader["EventName"]) ?? string.Empty,
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
