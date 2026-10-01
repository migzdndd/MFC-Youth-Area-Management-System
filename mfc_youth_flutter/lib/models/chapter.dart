class Chapter {
  final dynamic id;
  final String name;
  final String? areaId;
  final String? servantName;
  final dynamic servantId;
  final int memberCount;

  Chapter({
    required this.id,
    required this.name,
    this.areaId,
    this.servantName,
    this.servantId,
    this.memberCount = 0,
  });

  factory Chapter.fromJson(Map<String, dynamic> json) {
    return Chapter(
      id: json['id'],
      name: json['name'] as String? ?? 'Unnamed Chapter',
      areaId: json['area_id']?.toString() ?? json['areaId']?.toString(),
      servantName: json['servant_name'] as String? ?? json['servantName'] as String?,
      servantId: json['servant_id'] ?? json['servantId'],
      memberCount: json['member_count'] is int ? json['member_count'] as int : (json['memberCount'] is int ? json['memberCount'] as int : 0),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'area_id': areaId,
      'servant_name': servantName,
      'servant_id': servantId,
      'member_count': memberCount,
    };
  }
}
