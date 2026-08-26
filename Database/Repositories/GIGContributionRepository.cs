using System.Data.SQLite;
using MFCYouthAreaManagementSystem.Database;
using MFCYouthAreaManagementSystem.Models;

namespace MFCYouthAreaManagementSystem.Repositories;

public sealed class GIGContributionRepository
{
    public List<GIGContribution> GetByMember(long memberId, string search = "")
    {
        var cleanSearch = search.Trim();
        using var connection = DatabaseManager.OpenConnection();
        using var command = connection.CreateCommand();
        command.CommandText = @"
SELECT ContributionID, MemberID, ContributionDate, Amount, Remarks
FROM GIGContribution
WHERE MemberID=@MemberID
  AND (@Search='' OR ContributionDate LIKE @Like OR IFNULL(Remarks,'') LIKE @Like OR CAST(Amount AS TEXT) LIKE @Like)
ORDER BY ContributionDate DESC, ContributionID DESC;";
        command.Parameters.AddWithValue("@MemberID", memberId);
        command.Parameters.AddWithValue("@Search", cleanSearch);
        command.Parameters.AddWithValue("@Like", $"%{cleanSearch}%");
        using var reader = command.ExecuteReader();
        var list = new List<GIGContribution>();
        while (reader.Read()) list.Add(Map(reader));
        return list;
    }

    public GIGContribution? GetById(long id)
    {
        using var connection = DatabaseManager.OpenConnection();
        using var command = connection.CreateCommand();
        command.CommandText = "SELECT ContributionID,MemberID,ContributionDate,Amount,Remarks FROM GIGContribution WHERE ContributionID=@Id;";
        command.Parameters.AddWithValue("@Id", id);
        using var reader = command.ExecuteReader();
        return reader.Read() ? Map(reader) : null;
    }

    public long Add(GIGContribution contribution)
    {
        using var connection = DatabaseManager.OpenConnection();
        using var command = connection.CreateCommand();
        command.CommandText = @"
INSERT INTO GIGContribution(MemberID,ContributionDate,Amount,Remarks)
VALUES(@MemberID,@Date,@Amount,@Remarks);
SELECT last_insert_rowid();";
        AddParams(command, contribution);
        return Convert.ToInt64(command.ExecuteScalar());
    }

    public void Update(GIGContribution contribution)
    {
        using var connection = DatabaseManager.OpenConnection();
        using var command = connection.CreateCommand();
        command.CommandText = "UPDATE GIGContribution SET ContributionDate=@Date,Amount=@Amount,Remarks=@Remarks WHERE ContributionID=@Id AND MemberID=@MemberID;";
        AddParams(command, contribution);
        command.Parameters.AddWithValue("@Id", contribution.ContributionID);
        if (command.ExecuteNonQuery() != 1) throw new InvalidOperationException("Contribution was not found.");
    }

    public void Delete(long id)
    {
        using var connection = DatabaseManager.OpenConnection();
        using var command = connection.CreateCommand();
        command.CommandText = "DELETE FROM GIGContribution WHERE ContributionID=@Id;";
        command.Parameters.AddWithValue("@Id", id);
        if (command.ExecuteNonQuery() != 1) throw new InvalidOperationException("Contribution was not found.");
    }

    public decimal GetTotalForMember(long memberId)
    {
        using var connection = DatabaseManager.OpenConnection();
        using var command = connection.CreateCommand();
        command.CommandText = "SELECT COALESCE(SUM(Amount),0) FROM GIGContribution WHERE MemberID=@MemberID;";
        command.Parameters.AddWithValue("@MemberID", memberId);
        return Convert.ToDecimal(command.ExecuteScalar());
    }

    private static void AddParams(SQLiteCommand command, GIGContribution contribution)
    {
        command.Parameters.AddWithValue("@MemberID", contribution.MemberID);
        command.Parameters.AddWithValue("@Date", contribution.ContributionDate.ToString("yyyy-MM-dd", System.Globalization.CultureInfo.InvariantCulture));
        command.Parameters.AddWithValue("@Amount", contribution.Amount);
        command.Parameters.AddWithValue("@Remarks", string.IsNullOrWhiteSpace(contribution.Remarks) ? DBNull.Value : contribution.Remarks.Trim());
    }

    private static GIGContribution Map(SQLiteDataReader reader) => new()
    {
        ContributionID = Convert.ToInt64(reader["ContributionID"]),
        MemberID = Convert.ToInt64(reader["MemberID"]),
        ContributionDate = ParseDate(reader["ContributionDate"]),
        Amount = Convert.ToDecimal(reader["Amount"]),
        Remarks = reader["Remarks"] == DBNull.Value ? null : Convert.ToString(reader["Remarks"])
    };

    private static DateTime ParseDate(object value)
    {
        var text = Convert.ToString(value) ?? string.Empty;
        if (DateTime.TryParseExact(text, "yyyy-MM-dd", System.Globalization.CultureInfo.InvariantCulture,
                System.Globalization.DateTimeStyles.None, out var parsed)) return parsed;
        if (DateTime.TryParse(text, out parsed)) return parsed.Date;
        throw new FormatException($"Invalid stored contribution date: '{text}'.");
    }
}
