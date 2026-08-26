namespace MFCYouthAreaManagementSystem.Models;
public sealed class Chapter { public long ChapterID { get; set; } public string ChapterName { get; set; } = ""; public int MemberCount { get; set; } public override string ToString() => ChapterName; }
