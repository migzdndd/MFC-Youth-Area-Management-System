using System.Data.SQLite;
using MFCYouthAreaManagementSystem.Utilities;

namespace MFCYouthAreaManagementSystem.Database;

/// <summary>
/// Performs conservative post-migration data checks. Only deterministic snapshot
/// fields are repaired automatically; user-entered values are never guessed,
/// deleted, or rewritten by this audit.
/// </summary>
public static class DatabaseDataIntegrityAuditor
{
    public static void AuditAndRepair(SQLiteConnection connection)
    {
        ArgumentNullException.ThrowIfNull(connection);

        try
        {
            RepairLinkedSnapshots(connection);
            var issues = CollectIssueCounts(connection);
            var meaningful = issues.Where(pair => pair.Value > 0).ToArray();
            if (meaningful.Length > 0)
            {
                AppLogger.Warning(
                    "Database data-integrity audit",
                    string.Join(" | ", meaningful.Select(pair => $"{pair.Key}: {pair.Value}")));
            }
        }
        catch (Exception ex)
        {
            // The startup integrity/FK checks remain authoritative. This audit is
            // intentionally non-destructive and must not block access solely
            // because a legacy validation issue could not be summarized.
            AppLogger.Error("Database data-integrity audit", ex);
        }
    }

    private static void RepairLinkedSnapshots(SQLiteConnection connection)
    {
        using var transaction = connection.BeginTransaction();
        using var command = connection.CreateCommand();
        command.Transaction = transaction;
        command.CommandText = @"
UPDATE ActivityReport
SET ChapterNameSnapshot = (SELECT ChapterName FROM Chapter WHERE ChapterID=ActivityReport.ChapterID)
WHERE ChapterID IS NOT NULL
  AND EXISTS (SELECT 1 FROM Chapter WHERE ChapterID=ActivityReport.ChapterID)
  AND TRIM(IFNULL(ChapterNameSnapshot, '')) <> TRIM((SELECT ChapterName FROM Chapter WHERE ChapterID=ActivityReport.ChapterID)) COLLATE NOCASE;

UPDATE ActivityReport
SET EventNameSnapshot = (SELECT EventName FROM AreaEvent WHERE EventID=ActivityReport.EventID)
WHERE EventID IS NOT NULL
  AND EXISTS (SELECT 1 FROM AreaEvent WHERE EventID=ActivityReport.EventID)
  AND TRIM(IFNULL(EventNameSnapshot, '')) <> TRIM((SELECT EventName FROM AreaEvent WHERE EventID=ActivityReport.EventID)) COLLATE NOCASE;

UPDATE EventParticipant
SET ChapterNameSnapshot = (SELECT ChapterName FROM Chapter WHERE ChapterID=EventParticipant.ChapterID)
WHERE ChapterID IS NOT NULL
  AND EXISTS (SELECT 1 FROM Chapter WHERE ChapterID=EventParticipant.ChapterID)
  AND TRIM(IFNULL(ChapterNameSnapshot, '')) <> TRIM((SELECT ChapterName FROM Chapter WHERE ChapterID=EventParticipant.ChapterID)) COLLATE NOCASE;

UPDATE EventParticipant
SET ServiceNameSnapshot = (SELECT ServiceName FROM Service WHERE ServiceID=EventParticipant.ServiceID)
WHERE ServiceID IS NOT NULL
  AND EXISTS (SELECT 1 FROM Service WHERE ServiceID=EventParticipant.ServiceID)
  AND TRIM(IFNULL(ServiceNameSnapshot, '')) <> TRIM((SELECT ServiceName FROM Service WHERE ServiceID=EventParticipant.ServiceID)) COLLATE NOCASE;";
        command.ExecuteNonQuery();
        transaction.Commit();
    }

