using System.Text.Json;
using MFCYouthAreaManagementSystem.Database;
using MFCYouthAreaManagementSystem.Repositories;

namespace MFCYouthAreaManagementSystem.Utilities;

public sealed record DashboardTrendSnapshot(
    string SnapshotMonth,
    int Members,
    int Chapters,
    int Services,
    int ActivityReports,
    int Events);

public static class DashboardTrendStore
{
    private const string FileName = "dashboard-monthly-trends.json";

    private static string FilePath => Path.Combine(DatabaseConfiguration.AppDataDirectory, FileName);

    public static DashboardTrendSnapshot? GetForMonth(string snapshotMonth)
    {
        return ReadAll().FirstOrDefault(snapshot =>
            string.Equals(snapshot.SnapshotMonth, snapshotMonth, StringComparison.Ordinal));
    }

    public static void CaptureCurrentTotals()
    {
        try
        {
            var now = DateTime.Now;
            var currentMonth = now.ToString("yyyy-MM", System.Globalization.CultureInfo.InvariantCulture);
            Upsert(new DashboardTrendSnapshot(
                currentMonth,
                new MemberRepository().GetTotalCount(),
                new ChapterRepository().GetTotalCount(),
                new ServiceRepository().GetTotalCount(),
                new ActivityReportRepository().GetTotalCount(),
                new EventRepository().GetTotalCount()));
        }
        catch (Exception ex)
        {
            // Trend history is optional. Never let presentation tracking turn a
            // successful record change into an application error.
            AppLogger.Error("Capture dashboard trend totals", ex);
        }
    }

    public static void Upsert(DashboardTrendSnapshot snapshot)
    {
        Directory.CreateDirectory(DatabaseConfiguration.AppDataDirectory);

        var snapshots = ReadAll();
        var existingIndex = snapshots.FindIndex(item =>
            string.Equals(item.SnapshotMonth, snapshot.SnapshotMonth, StringComparison.Ordinal));

        if (existingIndex >= 0)
            snapshots[existingIndex] = snapshot;
        else
            snapshots.Add(snapshot);

        // Keep a small rolling history. Dashboard trends only need recent months,
        // and this prevents the support file from growing indefinitely.
        snapshots = snapshots
            .OrderBy(item => item.SnapshotMonth, StringComparer.Ordinal)
            .TakeLast(24)
            .ToList();

        var json = JsonSerializer.Serialize(
            snapshots,
            new JsonSerializerOptions { WriteIndented = true });

        var temporaryPath = FilePath + ".tmp";
        File.WriteAllText(temporaryPath, json);
        File.Move(temporaryPath, FilePath, true);
    }

    private static List<DashboardTrendSnapshot> ReadAll()
    {
        if (!File.Exists(FilePath))
            return new List<DashboardTrendSnapshot>();

        try
        {
            if (DatabaseWasReplacedAfterTrendHistoryWasCreated())
            {
                PreserveTrendFile("stale");
                return new List<DashboardTrendSnapshot>();
            }
            var json = File.ReadAllText(FilePath);
            if (string.IsNullOrWhiteSpace(json))
                return new List<DashboardTrendSnapshot>();

            return JsonSerializer.Deserialize<List<DashboardTrendSnapshot>>(json)
                   ?? new List<DashboardTrendSnapshot>();
        }
        catch (JsonException ex)
        {
            // Trend history is optional presentation data. Preserve a malformed
            // file for diagnosis, restart tracking, and never block the dashboard.
            AppLogger.Error("Read dashboard trend history", ex);
            PreserveTrendFile("corrupt");
            return new List<DashboardTrendSnapshot>();
        }
    }

    private static bool DatabaseWasReplacedAfterTrendHistoryWasCreated()
    {
        if (!File.Exists(DatabaseConfiguration.DatabasePath) || !File.Exists(FilePath)) return false;

        var databaseCreated = File.GetCreationTimeUtc(DatabaseConfiguration.DatabasePath);
        var trendCreated = File.GetCreationTimeUtc(FilePath);
        return databaseCreated > trendCreated.AddSeconds(2);
    }

    private static void PreserveTrendFile(string reason)
    {
        try
        {
            if (!File.Exists(FilePath)) return;

            var preservedPath = Path.Combine(
                DatabaseConfiguration.AppDataDirectory,
                $"dashboard-monthly-trends-{reason}-{DateTime.Now:yyyyMMdd-HHmmss}.json");
            File.Move(FilePath, preservedPath, false);
        }
        catch (Exception ex)
        {
            AppLogger.Error($"Preserve {reason} dashboard trend history", ex);
        }
    }
}
