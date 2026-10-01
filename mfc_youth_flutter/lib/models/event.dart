class Event {
  final dynamic id;
  final String title;
  final String? description;
  final String? date;
  final String? time;
  final String? venue;
  final double fee;
  final String? areaId;
  final int peopleAttended;
  final int registeredCount;

  Event({
    required this.id,
    required this.title,
    this.description,
    this.date,
    this.time,
    this.venue,
    this.fee = 0.0,
    this.areaId,
    this.peopleAttended = 0,
    this.registeredCount = 0,
  });

  factory Event.fromJson(Map<String, dynamic> json) {
    double parsedFee = 0.0;
    if (json['fee'] is num) {
      parsedFee = (json['fee'] as num).toDouble();
    } else if (json['fee'] != null) {
      parsedFee = double.tryParse(json['fee'].toString()) ?? 0.0;
    }

    return Event(
      id: json['id'],
      title: json['title'] as String? ?? json['name'] as String? ?? 'Untitled Event',
      description: json['description'] as String?,
      date: json['date'] as String? ?? json['event_date'] as String?,
      time: json['time'] as String?,
      venue: json['venue'] as String? ?? json['location'] as String?,
      fee: parsedFee,
      areaId: json['area_id']?.toString() ?? json['areaId']?.toString(),
      peopleAttended: json['people_attended'] is int ? json['people_attended'] as int : (json['peopleAttended'] is int ? json['peopleAttended'] as int : 0),
      registeredCount: json['registered_count'] is int ? json['registered_count'] as int : 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'description': description,
      'date': date,
      'time': time,
      'venue': venue,
      'fee': fee,
      'area_id': areaId,
      'people_attended': peopleAttended,
    };
  }
}
