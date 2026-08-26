namespace MFCYouthAreaManagementSystem.Models;
public sealed class Service { public long ServiceID { get; set; } public string ServiceName { get; set; } = ""; public int DisplayOrder { get; set; } public int MemberCount { get; set; } public override string ToString() => ServiceName; }
