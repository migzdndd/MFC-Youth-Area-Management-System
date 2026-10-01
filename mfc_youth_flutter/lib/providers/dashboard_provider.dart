import 'package:flutter/material.dart';
import '../models/member.dart';
import '../models/chapter.dart';
import '../models/event.dart';
import '../models/report.dart';
import '../services/api_service.dart';

class DashboardProvider extends ChangeNotifier {
  final ApiService _api;

  bool _loading = true;
  String? _error;

  List<Member> _members = [];
  List<Chapter> _chapters = [];
  List<Event> _events = [];
  List<ActivityReport> _reports = [];

  DashboardProvider(this._api);

  bool get loading => _loading;
  String? get error => _error;

  List<Member> get members => _members;
  List<Chapter> get chapters => _chapters;
  List<Event> get events => _events;
  List<ActivityReport> get reports => _reports;

  int get totalMembers => _members.length;
  int get activeMembers => _members.where((m) => m.isActive).length;
  int get totalChapters => _chapters.length;
  int get upcomingEventsCount => _events.length;
  int get totalReports => _reports.length;

  Future<void> loadDashboardData({String? token, String? areaId}) async {
    _loading = true;
    _error = null;
    notifyListeners();

    try {
      final results = await Future.wait([
        _fetchList('/members', 'members', token, areaId),
        _fetchList('/chapters', 'chapters', token, areaId),
        _fetchList('/events', 'events', token, areaId),
        _fetchList('/reports', 'reports', token, areaId),
      ]);

      _members = results[0].map((m) => Member.fromJson(m)).toList();
      _chapters = results[1].map((c) => Chapter.fromJson(c)).toList();
      _events = results[2].map((e) => Event.fromJson(e)).toList();
      _reports = results[3].map((r) => ActivityReport.fromJson(r)).toList();
    } catch (e) {
      _error = e.toString();
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  Future<List<Map<String, dynamic>>> _fetchList(
    String endpoint,
    String key,
    String? token,
    String? areaId,
  ) async {
    try {
      final res = await _api.request(endpoint, token: token, areaId: areaId);
      if (res['ok'] == true && res[key] is List) {
        return (res[key] as List).map((e) => e as Map<String, dynamic>).toList();
      }
      return [];
    } catch (_) {
      // Fallback to Supabase direct REST if backend router fails
      final supData = await _api.supabaseRest(key, token: token);
      if (supData is List) {
        return supData.map((e) => e as Map<String, dynamic>).toList();
      }
      return [];
    }
  }
}
