using System.Data.SQLite;

namespace MFCYouthAreaManagementSystem.Database;

public static class DatabaseMigrator
{
    public const int CurrentVersion = 4;

    public static void Apply(SQLiteConnection connection)
    {
        using var versionCommand = connection.CreateCommand();
        versionCommand.CommandText = "PRAGMA user_version;";
        var version = Convert.ToInt32(versionCommand.ExecuteScalar());
        if (version > CurrentVersion)
            throw new InvalidOperationException($"Database schema version {version} is newer than this application supports ({CurrentVersion}).");

        if (version < 1)
        {
            ApplyV1(connection);
            version = 1;
        }

        if (version < 2)
        {
            ApplyV2(connection);
            version = 2;
        }

        if (version < 3)
        {
            ApplyV3(connection);
            version = 3;
        }

        if (version < 4)
            ApplyV4(connection);
    }

    private static void ApplyV1(SQLiteConnection connection)
    {
        using var tx = connection.BeginTransaction();
        using var command = connection.CreateCommand();
        command.Transaction = tx;
        command.CommandText = @"
CREATE TABLE IF NOT EXISTS Chapter (
    ChapterID INTEGER PRIMARY KEY AUTOINCREMENT,
    ChapterName TEXT NOT NULL COLLATE NOCASE UNIQUE
);
CREATE TABLE IF NOT EXISTS Member (
    MemberID INTEGER PRIMARY KEY AUTOINCREMENT,
    LastName TEXT NOT NULL,
    FirstName TEXT NOT NULL,
    MiddleName TEXT NULL,
    BirthDate TEXT NOT NULL,
    ContactNumber TEXT NOT NULL,
    Address TEXT NOT NULL,
    EmailAddress TEXT NULL,
    Status TEXT NOT NULL,
    ChapterID INTEGER NOT NULL,
    CreatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ChapterID) REFERENCES Chapter(ChapterID) ON UPDATE CASCADE ON DELETE RESTRICT
);
CREATE TABLE IF NOT EXISTS Service (
    ServiceID INTEGER PRIMARY KEY AUTOINCREMENT,
    ServiceName TEXT NOT NULL COLLATE NOCASE UNIQUE,
    DisplayOrder INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS MemberService (
    MemberID INTEGER NOT NULL,
    ServiceID INTEGER NOT NULL,
    PRIMARY KEY (MemberID, ServiceID),
    FOREIGN KEY (MemberID) REFERENCES Member(MemberID) ON DELETE CASCADE,
    FOREIGN KEY (ServiceID) REFERENCES Service(ServiceID) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS ActivityReport (
    ReportID INTEGER PRIMARY KEY AUTOINCREMENT,
    Title TEXT NOT NULL,
    ChapterID INTEGER NOT NULL,
    ReportType TEXT NOT NULL,
    Activity TEXT NOT NULL,
    ReportDate TEXT NOT NULL,
    PreparedBy TEXT NOT NULL,
    Description TEXT NOT NULL,
    CreatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ChapterID) REFERENCES Chapter(ChapterID) ON UPDATE CASCADE ON DELETE RESTRICT
);
CREATE TABLE IF NOT EXISTS GIGContribution (
    ContributionID INTEGER PRIMARY KEY AUTOINCREMENT,
    MemberID INTEGER NOT NULL,
    ContributionDate TEXT NOT NULL,
    Amount NUMERIC NOT NULL CHECK (Amount > 0),
    Remarks TEXT NULL,
    CreatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (MemberID) REFERENCES Member(MemberID) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS IX_Member_ChapterID ON Member(ChapterID);
CREATE INDEX IF NOT EXISTS IX_Member_LastName ON Member(LastName);
CREATE INDEX IF NOT EXISTS IX_MemberService_MemberID ON MemberService(MemberID);
CREATE INDEX IF NOT EXISTS IX_MemberService_ServiceID ON MemberService(ServiceID);
CREATE INDEX IF NOT EXISTS IX_GIGContribution_MemberID ON GIGContribution(MemberID);
CREATE INDEX IF NOT EXISTS IX_ActivityReport_ChapterID ON ActivityReport(ChapterID);
CREATE VIEW IF NOT EXISTS ServiceStatistics AS
SELECT s.ServiceID, s.ServiceName, s.DisplayOrder, COUNT(ms.MemberID) AS TotalMembers
FROM Service s LEFT JOIN MemberService ms ON ms.ServiceID = s.ServiceID
GROUP BY s.ServiceID, s.ServiceName, s.DisplayOrder;
PRAGMA user_version = 1;";
        command.ExecuteNonQuery();
        tx.Commit();
    }

    private static void ApplyV2(SQLiteConnection connection)
    {
        using var tx = connection.BeginTransaction();
        using var command = connection.CreateCommand();
        command.Transaction = tx;
        command.CommandText = @"
CREATE TABLE IF NOT EXISTS AreaEvent (
    EventID INTEGER PRIMARY KEY AUTOINCREMENT,
    EventName TEXT NOT NULL,
    EventDescription TEXT NOT NULL,
    RegistrationFee NUMERIC NULL CHECK (RegistrationFee IS NULL OR RegistrationFee > 0),
    PeopleAttended INTEGER NOT NULL DEFAULT 0 CHECK (PeopleAttended >= 0),
    Venue TEXT NOT NULL,
    EventDateTime TEXT NOT NULL,
    CreatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS EventParticipant (
    ParticipantID INTEGER PRIMARY KEY AUTOINCREMENT,
    EventID INTEGER NOT NULL,
    FirstName TEXT NOT NULL,
    LastName TEXT NOT NULL,
    MiddleInitial TEXT NULL,
    Age INTEGER NOT NULL CHECK (Age BETWEEN 1 AND 120),
    ContactNumber TEXT NOT NULL,
    Address TEXT NOT NULL,
    ChapterID INTEGER NULL,
    ChapterNameSnapshot TEXT NOT NULL,
    ServiceID INTEGER NULL,
    ServiceNameSnapshot TEXT NOT NULL,
    ModeOfPayment TEXT NULL,
    PaymentStatus TEXT NOT NULL CHECK (PaymentStatus IN ('Paid', 'Not Paid')),
    RegisteredAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (EventID) REFERENCES AreaEvent(EventID) ON DELETE CASCADE,
    FOREIGN KEY (ChapterID) REFERENCES Chapter(ChapterID) ON UPDATE CASCADE ON DELETE SET NULL,
    FOREIGN KEY (ServiceID) REFERENCES Service(ServiceID) ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS IX_AreaEvent_EventDateTime ON AreaEvent(EventDateTime);
CREATE INDEX IF NOT EXISTS IX_EventParticipant_EventID ON EventParticipant(EventID);
CREATE INDEX IF NOT EXISTS IX_EventParticipant_ChapterID ON EventParticipant(ChapterID);
CREATE INDEX IF NOT EXISTS IX_EventParticipant_ServiceID ON EventParticipant(ServiceID);
PRAGMA user_version = 2;";
        command.ExecuteNonQuery();
        tx.Commit();
    }
    private static void ApplyV3(SQLiteConnection connection)
    {
        using var tx = connection.BeginTransaction();
        using var command = connection.CreateCommand();
        command.Transaction = tx;
        command.CommandText = @"
CREATE TABLE ActivityReport_v3 (
    ReportID INTEGER PRIMARY KEY AUTOINCREMENT,
    Title TEXT NOT NULL,
    ChapterID INTEGER NULL,
    ChapterNameSnapshot TEXT NOT NULL,
    ReportType TEXT NOT NULL,
    Activity TEXT NOT NULL,
    ReportDate TEXT NOT NULL,
    PreparedBy TEXT NOT NULL,
    Description TEXT NOT NULL,
    CreatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ChapterID) REFERENCES Chapter(ChapterID) ON UPDATE CASCADE ON DELETE SET NULL
);

INSERT INTO ActivityReport_v3(
    ReportID, Title, ChapterID, ChapterNameSnapshot, ReportType, Activity, ReportDate, PreparedBy, Description, CreatedAt, UpdatedAt)
SELECT
    r.ReportID, r.Title, r.ChapterID, COALESCE(c.ChapterName, 'Deleted Chapter'),
    r.ReportType, r.Activity, r.ReportDate, r.PreparedBy, r.Description, r.CreatedAt, r.UpdatedAt
FROM ActivityReport r
LEFT JOIN Chapter c ON c.ChapterID = r.ChapterID;

DROP TABLE ActivityReport;
ALTER TABLE ActivityReport_v3 RENAME TO ActivityReport;
CREATE INDEX IF NOT EXISTS IX_ActivityReport_ChapterID ON ActivityReport(ChapterID);
PRAGMA user_version = 3;";
        command.ExecuteNonQuery();
        tx.Commit();
    }

    private static void ApplyV4(SQLiteConnection connection)
    {
        using var tx = connection.BeginTransaction();
        using var command = connection.CreateCommand();
        command.Transaction = tx;
        command.CommandText = @"
DROP TABLE IF EXISTS ActivityReport_v4;
CREATE TABLE ActivityReport_v4 (
    ReportID INTEGER PRIMARY KEY AUTOINCREMENT,
    Title TEXT NOT NULL,
    ChapterID INTEGER NULL,
    ChapterNameSnapshot TEXT NOT NULL,
    ReportType TEXT NOT NULL,
    Activity TEXT NOT NULL,
    ReportDate TEXT NOT NULL,
    PreparedBy TEXT NOT NULL,
    Description TEXT NOT NULL,
    CreatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ChapterID) REFERENCES Chapter(ChapterID) ON UPDATE CASCADE ON DELETE SET NULL
);

INSERT INTO ActivityReport_v4(
    ReportID, Title, ChapterID, ChapterNameSnapshot, ReportType, Activity, ReportDate, PreparedBy, Description, CreatedAt, UpdatedAt)
SELECT
    r.ReportID,
    r.Title,
    CASE WHEN c.ChapterID IS NULL THEN NULL ELSE r.ChapterID END,
    COALESCE(NULLIF(TRIM(r.ChapterNameSnapshot), ''), c.ChapterName, 'Deleted Chapter'),
    r.ReportType, r.Activity, r.ReportDate, r.PreparedBy, r.Description, r.CreatedAt, r.UpdatedAt
FROM ActivityReport r
LEFT JOIN Chapter c ON c.ChapterID = r.ChapterID;

DROP TABLE ActivityReport;
ALTER TABLE ActivityReport_v4 RENAME TO ActivityReport;
CREATE INDEX IF NOT EXISTS IX_ActivityReport_ChapterID ON ActivityReport(ChapterID);

DROP TABLE IF EXISTS EventParticipant_v4;
CREATE TABLE EventParticipant_v4 (
    ParticipantID INTEGER PRIMARY KEY AUTOINCREMENT,
    EventID INTEGER NOT NULL,
    FirstName TEXT NOT NULL,
    LastName TEXT NOT NULL,
    MiddleInitial TEXT NULL,
    Age INTEGER NOT NULL CHECK (Age BETWEEN 1 AND 120),
    ContactNumber TEXT NOT NULL,
    Address TEXT NOT NULL,
    ChapterID INTEGER NULL,
    ChapterNameSnapshot TEXT NOT NULL,
    ServiceID INTEGER NULL,
    ServiceNameSnapshot TEXT NOT NULL,
    ModeOfPayment TEXT NULL,
    PaymentStatus TEXT NOT NULL CHECK (PaymentStatus IN ('Paid', 'Not Paid')),
    RegisteredAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (EventID) REFERENCES AreaEvent(EventID) ON DELETE CASCADE,
    FOREIGN KEY (ChapterID) REFERENCES Chapter(ChapterID) ON UPDATE CASCADE ON DELETE SET NULL,
    FOREIGN KEY (ServiceID) REFERENCES Service(ServiceID) ON UPDATE CASCADE ON DELETE SET NULL
);

INSERT INTO EventParticipant_v4(
    ParticipantID, EventID, FirstName, LastName, MiddleInitial, Age, ContactNumber, Address,
    ChapterID, ChapterNameSnapshot, ServiceID, ServiceNameSnapshot, ModeOfPayment, PaymentStatus, RegisteredAt, UpdatedAt)
SELECT
    p.ParticipantID, p.EventID, p.FirstName, p.LastName, p.MiddleInitial, p.Age, p.ContactNumber, p.Address,
    CASE WHEN c.ChapterID IS NULL THEN NULL ELSE p.ChapterID END,
    COALESCE(NULLIF(TRIM(p.ChapterNameSnapshot), ''), c.ChapterName, 'Deleted Chapter'),
    CASE WHEN s.ServiceID IS NULL THEN NULL ELSE p.ServiceID END,
    COALESCE(NULLIF(TRIM(p.ServiceNameSnapshot), ''), s.ServiceName, 'Deleted Service'),
    p.ModeOfPayment, p.PaymentStatus, p.RegisteredAt, p.UpdatedAt
FROM EventParticipant p
LEFT JOIN Chapter c ON c.ChapterID = p.ChapterID
LEFT JOIN Service s ON s.ServiceID = p.ServiceID;

DROP TABLE EventParticipant;
ALTER TABLE EventParticipant_v4 RENAME TO EventParticipant;
CREATE INDEX IF NOT EXISTS IX_EventParticipant_EventID ON EventParticipant(EventID);
CREATE INDEX IF NOT EXISTS IX_EventParticipant_ChapterID ON EventParticipant(ChapterID);
CREATE INDEX IF NOT EXISTS IX_EventParticipant_ServiceID ON EventParticipant(ServiceID);

PRAGMA user_version = 4;";
        command.ExecuteNonQuery();
        tx.Commit();
    }

}
