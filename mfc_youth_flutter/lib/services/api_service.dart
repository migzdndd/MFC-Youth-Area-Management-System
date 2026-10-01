import 'dart:convert';
import 'package:http/http.dart' as http;
import '../constants/app_constants.dart';
import 'storage_service.dart';

class ApiService {
  final StorageService _storage;

  ApiService(this._storage);

  Future<String> getBaseUrl() async {
    final custom = await _storage.getCustomApiUrl();
    if (custom != null && custom.trim().isNotEmpty) {
      return custom.trim().replaceAll(RegExp(r'/+$'), '');
    }
    return AppConstants.defaultApiUrl;
  }

  Future<Map<String, dynamic>> request(
    String endpoint, {
    String method = 'GET',
    dynamic body,
    Map<String, String>? headers,
    String? token,
    String? areaId,
    int timeoutSeconds = 10,
  }) async {
    final baseUrl = await getBaseUrl();
    final normalizedPath = endpoint.startsWith('/') ? endpoint : '/$endpoint';
    final fullPath = normalizedPath.startsWith('/api') ? normalizedPath : '/api$normalizedPath';
    final uri = Uri.parse('$baseUrl$fullPath');

    final reqHeaders = <String, String>{
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      if (token != null && token.isNotEmpty) 'Authorization': 'Bearer $token',
      if (areaId != null && areaId.isNotEmpty) 'X-MFC-Area-ID': areaId,
      ...?headers,
    };

    try {
      http.Response response;
      final upperMethod = method.toUpperCase();

      if (upperMethod == 'POST') {
        response = await http
            .post(uri, headers: reqHeaders, body: body != null ? jsonEncode(body) : null)
            .timeout(Duration(seconds: timeoutSeconds));
      } else if (upperMethod == 'PUT') {
        response = await http
            .put(uri, headers: reqHeaders, body: body != null ? jsonEncode(body) : null)
            .timeout(Duration(seconds: timeoutSeconds));
      } else if (upperMethod == 'PATCH') {
        response = await http
            .patch(uri, headers: reqHeaders, body: body != null ? jsonEncode(body) : null)
            .timeout(Duration(seconds: timeoutSeconds));
      } else if (upperMethod == 'DELETE') {
        response = await http
            .delete(uri, headers: reqHeaders, body: body != null ? jsonEncode(body) : null)
            .timeout(Duration(seconds: timeoutSeconds));
      } else {
        response = await http.get(uri, headers: reqHeaders).timeout(Duration(seconds: timeoutSeconds));
      }

      Map<String, dynamic> data;
      try {
        data = jsonDecode(response.body) as Map<String, dynamic>;
      } catch (_) {
        data = {'ok': false, 'error': 'Invalid response format from server.'};
      }

      if (response.statusCode >= 200 && response.statusCode < 300) {
        return data;
      } else {
        throw ApiException(
          data['error']?.toString() ?? 'Request failed with status ${response.statusCode}',
          statusCode: response.statusCode,
          data: data,
        );
      }
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException('Network connection error: $e');
    }
  }

  /// Direct fallback to Supabase REST query
  Future<dynamic> supabaseRest(
    String tablePath, {
    String method = 'GET',
    dynamic body,
    String? token,
  }) async {
    final uri = Uri.parse('${AppConstants.supabaseUrl}/rest/v1/$tablePath');
    final reqHeaders = <String, String>{
      'Content-Type': 'application/json',
      'apikey': AppConstants.supabaseAnonKey,
      if (token != null && token.isNotEmpty) 'Authorization': 'Bearer $token',
      'Prefer': 'return=representation',
    };

    try {
      http.Response response;
      final upper = method.toUpperCase();
      if (upper == 'POST') {
        response = await http.post(uri, headers: reqHeaders, body: jsonEncode(body));
      } else if (upper == 'PATCH') {
        response = await http.patch(uri, headers: reqHeaders, body: jsonEncode(body));
      } else if (upper == 'DELETE') {
        response = await http.delete(uri, headers: reqHeaders);
      } else {
        response = await http.get(uri, headers: reqHeaders);
      }

      if (response.statusCode >= 200 && response.statusCode < 300) {
        return jsonDecode(response.body);
      }
      return null;
    } catch (e) {
      return null;
    }
  }
}

class ApiException implements Exception {
  final String message;
  final int? statusCode;
  final Map<String, dynamic>? data;

  ApiException(this.message, {this.statusCode, this.data});

  @override
  String toString() => message;
}
