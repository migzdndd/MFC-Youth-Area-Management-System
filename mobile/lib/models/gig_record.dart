class GigRecord {
  final dynamic id;
  final dynamic memberId;
  final String? memberName;
  final dynamic chapterId;
  final String? chapterName;
  final double amount;
  final String? fundType; // 'Tithes' | 'Love Offering' | 'Mission'
  final String? date;
  final String? paymentMethod;
  final String? notes;

  GigRecord({
    required this.id,
    this.memberId,
    this.memberName,
    this.chapterId,
    this.chapterName,
    required this.amount,
    this.fundType = 'Tithes',
    this.date,
    this.paymentMethod,
    this.notes,
  });

  factory GigRecord.fromJson(Map<String, dynamic> json) {
    double parsed = 0.0;
    if (json['amount'] is num) {
      parsed = (json['amount'] as num).toDouble();
    } else if (json['amount'] != null) {
      parsed = double.tryParse(json['amount'].toString()) ?? 0.0;
    }

    return GigRecord(
      id: json['id'],
      memberId: json['member_id'] ?? json['memberId'],
      memberName: json['member_name'] as String? ?? json['memberName'] as String?,
      chapterId: json['chapter_id'] ?? json['chapterId'],
      chapterName: json['chapter_name'] as String? ?? json['chapterName'] as String?,
      amount: parsed,
      fundType: json['fund_type'] as String? ?? json['type'] as String? ?? 'Tithes',
      date: json['date'] as String? ?? json['record_date'] as String?,
      paymentMethod: json['payment_method'] as String? ?? json['method'] as String?,
      notes: json['notes'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'member_id': memberId,
      'amount': amount,
      'fund_type': fundType,
      'date': date,
      'payment_method': paymentMethod,
      'notes': notes,
    };
  }
}
