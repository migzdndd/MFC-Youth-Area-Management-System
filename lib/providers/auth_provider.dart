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

  // MFA Challenge State
  bool _mfaRequired = false;
  String? _mfaFactorId;
  String? _mfaTempToken;
  String? _mfaPendingEmail;

  AuthProvider(this._api, this._storage) {
    _initSession();
  }

  UserSession? get session => _session;
  bool get loading => _loading;
  String? get authError => _authError;
  bool get isAuthenticated => _session != null && _session!.accessToken != null;
  bool get needsAreaSetup => _session?.needsAreaSetup == true;
  String get role => _session?.role ?? 'member';
  String? get areaId => _session?.areaId;
  String get areaName => _session?.areaName.isNotEmpty == true ? _session!.areaName : 'MFC Youth Area';
  bool get isLeadership => AppConstants.isLeadership(role);

  bool get mfaRequired => _mfaRequired;
  String? get mfaFactorId => _mfaFactorId;
  String? get mfaPendingEmail => _mfaPendingEmail;

  Future<void> _initSession() async {
    _session = await _storage.getSession();
    _loading = false;
    notifyListeners();
  }

  void clearError() {
    _authError = null;
    notifyListeners();
  }

  void cancelMfa() {
    _mfaRequired = false;
    _mfaFactorId = null;
    _mfaTempToken = null;
    _mfaPendingEmail = null;
    _authError = null;
    notifyListeners();
  }

  /// Production Login via Backend Serverless Gateway: POST /api/auth/login
  Future<bool> login(String email, String password, {bool remember = true}) async {
    _loading = true;
    _authError = null;
    _mfaRequired = false;
    _mfaFactorId = null;
    _mfaTempToken = null;
    _mfaPendingEmail = email.trim().toLowerCase();
    notifyListeners();

    try {
      final res = await _api.request(
        '/auth/login',
        method: 'POST',
        body: {
          'email': _mfaPendingEmail,
          'password': password,
          'remember': remember,
        },
      );

      // 1. MFA Interception Check
      if (res['mfaRequired'] == true) {
        _mfaRequired = true;
        _mfaFactorId = res['factorId']?.toString();
        final tempSession = res['tempSession'] as Map<String, dynamic>?;
        _mfaTempToken = tempSession?['accessToken'] as String?;
        _loading = false;
        notifyListeners();
        return false;
      }

      // 2. Direct Session Confirmation
      if (res['ok'] == true && (res['session'] != null || res['user'] != null)) {
        final newSession = UserSession.fromJson(res);
        _session = newSession;
        await _storage.saveSession(newSession);
        _loading = false;
        notifyListeners();
        return true;
      } else {
        _authError = res['error']?.toString() ?? 'Invalid credentials or inactive account.';
      }
    } catch (e) {
      // Direct Supabase Fallback if Backend API Gateway fails or is unreachable
      try {
        final directSession = await _supabase.signInWithPassword(email, password);
        if (directSession != null) {
          _session = directSession;
          await _storage.saveSession(directSession);
          _loading = false;
          notifyListeners();
          return true;
        }
      } catch (directErr) {
        debugPrint('Direct Supabase sign-in warning: $directErr');
      }

      if (e is ApiException) {
        _authError = e.message;
      } else {
        _authError = e.toString().replaceAll('Exception: ', '');
      }
    }

    _loading = false;
    notifyListeners();
    return false;
  }

  /// Verify MFA TOTP 6-Digit Code via POST /api/auth/mfa/verify
  Future<bool> verifyMfaTotp(String code, {bool remember = true}) async {
    if (_mfaFactorId == null || _mfaTempToken == null) {
      _authError = 'Two-factor session expired. Please sign in again.';
      notifyListeners();
      return false;
    }

    _loading = true;
    _authError = null;
    notifyListeners();

    try {
      final res = await _api.request(
        '/auth/mfa/verify',
        method: 'POST',
        headers: {'Authorization': 'Bearer $_mfaTempToken'},
        token: _mfaTempToken,
        body: {
          'factorId': _mfaFactorId,
          'code': code.trim(),
          'remember': remember,
        },
      );

      if (res['ok'] == true && (res['session'] != null || res['user'] != null)) {
        final newSession = UserSession.fromJson(res);
        _session = newSession;
        await _storage.saveSession(newSession);
        _mfaRequired = false;
        _mfaFactorId = null;
        _mfaTempToken = null;
        _mfaPendingEmail = null;
        _loading = false;
        notifyListeners();
        return true;
      } else {
        _authError = res['error']?.toString() ?? 'Invalid authentication code.';
      }
    } catch (e) {
      if (e is ApiException) {
        _authError = e.message;
      } else {
        _authError = e.toString().replaceAll('Exception: ', '');
      }
    }

    _loading = false;
    notifyListeners();
    return false;
  }

  /// Verify MFA TOTP code with factorId and challengeId
  Future<bool> mfaVerify({
    required String factorId,
    required String challengeId,
    required String code,
    bool remember = true,
  }) async {
    _mfaFactorId = factorId;
    return verifyMfaTotp(code, remember: remember);
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
      if (e is ApiException) {
        _authError = e.message;
      } else {
        _authError = e.toString().replaceAll('Exception: ', '');
      }
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
      if (e is ApiException) {
        _authError = e.message;
      } else {
        _authError = e.toString().replaceAll('Exception: ', '');
      }
    }

    _loading = false;
    notifyListeners();
    return {'ok': false, 'error': _authError};
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

  /// Area Selection Context Switcher: POST /api/areas/select
  Future<bool> selectArea(String chosenAreaId, {String? chosenAreaName}) async {
    if (_session == null) return false;

    String name = chosenAreaName ?? 'Selected Area';

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
    } catch (_) {}

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

  /// Create new Area: POST /api/areas
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
    } catch (_) {}

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
      if (_session?.accessToken != null) {
        await _api.request('/auth/logout', method: 'POST', token: _session!.accessToken);
      }
    } catch (_) {}

    await _storage.clearSession();
    _session = null;
    _authError = null;
    _mfaRequired = false;
    _mfaFactorId = null;
    _mfaTempToken = null;
    _mfaPendingEmail = null;
    notifyListeners();
  }
}
