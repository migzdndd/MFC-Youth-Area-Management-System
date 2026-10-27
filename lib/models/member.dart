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
  final String? emergencyContactRelationship;
  final String? firstAttendedYouthCamp;
  final String? mfcId;
  final String? bloodType;
  final String? medicalNotes;
  final bool isBaptized;
  final bool isFirstCommunion;
  final bool isConfirmed;

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
    this.emergencyContactRelationship,
    this.firstAttendedYouthCamp,
    this.mfcId,
    this.bloodType,
    this.medicalNotes,
    this.isBaptized = false,
    this.isFirstCommunion = false,
    this.isConfirmed = false,
  });

  String get fullName {
    final parts = [firstName, middleName, lastName].where((p) => p != null && p.trim().isNotEmpty);
    return parts.join(' ');
  }

  String get name => fullName;

  bool get isActive => status.toLowerCase() == 'active';

  bool get isServant {
    final role = accessLevel.toLowerCase();
    return role.isNotEmpty && role != 'member' && role != 'general_member';
  }

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
    if (role == 'national_coordinator') return 'National Coordinator';
    if (role == 'couple_coordinator') return 'Couple Coordinator';
    if (role == 'area_servant') return 'Area Servant';
    if (role == 'mfc_high_servant') return 'MFC High Servant';
    if (role == 'lit_servant') return 'Area LIT Servant';
    if (role == 'campus_servant') return 'Campus Servant';
    if (role == 'area_kids_servant') return 'Area Kids Servant';
    if (role == 'chapter_servant') return 'Chapter Servant';
    if (role == 'household_servant') return 'Household Servant';
    if (role == 'unit_servant') return 'Unit Servant';

    if (academicTrack != null && academicTrack!.trim().isNotEmpty) {
      return academicTrack!.trim();
    }
    if (gradeLevel != null && gradeLevel!.trim().isNotEmpty) {
      return gradeLevel!.trim();
    }
    return 'Youth Member';
  }

  List<String> get sacramentsList {
    final list = <String>[];
    if (isBaptized) list.add('Baptism');
    if (isFirstCommunion) list.add('First Communion');
    if (isConfirmed) list.add('Confirmation');
    return list;
  }

  String get sacramentsSummary {
    final list = sacramentsList;
    return list.isEmpty ? 'None recorded' : list.join(', ');
  }

  Member copyWith({
    dynamic id,
    String? firstName,
    String? middleName,
    String? lastName,
    String? nickname,
    String? email,
    String? phone,
    String? gender,
    dynamic chapterId,
    String? chapterName,
    String? accessLevel,
    String? status,
    List<String>? services,
    String? birthDate,
    String? address,
    String? school,
    String? gradeLevel,
    String? academicTrack,
    String? avatarUrl,
    String? emergencyContactName,
    String? emergencyContactPhone,
    String? emergencyContactRelationship,
    String? firstAttendedYouthCamp,
    String? mfcId,
    String? bloodType,
    String? medicalNotes,
    bool? isBaptized,
    bool? isFirstCommunion,
    bool? isConfirmed,
  }) {
    return Member(
      id: id ?? this.id,
      firstName: firstName ?? this.firstName,
      middleName: middleName ?? this.middleName,
      lastName: lastName ?? this.lastName,
      nickname: nickname ?? this.nickname,
      email: email ?? this.email,
      phone: phone ?? this.phone,
      gender: gender ?? this.gender,
      chapterId: chapterId ?? this.chapterId,
      chapterName: chapterName ?? this.chapterName,
      accessLevel: accessLevel ?? this.accessLevel,
      status: status ?? this.status,
      services: services ?? this.services,
      birthDate: birthDate ?? this.birthDate,
      address: address ?? this.address,
      school: school ?? this.school,
      gradeLevel: gradeLevel ?? this.gradeLevel,
      academicTrack: academicTrack ?? this.academicTrack,
      avatarUrl: avatarUrl ?? this.avatarUrl,
      emergencyContactName: emergencyContactName ?? this.emergencyContactName,
      emergencyContactPhone: emergencyContactPhone ?? this.emergencyContactPhone,
      emergencyContactRelationship: emergencyContactRelationship ?? this.emergencyContactRelationship,
      firstAttendedYouthCamp: firstAttendedYouthCamp ?? this.firstAttendedYouthCamp,
      mfcId: mfcId ?? this.mfcId,
      bloodType: bloodType ?? this.bloodType,
      medicalNotes: medicalNotes ?? this.medicalNotes,
      isBaptized: isBaptized ?? this.isBaptized,
      isFirstCommunion: isFirstCommunion ?? this.isFirstCommunion,
      isConfirmed: isConfirmed ?? this.isConfirmed,
    );
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
      emergencyContactRelationship: json['emergency_contact_relationship'] as String? ?? json['emergencyContactRelationship'] as String?,
      firstAttendedYouthCamp: json['first_attended_youth_camp'] as String? ?? json['firstAttendedYouthCamp'] as String?,
      mfcId: json['mfc_id'] as String? ?? json['mfcId'] as String?,
      bloodType: json['blood_type'] as String? ?? json['bloodType'] as String?,
      medicalNotes: json['medical_notes'] as String? ?? json['medicalNotes'] as String?,
      isBaptized: json['is_baptized'] == true || json['isBaptized'] == true,
      isFirstCommunion: json['is_first_communion'] == true || json['isFirstCommunion'] == true,
      isConfirmed: json['is_confirmed'] == true || json['isConfirmed'] == true,
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
      'emergency_contact_relationship': emergencyContactRelationship,
      'first_attended_youth_camp': firstAttendedYouthCamp,
      'mfc_id': mfcId,
      'blood_type': bloodType,
      'medical_notes': medicalNotes,
      'is_baptized': isBaptized,
      'is_first_communion': isFirstCommunion,
      'is_confirmed': isConfirmed,
    };
  }
}
