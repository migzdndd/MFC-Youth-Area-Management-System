class ActivityReport {
  final dynamic id;
  final String title;
  final String? activityType;
  final String? date;
  final dynamic chapterId;
  final String? chapterName;
  final int attendeesCount;
  final String? notes;
  final String? submittedBy;
  final String? submittedAt;

  ActivityReport({
    required this.id,
    required this.title,
    this.activityType,
    this.date,
    this.chapterId,
    this.chapterName,
    this.attendeesCount = 0,
    this.notes,
    this.submittedBy,
    this.submittedAt,
  });

  factory ActivityReport.fromJson(Map<String, dynamic> json) {
    return ActivityReport(
      id: json['id'],
      title: json['title'] as String? ?? 'Untitled Activity',
      activityType: json['activity_type'] as String? ?? json['type'] as String?,
      date: json['date'] as String? ?? json['activity_date'] as String?,
      chapterId: json['chapter_id'] ?? json['chapterId'],
      chapterName: json['chapter_name'] as String? ?? json['chapterName'] as String?,
      attendeesCount: json['attendees_count'] is int ? json['attendees_count'] as int : (json['attendees'] is int ? json['attendees'] as int : 0),
      notes: json['notes'] as String? ?? json['remarks'] as String?,
      submittedBy: json['submitted_by'] as String? ?? json['author'] as String?,
      submittedAt: json['submitted_at'] as String? ?? json['created_at'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'activity_type': activityType,
      'date': date,
      'chapter_id': chapterId,
      'attendees_count': attendeesCount,
      'notes': notes,
    };
  }
}
