using MFCYouthAreaManagementSystem.Database;

namespace MFCYouthAreaManagementSystem.Repositories;

public sealed record DashboardSnapshot(
    string SnapshotMonth,
    int Members,
    int Chapters,
    int Services,
    int ActivityReports,
    int Events);

public sealed class DashboardSnapshotRepository
{
    public DashboardSnapshot? GetForMonth(string snapshotMonth)
    {
        using var connection = DatabaseManager.OpenConnection();
        using var command = connection.CreateCommand();
        command.CommandText = @"
SELECT SnapshotMonth, Members, Chapters, Services, ActivityReports, Events
FROM DashboardMonthlySnapshot
WHERE SnapshotMonth = @SnapshotMonth;";
        command.Parameters.AddWithValue("@SnapshotMonth", snapshotMonth);

        using var reader = command.ExecuteReader();
        if (!reader.Read()) return null;

        return new DashboardSnapshot(
            Convert.ToString(reader["SnapshotMonth"]) ?? snapshotMonth,
            Convert.ToInt32(reader["Members"]),
            Convert.ToInt32(reader["Chapters"]),
            Convert.ToInt32(reader["Services"]),
            Convert.ToInt32(reader["ActivityReports"]),
            Convert.ToInt32(reader["Events"]));
    }

    public void Upsert(DashboardSnapshot snapshot)
    {
        using var connection = DatabaseManager.OpenConnection();
        using var command = connection.CreateCommand();
        command.CommandText = @"
INSERT INTO DashboardMonthlySnapshot(
    SnapshotMonth, Members, Chapters, Services, ActivityReports, Events, CapturedAt)
VALUES(
    @SnapshotMonth, @Members, @Chapters, @Services, @ActivityReports, @Events, @CapturedAt)
ON CONFLICT(SnapshotMonth) DO UPDATE SET
    Members = excluded.Members,
    Chapters = excluded.Chapters,
    Services = excluded.Services,
    ActivityReports = excluded.ActivityReports,
    Events = excluded.Events,
    CapturedAt = excluded.CapturedAt;";
        command.Parameters.AddWithValue("@SnapshotMonth", snapshot.SnapshotMonth);
        command.Parameters.AddWithValue("@Members", snapshot.Members);
        command.Parameters.AddWithValue("@Chapters", snapshot.Chapters);
        command.Parameters.AddWithValue("@Services", snapshot.Services);
        command.Parameters.AddWithValue("@ActivityReports", snapshot.ActivityReports);
        command.Parameters.AddWithValue("@Events", snapshot.Events);
        command.Parameters.AddWithValue("@CapturedAt", DateTime.UtcNow.ToString("O"));
        command.ExecuteNonQuery();
    }
}
