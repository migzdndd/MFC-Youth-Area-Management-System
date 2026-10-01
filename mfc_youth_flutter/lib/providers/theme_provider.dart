import 'package:flutter/material.dart';
import '../services/storage_service.dart';

class ThemeProvider extends ChangeNotifier {
  final StorageService _storage;
  bool _isDark = false;

  ThemeProvider(this._storage) {
    _loadTheme();
  }

  bool get isDark => _isDark;
  bool get isDarkMode => _isDark;
  ThemeMode get themeMode => _isDark ? ThemeMode.dark : ThemeMode.light;

  Future<void> _loadTheme() async {
    _isDark = await _storage.getThemeMode();
    notifyListeners();
  }

  Future<void> toggleTheme() async {
    _isDark = !_isDark;
    await _storage.saveThemeMode(_isDark);
    notifyListeners();
  }
}
