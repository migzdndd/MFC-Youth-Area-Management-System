PRAGMA foreign_keys = ON;


DROP VIEW IF EXISTS ServiceStatistics;
DROP VIEW IF EXISTS ChapterStatistics;
DROP VIEW IF EXISTS MembersWithoutService;
DROP VIEW IF EXISTS ActiveMembers;
DROP VIEW IF EXISTS MemberDirectory;

DROP TABLE IF EXISTS GIGContribution;
DROP TABLE IF EXISTS MemberService;
DROP TABLE IF EXISTS Member;
DROP TABLE IF EXISTS Service;
DROP TABLE IF EXISTS Chapter;



CREATE TABLE Chapter
(
    ChapterID INTEGER PRIMARY KEY AUTOINCREMENT,

    ChapterName TEXT NOT NULL UNIQUE
);

CREATE TABLE Service
(
    ServiceID INTEGER PRIMARY KEY AUTOINCREMENT,

    ServiceName TEXT NOT NULL UNIQUE
);

CREATE TABLE Member
(
    MemberID INTEGER PRIMARY KEY AUTOINCREMENT,

    LastName TEXT NOT NULL,

    FirstName TEXT NOT NULL,

    MiddleName TEXT,

    BirthDate TEXT NOT NULL,

    ContactNumber TEXT NOT NULL UNIQUE,

    Address TEXT NOT NULL,

    EmailAddress TEXT NOT NULL UNIQUE,

    Status TEXT NOT NULL
        CHECK(Status IN ('Active','Inactive'))
        DEFAULT 'Active',

    ChapterID INTEGER NOT NULL,

    FOREIGN KEY (ChapterID)
        REFERENCES Chapter(ChapterID)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

CREATE INDEX idx_firstname
ON Member(FirstName);

CREATE INDEX idx_chapter
ON Member(ChapterID);

CREATE INDEX idx_birthdate
ON Member(BirthDate);

CREATE INDEX idx_fullname
ON Member(LastName, FirstName);

CREATE TABLE MemberService
(
    MemberID INTEGER NOT NULL,

    ServiceID INTEGER NOT NULL,

    PRIMARY KEY
    (
        MemberID,
        ServiceID
    ),

    FOREIGN KEY (MemberID)
        REFERENCES Member(MemberID)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    FOREIGN KEY (ServiceID)
        REFERENCES Service(ServiceID)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE TABLE GIGContribution
(
    ContributionID INTEGER PRIMARY KEY AUTOINCREMENT,

    MemberID INTEGER NOT NULL,

    ContributionDate TEXT NOT NULL,

    Amount REAL NOT NULL
        CHECK (Amount > 0),

    Remarks TEXT,

    CreatedAt TEXT NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (MemberID)
        REFERENCES Member(MemberID)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE INDEX idx_gig_member
ON GIGContribution(MemberID);

CREATE INDEX idx_gig_date
ON GIGContribution(ContributionDate);

INSERT INTO Chapter (ChapterName)
VALUES
('Chapter 1'),
('Chapter 2'),
('Chapter 3'),
('Chapter 5');

INSERT INTO Service (ServiceName)
VALUES
('Member'),
('HH Servant'),
('Chapter Servant'),
('Area Servant'),
('LIT Servant'),
('MFC Campus Servant'),
('MFC High Servant');

CREATE VIEW MemberDirectory AS
SELECT

    m.MemberID,

    m.LastName || ', ' ||
    m.FirstName ||
    CASE
        WHEN m.MiddleName IS NULL
             OR m.MiddleName=''
        THEN ''
        ELSE ' ' || substr(m.MiddleName,1,1) || '.'
    END
    AS "Full Name",

    c.ChapterName
    AS "Chapter",

    CAST(
        (
            julianday('now')
            -
            julianday(m.BirthDate)
        ) / 365.25
        AS INTEGER
    )
    AS "Age",

    m.BirthDate
    AS "Date of Birth",

    m.ContactNumber
    AS "Contact Number",

    m.EmailAddress
    AS "Email Address",

    m.Address
    AS "Address",

    m.Status
    AS "Status",

    IFNULL
    (
        GROUP_CONCAT(DISTINCT s.ServiceName),
        'No Service'
    )
    AS "Services"

FROM Member m

INNER JOIN Chapter c

ON m.ChapterID=c.ChapterID

LEFT JOIN MemberService ms

ON m.MemberID=ms.MemberID

LEFT JOIN Service s

ON ms.ServiceID=s.ServiceID

GROUP BY

m.MemberID;

CREATE VIEW ActiveMembers AS

SELECT *

FROM MemberDirectory

WHERE Status='Active';

CREATE VIEW MembersWithoutService AS

SELECT

    m.MemberID,

    m.LastName || ', ' || m.FirstName
    AS FullName,

    c.ChapterName

FROM Member m

INNER JOIN Chapter c

ON m.ChapterID=c.ChapterID

LEFT JOIN MemberService ms

ON m.MemberID=ms.MemberID

WHERE

ms.MemberID IS NULL

AND

m.Status='Active';

CREATE VIEW ChapterStatistics AS

SELECT

    c.ChapterID,

    c.ChapterName,

    COUNT(m.MemberID)
    AS TotalMembers

FROM Chapter c

LEFT JOIN Member m

ON

c.ChapterID=m.ChapterID

AND

m.Status='Active'

GROUP BY

c.ChapterID,
c.ChapterName;

CREATE VIEW ServiceStatistics AS

SELECT

    s.ServiceID,

    s.ServiceName,

    COUNT(m.MemberID)
    AS TotalMembers

FROM Service s

LEFT JOIN MemberService ms

ON s.ServiceID=ms.ServiceID

LEFT JOIN Member m

ON

ms.MemberID=m.MemberID

AND

m.Status='Active'

GROUP BY

s.ServiceID,
s.ServiceName;