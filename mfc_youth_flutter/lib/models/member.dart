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
  final String accessLevel;
  final String status;
  final List<String> services;
  final String? birthDate;
  final String? address;
  final String? school;
  final String? gradeLevel;
  final String? academicTrack;
  final String? avatarUrl;
  final String? emergencyContactName;
  final String? emergencyContactPhone;
  final String? firstAttendedYouthCamp;

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
    this.accessLevel = 'member',
    this.status = 'Active',
    this.services = const [],
    this.birthDate,
    this.address,
    this.school,
    this.gradeLevel,
    this.academicTrack,
    this.avatarUrl,
    this.emergencyContactName,
    this.emergencyContactPhone,
    this.firstAttendedYouthCamp,
  });

  String get fullName {
    final parts = [firstName, middleName, lastName].where((p) => p != null && p.trim().isNotEmpty);
    return parts.join(' ');
  }

  String get name => fullName;

  bool get isActive => status.toLowerCase() == 'active';

  int? get age {
    if (birthDate == null || birthDate!.isEmpty) return null;
    try {
      final dob = DateTime.parse(birthDate!);
      final now = DateTime.now();
      int calculated = now.year - dob.year;
      if (now.month < dob.month || (now.month == dob.month && now.day < dob.day)) {
        calculated--;
      }
      return calculated >= 0 ? calculated : null;
    } catch (_) {
      return null;
    }
  }

  String get ministryCategory {
    final role = accessLevel.toLowerCase();
    if (role == 'mfc_high_servant') return 'High Servant';
    if (role == 'lit_servant') return 'LIT Servant';
    if (role == 'campus_servant') return 'Campus Servant';
    if (role == 'area_kids_servant') return 'Kids Servant';
    if (role == 'chapter_servant') return 'Chapter Servant';

    final memberAge = age;
    if (memberAge != null) {
      if (memberAge >= 4 && memberAge <= 12) return 'Kids (4-12)';
      if (memberAge >= 13 && memberAge <= 21) return 'Youth (13-21)';
      if (memberAge > 21) return 'Young Adult';
    }
    return 'Youth';
  }

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
      phone: json['phone'] as String? ?? json['contact_number'] as String? ?? json['mobile'] as String?,
      gender: json['gender'] as String?,
      chapterId: json['chapter_id'] ?? json['chapterId'],
      chapterName: json['chapter_name'] as String? ?? json['chapterName'] as String?,
      accessLevel: json['access_level'] as String? ?? json['accessLevel'] as String? ?? 'member',
      status: json['status'] as String? ?? 'Active',
      services: parsedServices,
      birthDate: json['birth_date'] as String? ?? json['birthDate'] as String?,
      address: json['address'] as String?,
      school: json['school'] as String?,
      gradeLevel: json['grade_level'] as String? ?? json['gradeLevel'] as String?,
      academicTrack: json['academic_track'] as String? ?? json['academicTrack'] as String?,
      avatarUrl: json['avatar_url'] as String? ?? json['avatarUrl'] as String?,
      emergencyContactName: json['emergency_contact_name'] as String? ?? json['emergencyContactName'] as String?,
      emergencyContactPhone: json['emergency_contact_phone'] as String? ?? json['emergencyContactPhone'] as String?,
      firstAttendedYouthCamp: json['first_attended_youth_camp'] as String? ?? json['firstAttendedYouthCamp'] as String?,
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
      'contact_number': phone,
      'gender': gender,
      'chapter_id': chapterId,
      'chapter_name': chapterName,
      'access_level': accessLevel,
      'status': status,
      'services': services,
      'birth_date': birthDate,
      'address': address,
      'school': school,
      'grade_level': gradeLevel,
      'academic_track': academicTrack,
      'avatar_url': avatarUrl,
      'emergency_contact_name': emergencyContactName,
      'emergency_contact_phone': emergencyContactPhone,
      'first_attended_youth_camp': firstAttendedYouthCamp,
    };
  }
}
