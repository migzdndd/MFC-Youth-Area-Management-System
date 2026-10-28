import 'dart:convert';
import 'package:http/http.dart' as http;
import '../constants/app_constants.dart';
import 'app_exception.dart';
import 'storage_service.dart';

class ApiService {
  final StorageService _storage;

  ApiService(this._storage);

  Future<String> getBaseUrl() async {
    final custom = await _storage.getCustomApiUrl();
    if (custom != null && custom.trim().isNotEmpty) {
      if (custom.contains('mfc-youth-area-management-web.vercel.app')) {
        await _storage.setCustomApiUrl(null);
        return AppConstants.defaultApiUrl;
      }
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
    int timeoutSeconds = 15,
  }) async {
    final baseUrl = await getBaseUrl();
    final normalizedPath = endpoint.startsWith('/') ? endpoint : '/$endpoint';
    final fullPath = normalizedPath.startsWith('/api') ? normalizedPath : '/api$normalizedPath';
    final uri = Uri.parse('$baseUrl$fullPath');

    final effectiveToken = token ?? await _storage.getAccessToken();
    String? effectiveAreaId = areaId;
    if (effectiveAreaId == null || effectiveAreaId.isEmpty) {
      final session = await _storage.getSession();
      effectiveAreaId = session?.areaId;
    }

    final reqHeaders = <String, String>{
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      if (effectiveToken != null && effectiveToken.isNotEmpty) 'Authorization': 'Bearer $effectiveToken',
      if (effectiveAreaId != null && effectiveAreaId.isNotEmpty) 'X-MFC-Area-ID': effectiveAreaId,
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
        String errorMessage = 'Request failed with status ${response.statusCode}';
        final err = data['error'];
        if (err is Map && err['message'] != null) {
          errorMessage = err['message'].toString();
        } else if (err != null) {
          errorMessage = err.toString();
        } else if (data['message'] != null) {
          errorMessage = data['message'].toString();
        }

        throw ApiException(
          errorMessage,
          statusCode: response.statusCode,
          data: data,
        );
      }
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException('Network connection error: $e');
    }
  }
}

class ApiException extends AppException {
  final int? statusCode;
  final Map<String, dynamic>? data;

  ApiException(super.message, {this.statusCode, this.data, super.code, super.originalError});
}
