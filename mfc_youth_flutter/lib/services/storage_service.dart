import 'dart:convert';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/user_session.dart';

class StorageService {
  static const String _sessionKey = 'mfc_flutter_session';
  static const String _themeKey = 'mfc_flutter_theme';
  static const String _customApiUrlKey = 'mfc_flutter_api_url';
  static const String _secureAccessTokenKey = 'mfc_access_token';
  static const String _secureRefreshTokenKey = 'mfc_refresh_token';

  final FlutterSecureStorage _secureStorage = const FlutterSecureStorage();

  Future<void> init() async {}

  Future<void> saveSession(UserSession session) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_sessionKey, jsonEncode(session.toJson()));

    if (session.accessToken != null && session.accessToken!.isNotEmpty) {
      try {
        await _secureStorage.write(key: _secureAccessTokenKey, value: session.accessToken);
      } catch (_) {}
    }
    if (session.refreshToken != null && session.refreshToken!.isNotEmpty) {
      try {
        await _secureStorage.write(key: _secureRefreshTokenKey, value: session.refreshToken);
      } catch (_) {}
    }
  }

  Future<UserSession?> getSession() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_sessionKey);
    if (raw == null || raw.isEmpty) return null;
    try {
      final map = jsonDecode(raw) as Map<String, dynamic>;
      final session = UserSession.fromJson(map);

      try {
        final secureAccess = await _secureStorage.read(key: _secureAccessTokenKey);
        final secureRefresh = await _secureStorage.read(key: _secureRefreshTokenKey);
        if (secureAccess != null && secureAccess.isNotEmpty) {
          return session.copyWith(accessToken: secureAccess, refreshToken: secureRefresh);
        }
      } catch (_) {}

      return session;
    } catch (_) {
      return null;
    }
  }

  Future<String?> getAccessToken() async {
    try {
      final token = await _secureStorage.read(key: _secureAccessTokenKey);
      if (token != null && token.isNotEmpty) return token;
    } catch (_) {}
    final session = await getSession();
    return session?.accessToken;
  }

  Future<void> clearSession() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_sessionKey);
    try {
      await _secureStorage.delete(key: _secureAccessTokenKey);
      await _secureStorage.delete(key: _secureRefreshTokenKey);
    } catch (_) {}
  }

  Future<void> saveThemeMode(bool isDark) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_themeKey, isDark);
  }

  Future<bool> getThemeMode() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getBool(_themeKey) ?? false;
  }

  Future<void> setCustomApiUrl(String? url) async {
    final prefs = await SharedPreferences.getInstance();
    if (url == null || url.trim().isEmpty) {
      await prefs.remove(_customApiUrlKey);
    } else {
      await prefs.setString(_customApiUrlKey, url.trim());
    }
  }

  Future<String?> getCustomApiUrl() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_customApiUrlKey);
  }
}
