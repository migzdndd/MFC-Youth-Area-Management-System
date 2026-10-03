/// Structured exception hierarchy for MFC Youth AMS.
abstract class AppException implements Exception {
  final String message;
  final String? code;
  final dynamic originalError;

  const AppException(this.message, {this.code, this.originalError});

  @override
  String toString() => message;
}

/// Authentication and session failures (invalid credentials, expired tokens, unauthorized access).
class AppAuthException extends AppException {
  const AppAuthException(
    super.message, {
    super.code,
    super.originalError,
  });
}

/// Network connectivity and timeout issues.
class AppNetworkException extends AppException {
  const AppNetworkException(
    super.message, {
    String super.code = 'network_error',
    super.originalError,
  });
}

/// Database, PostgREST, and RLS constraint failures.
class AppDatabaseException extends AppException {
  final String? details;

  const AppDatabaseException(
    super.message, {
    super.code,
    super.originalError,
    this.details,
  });
}

/// Input validation and parameter errors.
class AppValidationException extends AppException {
  const AppValidationException(
    super.message, {
    String super.code = 'validation_error',
    super.originalError,
  });
}

/// Resource not found errors.
class AppNotFoundException extends AppException {
  const AppNotFoundException(
    super.message, {
    String super.code = 'not_found',
    super.originalError,
  });
}
