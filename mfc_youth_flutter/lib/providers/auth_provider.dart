import 'package:flutter/material.dart';
import '../constants/app_constants.dart';
import '../models/user_session.dart';
import '../services/api_service.dart';
import '../services/storage_service.dart';
import '../services/supabase_service.dart';

class AuthProvider extends ChangeNotifier {
  final ApiService _api;
  final StorageService _storage;
  final SupabaseService _supabase = SupabaseService();

  UserSession? _session;
  bool _loading = true;
  String? _authError;

  AuthProvider(this._api, this._storage) {
    _initSession();
  }

  UserSession? get session => _session;
  bool get loading => _loading;
  String? get authError => _authError;
  bool get isAuthenticated => _session != null && (_session!.accessToken != null || _session!.userId != null);
  bool get needsAreaSetup => _session?.needsAreaSetup == true;
  String get role => _session?.role ?? 'member';
  String? get areaId => _session?.areaId;
  String get areaName => _session?.areaName ?? 'MFC Youth Area';
  bool get isLeadership => AppConstants.isLeadership(role);

  Future<void> _initSession() async {
    _session = await _storage.getSession();
    _loading = false;
    notifyListeners();
  }

  void clearError() {
    _authError = null;
    notifyListeners();
  }

  Future<bool> login(String email, String password) async {
    _loading = true;
    _authError = null;
    notifyListeners();

    final cleanEmail = email.trim().toLowerCase();

    // 1. Built-in demo shortcut
    if (cleanEmail == 'admin@mfcyouth.local' && password == 'admin123') {
      return loginDemo('area_servant');
    }

    // 2. Primary Backend Router Attempt
    try {
      final res = await _api.request(
        '/auth/login',
        method: 'POST',
        body: {'email': cleanEmail, 'password': password},
      );

      if (res['ok'] == true && (res['session'] != null || res['user'] != null)) {
        final newSession = UserSession.fromJson(res);
        _session = newSession;
        await _storage.saveSession(newSession);
        _loading = false;
        notifyListeners();
        return true;
      }
    } catch (e) {
      // Backend router fallback
    }

    // 3. Direct Supabase Auth Fallback
    try {
      final supSession = await _supabase.signInWithPassword(cleanEmail, password);
      if (supSession != null) {
        _session = supSession;
        await _storage.saveSession(supSession);
        _loading = false;
        notifyListeners();
        return true;
      }
    } catch (e) {
      _authError = e.toString().replaceAll('Exception: ', '');
    }

    _loading = false;
    _authError ??= 'Unable to connect to login server. Please verify your credentials.';
    notifyListeners();
    return false;
  }

  /// Register new Servant Leader with verification passcode check
  Future<bool> adminRegister({
    required String email,
    required String password,
    required String confirmPassword,
    required String verificationCode,
    required String displayName,
    required String role,
  }) async {
    _loading = true;
    _authError = null;
    notifyListeners();

    try {
      final res = await _api.request(
        '/auth/admin-register',
        method: 'POST',
        body: {
          'email': email.trim().toLowerCase(),
          'password': password,
          'confirmPassword': confirmPassword,
          'verificationCode': verificationCode.trim(),
          'displayName': displayName.trim(),
          'role': role.trim().toLowerCase(),
        },
      );

      if (res['ok'] == true && (res['session'] != null || res['user'] != null)) {
        final newSession = UserSession.fromJson(res);
        _session = newSession;
        await _storage.saveSession(newSession);
        _loading = false;
        notifyListeners();
        return true;
      } else {
        _authError = res['error']?.toString() ?? 'Registration failed.';
      }
    } catch (e) {
      _authError = e.toString().replaceAll('Exception: ', '');
    }

    _loading = false;
    notifyListeners();
    return false;
  }

  /// Youth Member Claiming existing record
  Future<Map<String, dynamic>> memberClaim({
    required String email,
    required String password,
  }) async {
    _loading = true;
    _authError = null;
    notifyListeners();

    try {
      final res = await _api.request(
        '/auth/member-claim',
        method: 'POST',
        body: {
          'email': email.trim().toLowerCase(),
          'password': password,
        },
      );

      if (res['ok'] == true) {
        if (res['session'] != null && res['user'] != null) {
          final newSession = UserSession.fromJson(res);
          _session = newSession;
          await _storage.saveSession(newSession);
        }
        _loading = false;
        notifyListeners();
        return res;
      } else {
        _authError = res['error']?.toString() ?? 'Unable to claim member account.';
      }
    } catch (e) {
      _authError = e.toString().replaceAll('Exception: ', '');
    }

    _loading = false;
    notifyListeners();
    return {'ok': false, 'error': _authError};
  }

  /// MFA Verification Challenge
  Future<Map<String, dynamic>> mfaChallenge(String factorId) async {
    try {
      final res = await _api.request(
        '/auth/mfa/challenge',
        method: 'POST',
        body: {'factorId': factorId},
        token: _session?.accessToken,
      );
      return res;
    } catch (e) {
      return {'ok': false, 'error': e.toString()};
    }
  }

