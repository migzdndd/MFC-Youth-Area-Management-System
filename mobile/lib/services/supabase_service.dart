import 'dart:convert';
import 'package:http/http.dart' as http;
import '../constants/app_constants.dart';
import '../models/user_session.dart';

class SupabaseService {
  final http.Client _client = http.Client();

  /// Direct Supabase password authentication
  Future<UserSession?> signInWithPassword(String email, String password) async {
    final cleanEmail = email.trim().toLowerCase();
    final uri = Uri.parse('${AppConstants.supabaseUrl}/auth/v1/token?grant_type=password');

    try {
      final res = await _client.post(
        uri,
        headers: {
          'Content-Type': 'application/json',
          'apikey': AppConstants.supabaseAnonKey,
        },
        body: jsonEncode({
          'email': cleanEmail,
          'password': password,
        }),
      );

      if (res.statusCode != 200) {
        final err = jsonDecode(res.body);
        final msg = err['msg'] ?? err['error_description'] ?? 'Invalid email or password.';
        throw Exception(msg);
      }

      final data = jsonDecode(res.body) as Map<String, dynamic>;
      final token = data['access_token'] as String;
      final refreshToken = data['refresh_token'] as String?;
      final expiresAt = data['expires_at'] as int?;
      final user = data['user'] as Map<String, dynamic>;
      final userId = user['id'] as String;

      // Read profiles record
      Map<String, dynamic>? profile;
      try {
        final pRes = await _client.get(
          Uri.parse('${AppConstants.supabaseUrl}/rest/v1/profiles?id=eq.$userId&select=id,member_id,role,area_id,chapter_id,must_change_password,is_active'),
          headers: {
            'apikey': AppConstants.supabaseAnonKey,
            'Authorization': 'Bearer $token',
          },
        );
        if (pRes.statusCode == 200) {
          final list = jsonDecode(pRes.body) as List;
          if (list.isNotEmpty) profile = list.first as Map<String, dynamic>;
        }
      } catch (_) {}

      final role = AppConstants.normalizeRole(profile?['role']?.toString() ?? user['user_metadata']?['role']?.toString());
      final areaId = profile?['area_id']?.toString();
      final isLeader = AppConstants.isLeadership(role);
      final needsAreaSetup = isLeader && (areaId == null || areaId.isEmpty);

      String areaName = '';
      if (areaId != null && areaId.isNotEmpty) {
        try {
          final aRes = await _client.get(
            Uri.parse('${AppConstants.supabaseUrl}/rest/v1/areas?id=eq.$areaId&select=id,name,code'),
            headers: {
              'apikey': AppConstants.supabaseAnonKey,
              'Authorization': 'Bearer $token',
            },
          );
          if (aRes.statusCode == 200) {
            final aList = jsonDecode(aRes.body) as List;
            if (aList.isNotEmpty) areaName = aList.first['name']?.toString() ?? '';
          }
        } catch (_) {}
      }

      return UserSession(
        userId: userId,
        memberId: profile?['member_id'],
        email: cleanEmail,
        name: user['user_metadata']?['display_name']?.toString() ?? user['user_metadata']?['name']?.toString() ?? cleanEmail,
        role: role,
        areaId: areaId,
        areaName: areaName,
        chapterId: profile?['chapter_id'],
        mustChangePassword: profile?['must_change_password'] == true,
        needsAreaSetup: needsAreaSetup,
        accessToken: token,
        refreshToken: refreshToken,
        expiresAt: expiresAt,
        backendAuth: true,
        demo: false,
      );
    } catch (e) {
      rethrow;
    }
  }

  /// Fetch list of areas for first-time leader onboarding
  Future<List<Map<String, dynamic>>> fetchAreas({String? token}) async {
    final uri = Uri.parse('${AppConstants.supabaseUrl}/rest/v1/areas?select=id,name,code');
    try {
      final res = await _client.get(
        uri,
        headers: {
          'apikey': AppConstants.supabaseAnonKey,
          if (token != null) 'Authorization': 'Bearer $token',
        },
      );
      if (res.statusCode == 200) {
        final list = jsonDecode(res.body) as List;
        return list.map((e) => e as Map<String, dynamic>).toList();
      }
      return [];
    } catch (_) {
      return [];
    }
  }

  /// Direct area creation in Supabase
  Future<Map<String, dynamic>?> createArea(String name, String token, String userId) async {
    final cleanName = name.trim();
    final code = cleanName.toUpperCase().replaceAll(RegExp(r'[^A-Z0-9]+'), '-').substring(0, cleanName.length > 20 ? 20 : cleanName.length);
    final uri = Uri.parse('${AppConstants.supabaseUrl}/rest/v1/areas');

    try {
      final res = await _client.post(
        uri,
        headers: {
          'Content-Type': 'application/json',
          'apikey': AppConstants.supabaseAnonKey,
          'Authorization': 'Bearer $token',
          'Prefer': 'return=representation',
        },
        body: jsonEncode({
          'name': cleanName,
          'code': code,
        }),
      );

      if (res.statusCode == 200 || res.statusCode == 201) {
        final list = jsonDecode(res.body) as List;
        if (list.isNotEmpty) {
          final area = list.first as Map<String, dynamic>;
          // Link profile to newly created area
          await linkProfileToArea(userId, area['id'].toString(), token);
          return area;
        }
      }
      return null;
    } catch (_) {
      return null;
    }
  }

  /// Direct profile area update
  Future<bool> linkProfileToArea(String userId, String areaId, String token) async {
    final uri = Uri.parse('${AppConstants.supabaseUrl}/rest/v1/profiles?id=eq.$userId');
    try {
      final res = await _client.patch(
        uri,
        headers: {
          'Content-Type': 'application/json',
          'apikey': AppConstants.supabaseAnonKey,
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({
          'area_id': areaId,
        }),
      );
      return res.statusCode >= 200 && res.statusCode < 300;
    } catch (_) {
      return false;
    }
  }
}
