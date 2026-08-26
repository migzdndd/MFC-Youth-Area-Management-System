using MFCYouthAreaManagementSystem.Database;
using MFCYouthAreaManagementSystem.Models;

namespace MFCYouthAreaManagementSystem.Repositories;

public sealed class ServiceRepository
{
    public List<Service> GetAll(string search = "")
    {
        var cleanSearch = search.Trim();
        using var connection = DatabaseManager.OpenConnection();
        using var command = connection.CreateCommand();
        command.CommandText = @"
SELECT ServiceID, ServiceName, DisplayOrder, TotalMembers
FROM ServiceStatistics
WHERE @Search = '' OR ServiceName LIKE @Like
ORDER BY DisplayOrder, ServiceName COLLATE NOCASE;";
        command.Parameters.AddWithValue("@Search", cleanSearch);
        command.Parameters.AddWithValue("@Like", $"%{cleanSearch}%");
        using var reader = command.ExecuteReader();
        var result = new List<Service>();
        while (reader.Read())
        {
            result.Add(new Service
            {
                ServiceID = Convert.ToInt64(reader["ServiceID"]),
                ServiceName = Convert.ToString(reader["ServiceName"]) ?? string.Empty,
                DisplayOrder = Convert.ToInt32(reader["DisplayOrder"]),
                MemberCount = Convert.ToInt32(reader["TotalMembers"])
            });
        }
        return result;
    }

    public Service? GetById(long serviceId)
    {
        using var connection = DatabaseManager.OpenConnection();
        using var command = connection.CreateCommand();
        command.CommandText = @"
SELECT ServiceID, ServiceName, DisplayOrder, TotalMembers
FROM ServiceStatistics
WHERE ServiceID = @ServiceID;";
        command.Parameters.AddWithValue("@ServiceID", serviceId);
        using var reader = command.ExecuteReader();
        if (!reader.Read()) return null;
        return new Service
        {
            ServiceID = Convert.ToInt64(reader["ServiceID"]),
            ServiceName = Convert.ToString(reader["ServiceName"]) ?? string.Empty,
            DisplayOrder = Convert.ToInt32(reader["DisplayOrder"]),
            MemberCount = Convert.ToInt32(reader["TotalMembers"])
        };
    }

    public HashSet<long> GetServicesForMember(long memberId)
    {
        using var connection = DatabaseManager.OpenConnection();
        using var command = connection.CreateCommand();
        command.CommandText = "SELECT ServiceID FROM MemberService WHERE MemberID=@MemberID;";
        command.Parameters.AddWithValue("@MemberID", memberId);
        using var reader = command.ExecuteReader();
        var ids = new HashSet<long>();
        while (reader.Read()) ids.Add(Convert.ToInt64(reader[0]));
        return ids;
    }

    public void UpdateMemberServices(long memberId, IEnumerable<long> serviceIds)
    {
        var requestedIds = serviceIds.Distinct().ToArray();
        using var connection = DatabaseManager.OpenConnection();
        using var transaction = connection.BeginTransaction();

        using (var memberCheck = connection.CreateCommand())
        {
            memberCheck.Transaction = transaction;
            memberCheck.CommandText = "SELECT COUNT(*) FROM Member WHERE MemberID=@MemberID;";
            memberCheck.Parameters.AddWithValue("@MemberID", memberId);
            if (Convert.ToInt32(memberCheck.ExecuteScalar()) != 1)
                throw new InvalidOperationException("Member was not found.");
        }

        if (requestedIds.Length > 0)
        {
            using var serviceCheck = connection.CreateCommand();
            serviceCheck.Transaction = transaction;
            serviceCheck.CommandText = $"SELECT COUNT(*) FROM Service WHERE ServiceID IN ({string.Join(",", requestedIds.Select((_, i) => "@Service" + i))});";
            for (var i = 0; i < requestedIds.Length; i++) serviceCheck.Parameters.AddWithValue("@Service" + i, requestedIds[i]);
            if (Convert.ToInt32(serviceCheck.ExecuteScalar()) != requestedIds.Length)
                throw new InvalidOperationException("One or more selected Services no longer exist.");
        }

        using (var delete = connection.CreateCommand())
        {
            delete.Transaction = transaction;
            delete.CommandText = "DELETE FROM MemberService WHERE MemberID=@MemberID;";
            delete.Parameters.AddWithValue("@MemberID", memberId);
            delete.ExecuteNonQuery();
        }

        foreach (var serviceId in requestedIds)
        {
            using var insert = connection.CreateCommand();
            insert.Transaction = transaction;
            insert.CommandText = "INSERT INTO MemberService(MemberID,ServiceID) VALUES(@MemberID,@ServiceID);";
            insert.Parameters.AddWithValue("@MemberID", memberId);
            insert.Parameters.AddWithValue("@ServiceID", serviceId);
            insert.ExecuteNonQuery();
        }

        transaction.Commit();
    }

    public int GetTotalCount()
    {
        using var connection = DatabaseManager.OpenConnection();
        using var command = connection.CreateCommand();
        command.CommandText = "SELECT COUNT(*) FROM Service;";
        return Convert.ToInt32(command.ExecuteScalar());
    }
}
