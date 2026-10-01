import '../constants/app_constants.dart';

class UserSession {
  final String? userId;
  final dynamic memberId;
  final String email;
  final String name;
  final String role;
  final String? areaId;
  final String areaName;
  final dynamic chapterId;
  final bool mustChangePassword;
  final bool needsAreaSetup;
  final String? accessToken;
  final String? refreshToken;
  final int? expiresAt;
  final bool backendAuth;
  final bool demo;

  UserSession({
    this.userId,
    this.memberId,
    required this.email,
    required this.name,
    required this.role,
    this.areaId,
    this.areaName = '',
    this.chapterId,
    this.mustChangePassword = false,
    this.needsAreaSetup = false,
    this.accessToken,
    this.refreshToken,
    this.expiresAt,
    this.backendAuth = true,
    this.demo = false,
  });

  bool get isLeadership => AppConstants.isLeadership(role);
  bool get isMemberOnly => role == 'member';
  String get roleDisplay => AppConstants.roleLabels[role] ?? 'Servant Leader';
  String get roleLabel => roleDisplay;

  factory UserSession.fromJson(Map<String, dynamic> json) {
    final role = AppConstants.normalizeRole(json['role'] as String?);
    final areaId = json['areaId'] ?? json['area_id'];
    final isLeadershipRole = AppConstants.isLeadership(role);
    
    return UserSession(
      userId: json['userId']?.toString() ?? json['id']?.toString(),
      memberId: json['memberId'] ?? json['member_id'],
      email: json['email'] as String? ?? '',
      name: json['name'] as String? ?? json['email'] as String? ?? 'Servant Leader',
      role: role,
      areaId: areaId?.toString(),
      areaName: json['areaName'] as String? ?? json['area_name'] as String? ?? '',
      chapterId: json['chapterId'] ?? json['chapter_id'],
      mustChangePassword: json['mustChangePassword'] == true || json['must_change_password'] == true,
      needsAreaSetup: json['needsAreaSetup'] == true || (isLeadershipRole && (areaId == null || areaId.toString().isEmpty)),
      accessToken: json['accessToken'] as String? ?? json['access_token'] as String?,
      refreshToken: json['refreshToken'] as String? ?? json['refresh_token'] as String?,
      expiresAt: json['expiresAt'] is int ? json['expiresAt'] as int : null,
      backendAuth: json['backendAuth'] != false,
      demo: json['demo'] == true,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'userId': userId,
      'memberId': memberId,
      'email': email,
      'name': name,
      'role': role,
      'areaId': areaId,
      'areaName': areaName,
      'chapterId': chapterId,
      'mustChangePassword': mustChangePassword,
      'needsAreaSetup': needsAreaSetup,
      'accessToken': accessToken,
      'refreshToken': refreshToken,
      'expiresAt': expiresAt,
      'backendAuth': backendAuth,
      'demo': demo,
    };
  }

  UserSession copyWith({
    String? userId,
    dynamic memberId,
    String? email,
    String? name,
    String? role,
    String? areaId,
    String? areaName,
    dynamic chapterId,
    bool? mustChangePassword,
    bool? needsAreaSetup,
    String? accessToken,
    String? refreshToken,
    int? expiresAt,
    bool? backendAuth,
    bool? demo,
  }) {
    return UserSession(
      userId: userId ?? this.userId,
      memberId: memberId ?? this.memberId,
      email: email ?? this.email,
      name: name ?? this.name,
      role: role ?? this.role,
      areaId: areaId ?? this.areaId,
      areaName: areaName ?? this.areaName,
      chapterId: chapterId ?? this.chapterId,
      mustChangePassword: mustChangePassword ?? this.mustChangePassword,
      needsAreaSetup: needsAreaSetup ?? this.needsAreaSetup,
      accessToken: accessToken ?? this.accessToken,
      refreshToken: refreshToken ?? this.refreshToken,
      expiresAt: expiresAt ?? this.expiresAt,
      backendAuth: backendAuth ?? this.backendAuth,
      demo: demo ?? this.demo,
    );
  }
}