    private static Dictionary<string, int> CollectIssueCounts(SQLiteConnection connection)
    {
        var today = DateTime.Today.ToString("yyyy-MM-dd", System.Globalization.CultureInfo.InvariantCulture);
        var checks = new (string Name, string Sql)[]
        {
            ("Members with broken Chapter IDs", "SELECT COUNT(*) FROM Member m WHERE m.ChapterID IS NOT NULL AND NOT EXISTS(SELECT 1 FROM Chapter c WHERE c.ChapterID=m.ChapterID);"),
            ("Reports with broken Chapter IDs", "SELECT COUNT(*) FROM ActivityReport r WHERE r.ChapterID IS NOT NULL AND NOT EXISTS(SELECT 1 FROM Chapter c WHERE c.ChapterID=r.ChapterID);"),
            ("Reports with broken Event IDs", "SELECT COUNT(*) FROM ActivityReport r WHERE r.EventID IS NOT NULL AND NOT EXISTS(SELECT 1 FROM AreaEvent e WHERE e.EventID=r.EventID);"),
            ("Participants with broken Event IDs", "SELECT COUNT(*) FROM EventParticipant p WHERE NOT EXISTS(SELECT 1 FROM AreaEvent e WHERE e.EventID=p.EventID);"),
            ("Participants with broken Chapter IDs", "SELECT COUNT(*) FROM EventParticipant p WHERE p.ChapterID IS NOT NULL AND NOT EXISTS(SELECT 1 FROM Chapter c WHERE c.ChapterID=p.ChapterID);"),
            ("Participants with broken Service IDs", "SELECT COUNT(*) FROM EventParticipant p WHERE p.ServiceID IS NOT NULL AND NOT EXISTS(SELECT 1 FROM Service s WHERE s.ServiceID=p.ServiceID);"),
            ("Reports with inconsistent Chapter snapshots", "SELECT COUNT(*) FROM ActivityReport r JOIN Chapter c ON c.ChapterID=r.ChapterID WHERE TRIM(IFNULL(r.ChapterNameSnapshot,'')) <> TRIM(c.ChapterName) COLLATE NOCASE;"),
            ("Reports with inconsistent Event snapshots", "SELECT COUNT(*) FROM ActivityReport r JOIN AreaEvent e ON e.EventID=r.EventID WHERE TRIM(IFNULL(r.EventNameSnapshot,'')) <> TRIM(e.EventName) COLLATE NOCASE;"),
            ("Participants with inconsistent Chapter snapshots", "SELECT COUNT(*) FROM EventParticipant p JOIN Chapter c ON c.ChapterID=p.ChapterID WHERE TRIM(IFNULL(p.ChapterNameSnapshot,'')) <> TRIM(c.ChapterName) COLLATE NOCASE;"),
            ("Participants with inconsistent Service snapshots", "SELECT COUNT(*) FROM EventParticipant p JOIN Service s ON s.ServiceID=p.ServiceID WHERE TRIM(IFNULL(p.ServiceNameSnapshot,'')) <> TRIM(s.ServiceName) COLLATE NOCASE;"),
            ("Duplicate Service assignments", "SELECT COALESCE(SUM(cnt-1),0) FROM (SELECT COUNT(*) cnt FROM MemberService GROUP BY MemberID, ServiceID HAVING COUNT(*)>1);"),
            ("Non-positive GIG contributions", "SELECT COUNT(*) FROM GIGContribution WHERE Amount<=0;"),
            ("Future GIG dates", $"SELECT COUNT(*) FROM GIGContribution WHERE date(ContributionDate)>date('{today}');"),
            ("Future Birth Dates", $"SELECT COUNT(*) FROM Member WHERE date(BirthDate)>date('{today}');"),
            ("Invalid Member contacts", "SELECT COUNT(*) FROM Member WHERE length(TRIM(ContactNumber))<>11 OR TRIM(ContactNumber) GLOB '*[^0-9]*';"),
            ("Invalid Participant contacts", "SELECT COUNT(*) FROM EventParticipant WHERE length(TRIM(ContactNumber))<>11 OR TRIM(ContactNumber) GLOB '*[^0-9]*';"),
            ("Invalid Participant ages", "SELECT COUNT(*) FROM EventParticipant WHERE Age<1 OR Age>120;"),
            ("Invalid Payment Status values", "SELECT COUNT(*) FROM EventParticipant WHERE PaymentStatus NOT IN ('Paid','Not Paid');"),
            ("Paid registrations missing payment mode", "SELECT COUNT(*) FROM EventParticipant WHERE PaymentStatus='Paid' AND NULLIF(TRIM(IFNULL(ModeOfPayment,'')),'') IS NULL;"),
            ("Legacy/nonstandard payment modes", "SELECT COUNT(*) FROM EventParticipant WHERE PaymentStatus='Paid' AND NULLIF(TRIM(IFNULL(ModeOfPayment,'')),'') IS NOT NULL AND TRIM(ModeOfPayment) NOT IN ('Cash','GCash','Bank Transfer') COLLATE NOCASE;"),
            ("Invalid Attendance values", "SELECT COUNT(*) FROM EventParticipant WHERE Attended NOT IN (0,1);"),
            ("Invalid Member dates", "SELECT COUNT(*) FROM Member WHERE date(BirthDate) IS NULL;"),
            ("Invalid Report dates", "SELECT COUNT(*) FROM ActivityReport WHERE date(ReportDate) IS NULL;"),
            ("Invalid GIG dates", "SELECT COUNT(*) FROM GIGContribution WHERE date(ContributionDate) IS NULL;"),
            ("Invalid Event date/times", "SELECT COUNT(*) FROM AreaEvent WHERE datetime(EventDateTime) IS NULL;")
        };

        var result = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
        foreach (var (name, sql) in checks)
        {
            using var command = connection.CreateCommand();
            command.CommandText = sql;
            result[name] = Convert.ToInt32(command.ExecuteScalar());
        }
        return result;
    }
}
