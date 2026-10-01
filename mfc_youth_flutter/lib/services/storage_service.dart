import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/user_session.dart';

class StorageService {
  static const String _sessionKey = 'mfc_flutter_session';
  static const String _themeKey = 'mfc_flutter_theme';
  static const String _customApiUrlKey = 'mfc_flutter_api_url';

  Future<void> init() async {}

  Future<void> saveSession(UserSession session) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_sessionKey, jsonEncode(session.toJson()));
  }

  Future<UserSession?> getSession() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_sessionKey);
    if (raw == null || raw.isEmpty) return null;
    try {
      final map = jsonDecode(raw) as Map<String, dynamic>;
      return UserSession.fromJson(map);
    } catch (_) {
      return null;
    }
  }

  Future<void> clearSession() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_sessionKey);
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
