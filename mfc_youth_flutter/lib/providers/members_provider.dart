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

  MembersProvider(this._api);

  bool get loading => _loading;
  String? get error => _error;
  String get searchQuery => _searchQuery;
  dynamic get selectedChapterId => _selectedChapterId;
  String get selectedStatus => _selectedStatus;
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
      if (_searchQuery.isNotEmpty) {
        final q = _searchQuery.toLowerCase();
        final matchName = m.fullName.toLowerCase().contains(q);
        final matchEmail = (m.email ?? '').toLowerCase().contains(q);
        final matchPhone = (m.phone ?? '').contains(q);
        final matchService = m.services.any((s) => s.toLowerCase().contains(q));
        if (!matchName && !matchEmail && !matchPhone && !matchService) return false;
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
          _allMembers = supData.map((m) => Member.fromJson(m)).toList();
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
      final endpoint = isEdit ? '/members/${payload['id']}' : '/members';
      final method = isEdit ? 'PUT' : 'POST';

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
      await _api.request('/members/$id', method: 'DELETE', token: token, areaId: areaId);
      _allMembers.removeWhere((m) => m.id.toString() == id.toString());
      notifyListeners();
      return true;
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      return false;
    }
  }
}
