import 'package:flutter_test/flutter_test.dart';
import 'package:mfc_youth_flutter/services/app_exception.dart';

void main() {
  group('AppException Hierarchy Tests', () {
    test('AppAuthException captures code and clean message', () {
      const authEx = AppAuthException(
        'Invalid login credentials',
        code: 'invalid_credentials',
      );

      expect(authEx.message, 'Invalid login credentials');
      expect(authEx.code, 'invalid_credentials');
      expect(authEx.toString(), 'Invalid login credentials');
      expect(authEx, isA<AppException>());
    });

    test('AppAuthException allows optional and null code parameter', () {
      const authExOmitted = AppAuthException('Session expired');
      expect(authExOmitted.code, isNull);

      const String? nullableCode = null;
      const authExNull = AppAuthException(
        'Auth failed',
        code: nullableCode,
      );
      expect(authExNull.code, isNull);
    });

    test('AppNetworkException provides user friendly network error message', () {
      const netEx = AppNetworkException('Connection timed out');
      expect(netEx.message, 'Connection timed out');
      expect(netEx.code, 'network_error');
      expect(netEx, isA<AppException>());
    });

    test('AppDatabaseException retains details and code', () {
      const dbEx = AppDatabaseException(
        'Failed to query members',
        code: '42P01',
        details: 'relation "members" does not exist',
      );

      expect(dbEx.message, 'Failed to query members');
      expect(dbEx.code, '42P01');
      expect(dbEx.details, contains('relation'));
      expect(dbEx, isA<AppException>());
    });

    test('AppDatabaseException allows optional and null code parameter', () {
      const dbExOmitted = AppDatabaseException('Database connection failed');
      expect(dbExOmitted.code, isNull);

      const String? nullableCode = null;
      const dbExNull = AppDatabaseException(
        'Database query failed',
        code: nullableCode,
      );
      expect(dbExNull.code, isNull);
    });

    test('AppValidationException formats validation issues', () {
      const valEx = AppValidationException('Email address cannot be empty');
      expect(valEx.code, 'validation_error');
      expect(valEx.message, 'Email address cannot be empty');
      expect(valEx, isA<AppException>());
    });

    test('AppNotFoundException handles missing entities', () {
      const notFoundEx = AppNotFoundException('Chapter record not found');
      expect(notFoundEx.code, 'not_found');
      expect(notFoundEx.toString(), 'Chapter record not found');
      expect(notFoundEx, isA<AppException>());
    });
  });
}
