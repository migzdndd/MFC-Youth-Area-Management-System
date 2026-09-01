using System.Text.Json;
using MFCYouthAreaManagementSystem.Database;

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
            PreserveCorruptTrendFile();
            return new List<DashboardTrendSnapshot>();
        }
    }

    private static void PreserveCorruptTrendFile()
    {
        try
        {
            if (!File.Exists(FilePath)) return;

            var corruptPath = Path.Combine(
                DatabaseConfiguration.AppDataDirectory,
                $"dashboard-monthly-trends-corrupt-{DateTime.Now:yyyyMMdd-HHmmss}.json");
            File.Move(FilePath, corruptPath, false);
        }
        catch (Exception ex)
        {
            AppLogger.Error("Preserve corrupt dashboard trend history", ex);
        }
    }
}
