import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../constants/app_constants.dart';
import '../models/user_session.dart';
import 'app_exception.dart';

/// Supabase client integration for authentication and database queries.
class SupabaseService {
  /// Access the shared SupabaseClient instance.
  SupabaseClient get client => Supabase.instance.client;

  /// Direct Supabase authentication using the official SDK.
  Future<UserSession?> signInWithPassword(String email, String password) async {
    final cleanEmail = email.trim().toLowerCase();
    try {
      final authResponse = await client.auth.signInWithPassword(
        email: cleanEmail,
        password: password,
      );

      final user = authResponse.user;
      final session = authResponse.session;

      if (user == null || session == null) {
        throw const AppAuthException('Unable to establish authentication session.');
      }

      final userId = user.id;
      final token = session.accessToken;
      final refreshToken = session.refreshToken;
      final expiresAt = session.expiresAt;

      // Query profiles record via PostgREST
      Map<String, dynamic>? profile;
      try {
        final profileData = await client
            .from('profiles')
            .select('id, member_id, role, area_id, chapter_id, must_change_password, is_active')
            .eq('id', userId)
            .maybeSingle();
        if (profileData != null) {
          profile = Map<String, dynamic>.from(profileData);
        }
      } on PostgrestException catch (pe) {
        debugPrint('Profile query note: ${pe.message}');
      }

      final role = AppConstants.normalizeRole(
        profile?['role']?.toString() ?? user.userMetadata?['role']?.toString(),
      );
      final areaId = profile?['area_id']?.toString();
      final isLeader = AppConstants.isLeadership(role);
      final needsAreaSetup = isLeader && (areaId == null || areaId.isEmpty);

      String areaName = '';
      if (areaId != null && areaId.isNotEmpty) {
        try {
          final areaData = await client
              .from('areas')
              .select('id, name, code')
              .eq('id', areaId)
              .maybeSingle();
          if (areaData != null) {
            areaName = areaData['name']?.toString() ?? '';
          }
        } on PostgrestException catch (pe) {
          debugPrint('Area name query note: ${pe.message}');
        }
      }

      return UserSession(
        userId: userId,
        memberId: profile?['member_id'],
        email: cleanEmail,
        name: user.userMetadata?['display_name']?.toString() ??
            user.userMetadata?['name']?.toString() ??
            cleanEmail,
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
    } on AuthException catch (ae) {
      throw AppAuthException(ae.message, code: ae.statusCode, originalError: ae);
    } on SocketException catch (se) {
      throw AppNetworkException('Network connection unavailable: please check your connection.', originalError: se);
    } catch (e) {
      if (e is AppException) rethrow;
      throw AppAuthException('Authentication error: ${e.toString().replaceAll('Exception: ', '')}', originalError: e);
    }
  }

  /// Fetch list of areas for first-time leader onboarding.
  Future<List<Map<String, dynamic>>> fetchAreas({String? token}) async {
    try {
      final res = await client
          .from('areas')
          .select('id, name, code')
          .order('name', ascending: true);
      return List<Map<String, dynamic>>.from(res);
    } on PostgrestException catch (pe) {
      throw AppDatabaseException('Failed to load areas: ${pe.message}', code: pe.code, originalError: pe);
    } on SocketException catch (se) {
      throw AppNetworkException('Network error while loading areas.', originalError: se);
    } catch (e) {
      if (e is AppException) rethrow;
      throw AppDatabaseException('Unexpected error loading areas: $e', originalError: e);
    }
  }

  /// Create a new pastoral area and link to the creator's profile.
  Future<Map<String, dynamic>?> createArea(String name, {String? token, String? userId}) async {
    final cleanName = name.trim();
    final code = cleanName
        .toUpperCase()
        .replaceAll(RegExp(r'[^A-Z0-9]+'), '-')
        .substring(0, cleanName.length > 20 ? 20 : cleanName.length);

    try {
      final res = await client
          .from('areas')
          .insert({'name': cleanName, 'code': code})
          .select()
          .single();

      final area = Map<String, dynamic>.from(res);
      final effectiveUserId = userId ?? client.auth.currentUser?.id;
      if (effectiveUserId != null) {
        await linkProfileToArea(effectiveUserId, area['id'].toString());
      }
      return area;
    } on PostgrestException catch (pe) {
      throw AppDatabaseException('Failed to create area: ${pe.message}', code: pe.code, originalError: pe);
    } on SocketException catch (se) {
      throw AppNetworkException('Network error while creating area.', originalError: se);
    } catch (e) {
      if (e is AppException) rethrow;
      throw AppDatabaseException('Unexpected error creating area: $e', originalError: e);
    }
  }

  /// Link a leader profile to their designated area.
  Future<bool> linkProfileToArea(String userId, String areaId, [String? token]) async {
    try {
      await client
          .from('profiles')
          .update({'area_id': areaId})
          .eq('id', userId);
      return true;
    } on PostgrestException catch (pe) {
      throw AppDatabaseException('Failed to link profile to area: ${pe.message}', code: pe.code, originalError: pe);
    } on SocketException catch (se) {
      throw AppNetworkException('Network error updating profile area.', originalError: se);
    } catch (e) {
      if (e is AppException) rethrow;
      throw AppDatabaseException('Unexpected error updating profile: $e', originalError: e);
    }
  }

  /// Direct Supabase query for Area Members.
  Future<List<Map<String, dynamic>>> fetchMembersDirect({required String areaId, String? token}) async {
    try {
      final res = await client
          .from('members')
          .select()
          .eq('area_id', areaId)
          .order('last_name', ascending: true);
      return List<Map<String, dynamic>>.from(res);
    } on PostgrestException catch (pe) {
      throw AppDatabaseException('Failed to load members: ${pe.message}', code: pe.code, originalError: pe);
    } on SocketException catch (se) {
      throw AppNetworkException('Network error loading members.', originalError: se);
    } catch (e) {
      if (e is AppException) rethrow;
      throw AppDatabaseException('Unexpected error loading members: $e', originalError: e);
    }
  }

  /// Direct Supabase query for Area Chapters.
  Future<List<Map<String, dynamic>>> fetchChaptersDirect({required String areaId, String? token}) async {
    try {
      final res = await client
          .from('chapters')
          .select()
          .eq('area_id', areaId)
          .order('name', ascending: true);
      return List<Map<String, dynamic>>.from(res);
    } on PostgrestException catch (pe) {
      throw AppDatabaseException('Failed to load chapters: ${pe.message}', code: pe.code, originalError: pe);
    } on SocketException catch (se) {
      throw AppNetworkException('Network error loading chapters.', originalError: se);
    } catch (e) {
      if (e is AppException) rethrow;
      throw AppDatabaseException('Unexpected error loading chapters: $e', originalError: e);
    }
  }

  /// Direct Supabase query for Area Events.
  Future<List<Map<String, dynamic>>> fetchEventsDirect({required String areaId, String? token}) async {
    try {
      final res = await client
          .from('events')
          .select()
          .eq('area_id', areaId)
          .order('starts_at', ascending: false);
      return List<Map<String, dynamic>>.from(res);
    } on PostgrestException catch (pe) {
      throw AppDatabaseException('Failed to load events: ${pe.message}', code: pe.code, originalError: pe);
    } on SocketException catch (se) {
      throw AppNetworkException('Network error loading events.', originalError: se);
    } catch (e) {
      if (e is AppException) rethrow;
      throw AppDatabaseException('Unexpected error loading events: $e', originalError: e);
    }
  }

  /// Sign out current session.
  Future<void> signOut() async {
    try {
      await client.auth.signOut();
    } on AuthException catch (ae) {
      throw AppAuthException('Sign out failed: ${ae.message}', code: ae.statusCode, originalError: ae);
    } catch (e) {
      throw AppAuthException('Sign out error: $e', originalError: e);
    }
  }
}
