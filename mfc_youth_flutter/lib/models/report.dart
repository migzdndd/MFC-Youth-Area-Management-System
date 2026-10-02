class ActivityReport {
  final dynamic id;
  final String title;
  final String reportType;
  final String? activityDate;
  final dynamic chapterId;
  final String? chapterName;
  final int participantCount;
  final String? location;
  final String? notes;
  final String? submittedBy;
  final String? submittedAt;

  ActivityReport({
    required this.id,
    required this.title,
    this.reportType = 'Household',
    this.activityDate,
    this.chapterId,
    this.chapterName,
    this.participantCount = 0,
    this.location,
    this.notes,
    this.submittedBy,
    this.submittedAt,
  });

  String get activityType => reportType;
  String? get date => activityDate;
  int get attendeesCount => participantCount;

  factory ActivityReport.fromJson(Map<String, dynamic> json) {
    return ActivityReport(
      id: json['id'],
      title: json['title'] as String? ?? 'Untitled Activity',
      reportType: json['report_type'] as String? ?? json['activity_type'] as String? ?? json['type'] as String? ?? 'Household',
      activityDate: json['activity_date'] as String? ?? json['date'] as String?,
      chapterId: json['chapter_id'] ?? json['chapterId'],
      chapterName: json['chapter_name'] as String? ?? json['chapterName'] as String? ?? json['chapter_name_snapshot'] as String?,
      participantCount: json['participant_count'] is int
          ? json['participant_count'] as int
          : (json['attendees_count'] is int
              ? json['attendees_count'] as int
              : (json['attendees'] is int ? json['attendees'] as int : 0)),
      location: json['location'] as String?,
      notes: json['notes'] as String? ?? json['remarks'] as String?,
      submittedBy: json['prepared_by_name'] as String? ?? json['submitted_by'] as String? ?? json['author'] as String?,
      submittedAt: json['created_at'] as String? ?? json['submitted_at'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'report_type': reportType,
      'activity_date': activityDate,
      'chapter_id': chapterId,
      'chapter_name': chapterName,
      'participant_count': participantCount,
      'location': location,
      'notes': notes,
    };
  }
}