  /// MFA Verification with TOTP Code
  Future<bool> mfaVerify({
    required String factorId,
    required String challengeId,
    required String code,
  }) async {
    try {
      final res = await _api.request(
        '/auth/mfa/verify',
        method: 'POST',
        body: {
          'factorId': factorId,
          'challengeId': challengeId,
          'code': code.trim(),
        },
        token: _session?.accessToken,
      );
      return res['ok'] == true;
    } catch (_) {
      return false;
    }
  }

  /// Forgot Password Request
  Future<Map<String, dynamic>> forgotPassword(String email) async {
    try {
      final res = await _api.request(
        '/auth/forgot-password',
        method: 'POST',
        body: {'email': email.trim().toLowerCase()},
      );
      return res;
    } catch (e) {
      return {'ok': false, 'error': e.toString()};
    }
  }

  /// Reset Password with Token
  Future<Map<String, dynamic>> resetPassword({
    required String tokenHash,
    required String newPassword,
  }) async {
    try {
      final res = await _api.request(
        '/auth/reset-password',
        method: 'POST',
        body: {
          'token_hash': tokenHash.trim(),
          'newPassword': newPassword,
        },
      );
      return res;
    } catch (e) {
      return {'ok': false, 'error': e.toString()};
    }
  }

  /// Change Password within App
  Future<Map<String, dynamic>> changePassword({
    required String currentPassword,
    required String newPassword,
  }) async {
    try {
      final res = await _api.request(
        '/auth/change-password',
        method: 'POST',
        body: {
          'currentPassword': currentPassword,
          'newPassword': newPassword,
        },
        token: _session?.accessToken,
      );
      if (res['ok'] == true && _session != null) {
        final updated = _session!.copyWith(mustChangePassword: false);
        _session = updated;
        await _storage.saveSession(updated);
        notifyListeners();
      }
      return res;
    } catch (e) {
      return {'ok': false, 'error': e.toString()};
    }
  }

  bool loginDemo([String roleKey = 'area_servant']) {
    final demoSession = UserSession(
      userId: 'demo-admin-id',
      memberId: 1,
      email: 'admin@mfcyouth.local',
      name: 'Demo Servant Leader',
      role: roleKey,
      areaId: 'demo-area-ncr',
      areaName: 'MFC Youth NCR East',
      needsAreaSetup: false,
      accessToken: 'demo-flutter-token',
      backendAuth: false,
      demo: true,
    );

    _session = demoSession;
    _storage.saveSession(demoSession);
    _loading = false;
    _authError = null;
    notifyListeners();
    return true;
  }

  Future<bool> selectArea(String chosenAreaId, {String? chosenAreaName}) async {
    if (_session == null) return false;

    String name = chosenAreaName ?? 'Selected Area';

    // Try backend call first
    try {
      final res = await _api.request(
        '/areas/select',
        method: 'POST',
        body: {'areaId': chosenAreaId},
        token: _session!.accessToken,
      );
      if (res['ok'] == true && res['area'] != null) {
        name = res['area']['name']?.toString() ?? name;
      }
    } catch (_) {
      // Direct Supabase fallback
      if (_session!.userId != null && _session!.accessToken != null) {
        await _supabase.linkProfileToArea(_session!.userId!, chosenAreaId, _session!.accessToken!);
      }
    }

    final updated = _session!.copyWith(
      areaId: chosenAreaId,
      areaName: name,
      needsAreaSetup: false,
    );

    _session = updated;
    await _storage.saveSession(updated);
    notifyListeners();
    return true;
  }

  Future<bool> createArea(String name) async {
    if (_session == null) return false;
    final cleanName = name.trim();
    if (cleanName.length < 3) {
      _authError = 'Area Name must be at least 3 characters.';
      notifyListeners();
      return false;
    }

    String? createdAreaId;
    String finalName = cleanName;

    try {
      final res = await _api.request(
        '/areas',
        method: 'POST',
        body: {'name': cleanName},
        token: _session!.accessToken,
      );
      if (res['ok'] == true && res['area'] != null) {
        createdAreaId = res['area']['id']?.toString();
        finalName = res['area']['name']?.toString() ?? cleanName;
      }
    } catch (_) {
      if (_session!.userId != null && _session!.accessToken != null) {
        final area = await _supabase.createArea(cleanName, _session!.accessToken!, _session!.userId!);
        if (area != null) {
          createdAreaId = area['id']?.toString();
          finalName = area['name']?.toString() ?? cleanName;
        }
      }
    }

    final updated = _session!.copyWith(
      areaId: createdAreaId ?? 'created-area-id',
      areaName: finalName,
      needsAreaSetup: false,
    );

    _session = updated;
    await _storage.saveSession(updated);
    notifyListeners();
    return true;
  }

  Future<void> logout() async {
    try {
      if (_session?.backendAuth == true && _session?.accessToken != null) {
        await _api.request('/auth/logout', method: 'POST', token: _session!.accessToken);
      }
    } catch (_) {}

    await _storage.clearSession();
    _session = null;
    _authError = null;
    notifyListeners();
  }
}
