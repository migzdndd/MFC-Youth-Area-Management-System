import 'package:flutter/material.dart';
import '../models/chapter.dart';
import '../models/daily_reading.dart';
import '../models/event.dart';
import '../models/gig_record.dart';
import '../models/member.dart';
import '../models/participant.dart';
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
  List<GigRecord> _gigRecords = [];
  List<EventParticipant> _participants = [];
  DailyReading? _dailyReading;

  int _servicesCount = 0;
  int _registrationsCount = 0;
  int _attendedCount = 0;
  double _gigTotal = 0.0;

  DashboardProvider(this._api);

  bool get loading => _loading;
  String? get error => _error;

  List<Member> get members => _members;
  List<Chapter> get chapters => _chapters;
  List<Event> get events => _events;
  List<ActivityReport> get reports => _reports;
  List<GigRecord> get gigRecords => _gigRecords;
  List<EventParticipant> get participants => _participants;
  DailyReading? get dailyReading => _dailyReading;

  // 9 Metric summary cards requested
  int get totalMembers => _members.length;
  int get activeMembers => _members.where((m) => m.isActive).length;
  int get totalChapters => _chapters.length;
  int get totalServices => _servicesCount;
  int get totalEvents => _events.length;
  int get totalReports => _reports.length;
  int get totalRegistrations => _registrationsCount;
  int get totalAttended => _attendedCount;
  double get gigStewardshipTotal => _gigTotal;

  Future<void> loadDashboardData({String? token, String? areaId}) async {
    _loading = true;
    _error = null;
    notifyListeners();

    // 1. Try single /api/sync endpoint for fast initial load
    try {
      final syncRes = await _api.request('/sync', token: token, areaId: areaId);
      if (syncRes['ok'] == true) {
        if (syncRes['dashboard'] is Map) {
          final d = syncRes['dashboard'] as Map<String, dynamic>;
          _servicesCount = (d['services'] is num) ? (d['services'] as num).toInt() : 0;
          _registrationsCount = (d['registrations'] is num) ? (d['registrations'] as num).toInt() : 0;
          _attendedCount = (d['attended'] is num) ? (d['attended'] as num).toInt() : 0;
          _gigTotal = (d['gigTotal'] is num) ? (d['gigTotal'] as num).toDouble() : 0.0;
        }

        if (syncRes['chapters'] is List) {
          _chapters = (syncRes['chapters'] as List).map((c) => Chapter.fromJson(c)).toList();
        }
        if (syncRes['events'] is List) {
          _events = (syncRes['events'] as List).map((e) => Event.fromJson(e)).toList();
        }
        if (syncRes['reports'] is List) {
          _reports = (syncRes['reports'] as List).map((r) => ActivityReport.fromJson(r)).toList();
        }
        if (syncRes['gig'] is List) {
          _gigRecords = (syncRes['gig'] as List).map((g) => GigRecord.fromJson(g)).toList();
          if (_gigTotal == 0.0 && _gigRecords.isNotEmpty) {
            _gigTotal = _gigRecords.fold<double>(0.0, (sum, g) => sum + g.amount);
          }
        }
        if (syncRes['participants'] is List) {
          _participants = (syncRes['participants'] as List).map((p) => EventParticipant.fromJson(p)).toList();
          _registrationsCount = _participants.length;
          _attendedCount = _participants.where((p) => p.attended).length;
        }
      }
    } catch (_) {}

    // 2. Fetch members list
    try {
      final membersRes = await _api.request('/members', token: token, areaId: areaId);
      if (membersRes['ok'] == true && membersRes['members'] is List) {
        _members = (membersRes['members'] as List).map((m) => Member.fromJson(m)).toList();
      }
    } catch (_) {
      final supData = await _api.supabaseRest('members', token: token);
      if (supData is List) {
        _members = supData.map((e) => Member.fromJson(e)).toList();
      }
    }

    // 3. Fetch Daily Readings
    try {
      final readingsRes = await _api.request('/daily-readings', token: token);
      if (readingsRes['ok'] == true && readingsRes['reading'] != null) {
        _dailyReading = DailyReading.fromJson(readingsRes['reading'] as Map<String, dynamic>);
      }
    } catch (_) {}

    _loading = false;
    notifyListeners();
  }
}
