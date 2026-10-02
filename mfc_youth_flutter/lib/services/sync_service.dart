import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/chapter.dart';
import '../models/event.dart';
import '../models/gig_record.dart';
import '../models/member.dart';
import '../models/participant.dart';
import '../models/report.dart';
import 'api_service.dart';

enum SyncState {
  synced,
  syncing,
  offline,
  error,
}

class SyncService extends ChangeNotifier {
  static const String _syncCacheKey = 'mfc_cached_sync_data';
  static const String _syncQueueKey = 'mfc_offline_mutations_queue';
  static const String _lastSyncTimeKey = 'mfc_last_sync_timestamp';

  final ApiService _api;
  SyncState _state = SyncState.synced;
  String? _statusMessage;
  DateTime? _lastSyncTime;
  List<Map<String, dynamic>> _mutationQueue = [];

  // Cached datasets for instant offline availability
  Map<String, dynamic> _cachedDashboard = {};
  List<Chapter> _chapters = [];
  List<Event> _events = [];
  List<ActivityReport> _reports = [];
  List<GigRecord> _gigRecords = [];
  List<EventParticipant> _participants = [];
  List<Member> _members = [];

  SyncService(this._api) {
    _loadStoredData();
  }

  SyncState get state => _state;
  String? get statusMessage => _statusMessage;
  DateTime? get lastSyncTime => _lastSyncTime;
  int get pendingMutationsCount => _mutationQueue.length;
  bool get hasPendingMutations => _mutationQueue.isNotEmpty;

  Map<String, dynamic> get cachedDashboard => _cachedDashboard;
  List<Chapter> get chapters => _chapters;
  List<Event> get events => _events;
  List<ActivityReport> get reports => _reports;
  List<GigRecord> get gigRecords => _gigRecords;
  List<EventParticipant> get participants => _participants;
  List<Member> get members => _members;

  Future<void> _loadStoredData() async {
    final prefs = await SharedPreferences.getInstance();
    
    // Load last sync time
    final lastTimeStr = prefs.getString(_lastSyncTimeKey);
    if (lastTimeStr != null) {
      _lastSyncTime = DateTime.tryParse(lastTimeStr);
    }

    // Load queue
    final queueRaw = prefs.getString(_syncQueueKey);
    if (queueRaw != null && queueRaw.isNotEmpty) {
      try {
        final list = jsonDecode(queueRaw) as List;
        _mutationQueue = list.map((e) => e as Map<String, dynamic>).toList();
      } catch (_) {}
    }

    // Load cached sync payload
    final cacheRaw = prefs.getString(_syncCacheKey);
    if (cacheRaw != null && cacheRaw.isNotEmpty) {
      try {
        final payload = jsonDecode(cacheRaw) as Map<String, dynamic>;
        _applySyncPayload(payload);
      } catch (_) {}
    }

    if (_mutationQueue.isNotEmpty) {
      _state = SyncState.offline;
      _statusMessage = 'Offline: ${_mutationQueue.length} pending change(s)';
    } else {
      _state = SyncState.synced;
      _statusMessage = 'Synced';
    }

    notifyListeners();
  }

  void _applySyncPayload(Map<String, dynamic> data) {
    if (data['dashboard'] is Map) {
      _cachedDashboard = Map<String, dynamic>.from(data['dashboard'] as Map);
    }

    if (data['chapters'] is List) {
      _chapters = (data['chapters'] as List).map((c) => Chapter.fromJson(c as Map<String, dynamic>)).toList();
    }

    if (data['events'] is List) {
      _events = (data['events'] as List).map((e) => Event.fromJson(e as Map<String, dynamic>)).toList();
    }

    if (data['reports'] is List) {
      _reports = (data['reports'] as List).map((r) => ActivityReport.fromJson(r as Map<String, dynamic>)).toList();
    }

    if (data['gig'] is List) {
      _gigRecords = (data['gig'] as List).map((g) => GigRecord.fromJson(g as Map<String, dynamic>)).toList();
    }

    if (data['participants'] is List) {
      _participants = (data['participants'] as List).map((p) => EventParticipant.fromJson(p as Map<String, dynamic>)).toList();
    }

    if (data['members'] is List) {
      _members = (data['members'] as List).map((m) => Member.fromJson(m as Map<String, dynamic>)).toList();
    }
  }

