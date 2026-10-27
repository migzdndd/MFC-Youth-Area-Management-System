import 'package:flutter/material.dart';
import '../models/member.dart';
import '../services/api_service.dart';
import '../services/app_exception.dart';
import '../services/supabase_service.dart';

class MembersProvider extends ChangeNotifier {
  final ApiService _api;
  final SupabaseService _supabase = SupabaseService();

  List<Member> _allMembers = [];
  bool _loading = false;
  String? _error;

  String _searchQuery = '';
  String? _selectedChapter;
  String? _selectedStatus;
  String? _selectedCategory;
  String? _userRole;
  dynamic _userChapterId;

  MembersProvider(this._api);

  List<Member> get members => _allMembers;
  bool get loading => _loading;
  String? get error => _error;

  String get searchQuery => _searchQuery;
  String? get selectedChapter => _selectedChapter;
  String? get selectedStatus => _selectedStatus;
  String? get selectedCategory => _selectedCategory;

  void setUserScope(String? role, dynamic chapterId) {
    _userRole = role?.toLowerCase();
    _userChapterId = chapterId;
  }

  List<Member> get filteredMembers {
    return _allMembers.where((m) {
      // Role-based automatic scoping
      if (_userRole == 'chapter_servant' && _userChapterId != null) {
        if (m.chapterId?.toString() != _userChapterId.toString()) {
          return false;
        }
      } else if (_userRole == 'mfc_high_servant') {
        final track = (m.academicTrack ?? '').toUpperCase();
        final school = (m.school ?? '').toLowerCase();
        final isHs = track == 'HS' || track == 'HIGH SCHOOL' || school.contains('high school');
        if (!isHs && !m.isServant) return false;
      } else if (_userRole == 'campus_servant') {
        final track = (m.academicTrack ?? '').toUpperCase();
        final school = (m.school ?? '').toLowerCase();
        final isCollegeOrShs = track == 'SHS' || track == 'COLLEGE' || school.contains('college') || school.contains('university');
        if (!isCollegeOrShs && !m.isServant) return false;
      }

      final matchesSearch = _searchQuery.isEmpty ||
          m.fullName.toLowerCase().contains(_searchQuery.toLowerCase()) ||
          (m.email?.toLowerCase().contains(_searchQuery.toLowerCase()) ?? false) ||
          (m.phone?.contains(_searchQuery) ?? false);

      final matchesChapter = _selectedChapter == null ||
          _selectedChapter == 'all' ||
          m.chapterId?.toString() == _selectedChapter ||
          m.chapterName == _selectedChapter;

      final matchesStatus = _selectedStatus == null ||
          _selectedStatus == 'all' ||
          m.status.toLowerCase() == _selectedStatus!.toLowerCase();

      final matchesCategory = _selectedCategory == null ||
          _selectedCategory == 'all' ||
          m.ministryCategory.toLowerCase() == _selectedCategory!.toLowerCase() ||
          (m.academicTrack?.toLowerCase() == _selectedCategory!.toLowerCase());

      return matchesSearch && matchesChapter && matchesStatus && matchesCategory;
    }).toList();
  }

  void setSearchQuery(String q) {
    _searchQuery = q.trim();
    notifyListeners();
  }

  void setChapterFilter(String? chapterId) {
    _selectedChapter = chapterId;
    notifyListeners();
  }

  void setStatusFilter(String? status) {
    _selectedStatus = status;
    notifyListeners();
  }

  void setCategoryFilter(String category) {
    _selectedCategory = category;
    notifyListeners();
  }

  Future<void> loadMembers({String? token, String? areaId}) async {
    _loading = true;
    _error = null;
    notifyListeners();

    try {
      final res = await _api.request('/members', token: token, areaId: areaId);
      if (res['ok'] == true && res['members'] is List) {
        _allMembers = (res['members'] as List).map((m) => Member.fromJson(m)).toList();
      }
    } catch (e) {
      if (areaId != null && areaId.isNotEmpty) {
        try {
          final direct = await _supabase.fetchMembersDirect(areaId: areaId, token: token);
          if (direct.isNotEmpty) {
            _allMembers = direct.map((m) => Member.fromJson(m)).toList();
            _error = null;
            return;
          }
        } catch (_) {}
      }
      _error = e is AppException ? e.message : e.toString().replaceAll('Exception: ', '');
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  Future<bool> saveMember(Map<String, dynamic> payload, {String? token, String? areaId}) async {
    try {
      final isEdit = payload['id'] != null;
      const endpoint = '/members';
      final method = isEdit ? 'PATCH' : 'POST';

      await _api.request(endpoint, method: method, body: payload, token: token, areaId: areaId);
      await loadMembers(token: token, areaId: areaId);
      return true;
    } catch (e) {
      _error = e is AppException ? e.message : e.toString().replaceAll('Exception: ', '');
      notifyListeners();
      return false;
    }
  }

  Future<bool> deleteMember(dynamic id, {String? token, String? areaId}) async {
    try {
      await _api.request('/members?id=$id', method: 'DELETE', token: token, areaId: areaId);
      await loadMembers(token: token, areaId: areaId);
      return true;
    } catch (e) {
      _error = e is AppException ? e.message : e.toString().replaceAll('Exception: ', '');
      notifyListeners();
      return false;
    }
  }

  String generateCsv() {
    final buffer = StringBuffer();
    buffer.writeln('ID,Full Name,Role,Chapter,Status,Phone,Email,Birth Date,Age,School,Track');
    for (final m in filteredMembers) {
      final safeName = '"${m.fullName.replaceAll('"', '""')}"';
      final safeRole = '"${m.ministryCategory.replaceAll('"', '""')}"';
      final safeChapter = '"${(m.chapterName ?? '').replaceAll('"', '""')}"';
      final safeSchool = '"${(m.school ?? '').replaceAll('"', '""')}"';
      final safeTrack = '"${(m.academicTrack ?? '').replaceAll('"', '""')}"';
      buffer.writeln('${m.id},$safeName,$safeRole,$safeChapter,${m.status},${m.phone ?? ""},${m.email ?? ""},${m.birthDate ?? ""},${m.age ?? ""},$safeSchool,$safeTrack');
    }
    return buffer.toString();
  }
}
