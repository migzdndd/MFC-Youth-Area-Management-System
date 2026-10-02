class EventParticipant {
  final dynamic id;
  final dynamic eventId;
  final dynamic memberId;
  final String? memberName;
  final String? modeOfPayment;
  final String paymentStatus;
  final bool attended;
  final String? registeredAt;

  EventParticipant({
    required this.id,
    required this.eventId,
    required this.memberId,
    this.memberName,
    this.modeOfPayment,
    this.paymentStatus = 'Unpaid',
    this.attended = false,
    this.registeredAt,
  });

  bool get isPaid => paymentStatus.toLowerCase() == 'paid';
  bool get isWaived => paymentStatus.toLowerCase() == 'waived';

  EventParticipant copyWith({
    dynamic id,
    dynamic eventId,
    dynamic memberId,
    String? memberName,
    String? modeOfPayment,
    String? paymentStatus,
    bool? attended,
    String? registeredAt,
  }) {
    return EventParticipant(
      id: id ?? this.id,
      eventId: eventId ?? this.eventId,
      memberId: memberId ?? this.memberId,
      memberName: memberName ?? this.memberName,
      modeOfPayment: modeOfPayment ?? this.modeOfPayment,
      paymentStatus: paymentStatus ?? this.paymentStatus,
      attended: attended ?? this.attended,
      registeredAt: registeredAt ?? this.registeredAt,
    );
  }

  factory EventParticipant.fromJson(Map<String, dynamic> json) {
    return EventParticipant(
      id: json['id'],
      eventId: json['event_id'] ?? json['eventId'],
      memberId: json['member_id'] ?? json['memberId'],
      memberName: json['member_name'] as String? ?? json['memberName'] as String?,
      modeOfPayment: json['mode_of_payment'] as String? ?? json['modeOfPayment'] as String?,
      paymentStatus: json['payment_status'] as String? ?? json['paymentStatus'] as String? ?? 'Unpaid',
      attended: json['attended'] == true,
      registeredAt: json['registered_at'] as String? ?? json['registeredAt'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'event_id': eventId,
      'member_id': memberId,
      if (memberName != null) 'member_name': memberName,
      'mode_of_payment': modeOfPayment,
      'payment_status': paymentStatus,
      'attended': attended,
      'registered_at': registeredAt,
    };
  }
}