  /// Trigger bidirectional sync with /api/sync
  Future<bool> syncNow({String? token, String? areaId}) async {
    _state = SyncState.syncing;
    _statusMessage = 'Syncing area data...';
    notifyListeners();

    // 1. Process pending mutations queue first
    if (_mutationQueue.isNotEmpty) {
      await _flushQueue(token: token, areaId: areaId);
    }

    // 2. Fetch fresh snapshot from /api/sync
    try {
      final res = await _api.request(
        '/sync',
        token: token,
        areaId: areaId,
        timeoutSeconds: 12,
      );

      if (res['ok'] == true) {
        _applySyncPayload(res);
        _lastSyncTime = DateTime.now();

        // Save fresh snapshot to persistent local storage
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString(_syncCacheKey, jsonEncode(res));
        await prefs.setString(_lastSyncTimeKey, _lastSyncTime!.toIso8601String());

        _state = SyncState.synced;
        _statusMessage = 'Up to date';
        notifyListeners();
        return true;
      }
    } catch (e) {
      debugPrint('Sync warning, operating with local offline cache: $e');
    }

    if (_mutationQueue.isNotEmpty) {
      _state = SyncState.offline;
      _statusMessage = 'Offline: ${_mutationQueue.length} pending change(s)';
    } else {
      _state = SyncState.synced;
      _statusMessage = 'Using cached data';
    }

    notifyListeners();
    return false;
  }

  /// Queue a mutation when offline or during rapid entry
  Future<void> queueMutation({
    required String action,
    required Map<String, dynamic> payload,
    String? token,
    String? areaId,
  }) async {
    final idempotencyKey = 'mut_${DateTime.now().millisecondsSinceEpoch}_${(1000 + (DateTime.now().microsecond % 9000))}';
    final mutation = {
      'id': idempotencyKey,
      'action': action,
      'payload': payload,
      'timestamp': DateTime.now().toIso8601String(),
    };

    _mutationQueue.add(mutation);
    await _saveQueue();

    _state = SyncState.offline;
    _statusMessage = 'Offline: ${_mutationQueue.length} pending change(s)';
    notifyListeners();

    // Optimistically attempt to flush immediately in background
    unawaited(_flushQueue(token: token, areaId: areaId));
  }

  Future<void> _flushQueue({String? token, String? areaId}) async {
    if (_mutationQueue.isEmpty) return;

    final remaining = <Map<String, dynamic>>[];

    for (final item in List<Map<String, dynamic>>.from(_mutationQueue)) {
      final action = item['action'] as String;
      final payload = item['payload'] as Map<String, dynamic>;

      try {
        if (action == 'check_in' || action == 'update_participant') {
          await _api.request(
            '/participants',
            method: 'PATCH',
            body: payload,
            token: token,
            areaId: areaId,
          );
        } else if (action == 'create_report') {
          await _api.request(
            '/reports',
            method: 'POST',
            body: payload,
            token: token,
            areaId: areaId,
          );
        } else if (action == 'add_gig') {
          await _api.request(
            '/gig',
            method: 'POST',
            body: payload,
            token: token,
            areaId: areaId,
          );
        } else if (action == 'add_member') {
          await _api.request(
            '/members',
            method: 'POST',
            body: payload,
            token: token,
            areaId: areaId,
          );
        } else if (action == 'update_member') {
          await _api.request(
            '/members',
            method: 'PATCH',
            body: payload,
            token: token,
            areaId: areaId,
          );
        }
      } catch (err) {
        remaining.add(item);
      }
    }

    _mutationQueue = remaining;
    await _saveQueue();

    if (_mutationQueue.isEmpty) {
      _state = SyncState.synced;
      _statusMessage = 'All offline changes synchronized';
    } else {
      _state = SyncState.offline;
      _statusMessage = 'Offline: ${_mutationQueue.length} pending change(s)';
    }

    notifyListeners();
  }

  Future<void> _saveQueue() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_syncQueueKey, jsonEncode(_mutationQueue));
  }

  /// Quick helper to update a participant attendance locally and queue mutation
  Future<void> markAttendanceOptimistic({
    required dynamic participantId,
    required bool attended,
    String? paymentStatus,
    String? modeOfPayment,
    String? token,
    String? areaId,
  }) async {
    final idx = _participants.indexWhere((p) => p.id.toString() == participantId.toString());
    if (idx != -1) {
      _participants[idx] = _participants[idx].copyWith(
        attended: attended,
        paymentStatus: paymentStatus ?? _participants[idx].paymentStatus,
        modeOfPayment: modeOfPayment ?? _participants[idx].modeOfPayment,
      );
      notifyListeners();
    }

    await queueMutation(
      action: 'update_participant',
      payload: {
        'id': participantId,
        'attended': attended,
        if (paymentStatus != null) 'paymentStatus': paymentStatus,
        if (modeOfPayment != null) 'paymentMode': modeOfPayment,
      },
      token: token,
      areaId: areaId,
    );
  }
}
