class EventParticipant {
  final dynamic id;
  final dynamic eventId;
  final dynamic memberId;
  final String? memberName;
  final String? modeOfPayment;
  final String paymentStatus;
  final bool attended;
  final String? registeredAt;
  final bool isGuest;
  final String? guestName;
  final String? guestContact;
  final String? chapterName;

  EventParticipant({
    required this.id,
    required this.eventId,
    this.memberId,
    this.memberName,
    this.modeOfPayment,
    this.paymentStatus = 'Unpaid',
    this.attended = false,
    this.registeredAt,
    this.isGuest = false,
    this.guestName,
    this.guestContact,
    this.chapterName,
  });

  bool get isPaid => paymentStatus.toLowerCase() == 'paid';
  bool get isWaived => paymentStatus.toLowerCase() == 'waived';

  String get displayName {
    if (isGuest && guestName != null && guestName!.trim().isNotEmpty) {
      return guestName!.trim();
    }
    if (memberName != null && memberName!.trim().isNotEmpty) {
      return memberName!.trim();
    }
    return memberId != null ? 'Member #$memberId' : 'Guest #$id';
  }

  EventParticipant copyWith({
    dynamic id,
    dynamic eventId,
    dynamic memberId,
    String? memberName,
    String? modeOfPayment,
    String? paymentStatus,
    bool? attended,
    String? registeredAt,
    bool? isGuest,
    String? guestName,
    String? guestContact,
    String? chapterName,
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
      isGuest: isGuest ?? this.isGuest,
      guestName: guestName ?? this.guestName,
      guestContact: guestContact ?? this.guestContact,
      chapterName: chapterName ?? this.chapterName,
    );
  }

  factory EventParticipant.fromJson(Map<String, dynamic> json) {
    final isGuestFlag = json['is_guest'] == true ||
        json['isGuest'] == true ||
        (json['member_id'] == null && json['guest_name'] != null);

    return EventParticipant(
      id: json['id'],
      eventId: json['event_id'] ?? json['eventId'],
      memberId: json['member_id'] ?? json['memberId'],
      memberName: json['member_name'] as String? ?? json['memberName'] as String?,
      modeOfPayment: json['mode_of_payment'] as String? ?? json['modeOfPayment'] as String?,
      paymentStatus: json['payment_status'] as String? ?? json['paymentStatus'] as String? ?? 'Unpaid',
      attended: json['attended'] == true,
      registeredAt: json['registered_at'] as String? ?? json['registeredAt'] as String?,
      isGuest: isGuestFlag,
      guestName: json['guest_name'] as String? ?? json['guestName'] as String?,
      guestContact: json['guest_contact'] as String? ?? json['guestContact'] as String?,
      chapterName: json['chapter_name'] as String? ?? json['chapterName'] as String?,
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
      'is_guest': isGuest,
      if (guestName != null) 'guest_name': guestName,
      if (guestContact != null) 'guest_contact': guestContact,
      if (chapterName != null) 'chapter_name': chapterName,
    };
  }
}
