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
    final user = (json['user'] is Map<String, dynamic>) ? json['user'] as Map<String, dynamic> : json;
    final sess = (json['session'] is Map<String, dynamic>) ? json['session'] as Map<String, dynamic> : json;

    final role = AppConstants.normalizeRole((user['role'] ?? json['role']) as String?);
    final areaId = user['areaId'] ?? user['area_id'] ?? json['areaId'] ?? json['area_id'];
    final isLeadershipRole = AppConstants.isLeadership(role);

    return UserSession(
      userId: user['id']?.toString() ?? user['userId']?.toString() ?? json['userId']?.toString() ?? json['id']?.toString(),
      memberId: user['memberId'] ?? user['member_id'] ?? json['memberId'] ?? json['member_id'],
      email: (user['email'] ?? json['email']) as String? ?? '',
      name: (user['name'] ?? user['display_name'] ?? json['name'] ?? user['email'] ?? json['email']) as String? ?? 'Servant Leader',
      role: role,
      areaId: areaId?.toString(),
      areaName: (user['areaName'] ?? user['area_name'] ?? json['areaName'] ?? json['area_name']) as String? ?? '',
      chapterId: user['chapterId'] ?? user['chapter_id'] ?? json['chapterId'] ?? json['chapter_id'],
      mustChangePassword: user['mustChangePassword'] == true || user['must_change_password'] == true || json['mustChangePassword'] == true,
      needsAreaSetup: json['needsAreaSetup'] == true || (isLeadershipRole && (areaId == null || areaId.toString().isEmpty)),
      accessToken: (sess['accessToken'] ?? sess['access_token'] ?? json['accessToken'] ?? json['access_token']) as String?,
      refreshToken: (sess['refreshToken'] ?? sess['refresh_token'] ?? json['refreshToken'] ?? json['refresh_token']) as String?,
      expiresAt: sess['expiresAt'] is int
          ? sess['expiresAt'] as int
          : (sess['expires_at'] is int ? sess['expires_at'] as int : (json['expiresAt'] is int ? json['expiresAt'] as int : null)),
      backendAuth: json['backendAuth'] != false,
      demo: false,
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
