import 'package:flutter/material.dart';
import '../models/member.dart';
import '../services/api_service.dart';

class MembersProvider extends ChangeNotifier {
  final ApiService _api;

  bool _loading = false;
  String? _error;
  List<Member> _allMembers = [];

  String _searchQuery = '';
  dynamic _selectedChapterId;
  String _selectedStatus = 'All'; // 'All' | 'Active' | 'Inactive'
  String _selectedCategory = 'All'; // 'All' | 'Kids (4-12)' | 'Youth (13-21)' | 'LIT Servant' | 'Campus Servant' | 'High Servant'

  MembersProvider(this._api);

  bool get loading => _loading;
  String? get error => _error;
  String get searchQuery => _searchQuery;
  dynamic get selectedChapterId => _selectedChapterId;
  String get selectedStatus => _selectedStatus;
  String get selectedCategory => _selectedCategory;
  List<Member> get members => _allMembers;

  Future<void> fetchMembers({String? token, String? areaId}) =>
      loadMembers(token: token, areaId: areaId);

  List<Member> get filteredMembers {
    return _allMembers.where((m) {
      if (_selectedChapterId != null && _selectedChapterId.toString() != 'all') {
        if (m.chapterId?.toString() != _selectedChapterId.toString()) return false;
      }
      if (_selectedStatus != 'All') {
        if (m.status.toLowerCase() != _selectedStatus.toLowerCase()) return false;
      }
      if (_selectedCategory != 'All') {
        if (!m.ministryCategory.toLowerCase().contains(_selectedCategory.toLowerCase())) {
          return false;
        }
      }
      if (_searchQuery.isNotEmpty) {
        final q = _searchQuery.toLowerCase();
        final matchName = m.fullName.toLowerCase().contains(q);
        final matchEmail = (m.email ?? '').toLowerCase().contains(q);
        final matchPhone = (m.phone ?? '').contains(q);
        final matchSchool = (m.school ?? '').toLowerCase().contains(q);
        final matchService = m.services.any((s) => s.toLowerCase().contains(q));
        if (!matchName && !matchEmail && !matchPhone && !matchService && !matchSchool) return false;
      }
      return true;
    }).toList();
  }

  void setSearchQuery(String query) {
    _searchQuery = query.trim();
    notifyListeners();
  }

  void setChapterFilter(dynamic chapterId) {
    _selectedChapterId = chapterId;
    notifyListeners();
  }

  void setStatusFilter(String status) {
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
      } else {
        final supData = await _api.supabaseRest('members', token: token);
        if (supData is List) {
          _allMembers = supData.map((e) => Member.fromJson(e)).toList();
        }
      }
    } catch (e) {
      _error = e.toString();
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
      _error = e.toString();
      notifyListeners();
      return false;
    }
  }

  Future<bool> deleteMember(dynamic id, {String? token, String? areaId}) async {
    try {
      await _api.request('/members', method: 'DELETE', body: {'id': id}, token: token, areaId: areaId);
      _allMembers.removeWhere((m) => m.id.toString() == id.toString());
      notifyListeners();
      return true;
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      return false;
    }
  }

  /// Generate CSV String from currently filtered members
  String generateCsv() {
    final list = filteredMembers;
    final buffer = StringBuffer();
    buffer.writeln('ID,Full Name,Email,Phone,Gender,Age,Birth Date,Chapter,Status,Role,School,Grade Level,Emergency Contact,Emergency Phone');

    for (final m in list) {
      final row = [
        '"${m.id}"',
        '"${m.fullName.replaceAll('"', '""')}"',
        '"${(m.email ?? '').replaceAll('"', '""')}"',
        '"${(m.phone ?? '').replaceAll('"', '""')}"',
        '"${m.gender ?? ''}"',
        '"${m.age ?? ''}"',
        '"${m.birthDate ?? ''}"',
        '"${(m.chapterName ?? '').replaceAll('"', '""')}"',
        '"${m.status}"',
        '"${m.accessLevel}"',
        '"${(m.school ?? '').replaceAll('"', '""')}"',
        '"${(m.gradeLevel ?? '').replaceAll('"', '""')}"',
        '"${(m.emergencyContactName ?? '').replaceAll('"', '""')}"',
        '"${(m.emergencyContactPhone ?? '').replaceAll('"', '""')}"',
      ];
      buffer.writeln(row.join(','));
    }
    return buffer.toString();
  }
}
