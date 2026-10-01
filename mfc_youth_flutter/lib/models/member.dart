class Member {
  final dynamic id;
  final String firstName;
  final String? middleName;
  final String lastName;
  final String? nickname;
  final String? email;
  final String? phone;
  final String? gender;
  final dynamic chapterId;
  final String? chapterName;
  final String? accessLevel;
  final String status; // 'Active' | 'Inactive'
  final List<String> services;
  final String? birthDate;
  final String? address;

  Member({
    required this.id,
    required this.firstName,
    this.middleName,
    required this.lastName,
    this.nickname,
    this.email,
    this.phone,
    this.gender,
    this.chapterId,
    this.chapterName,
    this.accessLevel,
    this.status = 'Active',
    this.services = const [],
    this.birthDate,
    this.address,
  });

  String get fullName {
    final parts = [firstName, middleName, lastName].where((p) => p != null && p.trim().isNotEmpty);
    return parts.join(' ');
  }

  String get name => fullName;

  bool get isActive => status.toLowerCase() == 'active';

  factory Member.fromJson(Map<String, dynamic> json) {
    List<String> parsedServices = [];
    if (json['services'] is List) {
      parsedServices = (json['services'] as List).map((s) => s.toString()).toList();
    } else if (json['service_roles'] is List) {
      parsedServices = (json['service_roles'] as List).map((s) => s.toString()).toList();
    }

    return Member(
      id: json['id'],
      firstName: json['first_name'] as String? ?? json['firstName'] as String? ?? '',
      middleName: json['middle_name'] as String? ?? json['middleName'] as String?,
      lastName: json['last_name'] as String? ?? json['lastName'] as String? ?? '',
      nickname: json['nickname'] as String?,
      email: json['email'] as String?,
      phone: json['phone'] as String? ?? json['mobile'] as String?,
      gender: json['gender'] as String?,
      chapterId: json['chapter_id'] ?? json['chapterId'],
      chapterName: json['chapter_name'] as String? ?? json['chapterName'] as String?,
      accessLevel: json['access_level'] as String? ?? json['accessLevel'] as String? ?? 'member',
      status: json['status'] as String? ?? 'Active',
      services: parsedServices,
      birthDate: json['birth_date'] as String? ?? json['birthDate'] as String?,
      address: json['address'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'first_name': firstName,
      'middle_name': middleName,
      'last_name': lastName,
      'nickname': nickname,
      'email': email,
      'phone': phone,
      'gender': gender,
      'chapter_id': chapterId,
      'chapter_name': chapterName,
      'access_level': accessLevel,
      'status': status,
      'services': services,
      'birth_date': birthDate,
      'address': address,
    };
  }
}
