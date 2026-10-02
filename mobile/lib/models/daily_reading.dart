class DailyReading {
  final String date;
  final String title;
  final String? firstReadingRef;
  final String? firstReadingText;
  final String? psalmRef;
  final String? psalmText;
  final String? secondReadingRef;
  final String? secondReadingText;
  final String? gospelRef;
  final String? gospelText;

  DailyReading({
    required this.date,
    required this.title,
    this.firstReadingRef,
    this.firstReadingText,
    this.psalmRef,
    this.psalmText,
    this.secondReadingRef,
    this.secondReadingText,
    this.gospelRef,
    this.gospelText,
  });

  String get content {
    if (gospelText != null && gospelText!.trim().isNotEmpty) return gospelText!;
    if (firstReadingText != null && firstReadingText!.trim().isNotEmpty) return firstReadingText!;
    if (psalmText != null && psalmText!.trim().isNotEmpty) return psalmText!;
    return 'Reflect on today\'s liturgical readings and the presence of Christ.';
  }

  factory DailyReading.fromJson(Map<String, dynamic> json) {
    final first = json['firstReading'] as Map<String, dynamic>? ?? {};
    final psalm = json['psalm'] as Map<String, dynamic>? ?? {};
    final second = json['secondReading'] as Map<String, dynamic>? ?? {};
    final gospel = json['gospel'] as Map<String, dynamic>? ?? {};

    return DailyReading(
      date: json['date'] as String? ?? 'Today',
      title: json['title'] as String? ?? 'Daily Liturgical Mass Readings',
      firstReadingRef: first['reference'] as String?,
      firstReadingText: first['text'] as String?,
      psalmRef: psalm['reference'] as String?,
      psalmText: psalm['text'] as String?,
      secondReadingRef: second['reference'] as String?,
      secondReadingText: second['text'] as String?,
      gospelRef: gospel['reference'] as String?,
      gospelText: gospel['text'] as String?,
    );
  }
}
