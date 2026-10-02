import 'package:flutter_test/flutter_test.dart';
import 'package:mfc_youth_flutter/models/member.dart';
import 'package:mfc_youth_flutter/models/participant.dart';
import 'package:mfc_youth_flutter/models/daily_reading.dart';
import 'package:mfc_youth_flutter/models/report.dart';

void main() {
  group('Member Model & Business Logic Tests', () {
    test('Correctly calculates age and detects youth vs kids vs servant', () {
      final now = DateTime.now();
      final birthDate10YearsAgo = '${now.year - 10}-01-15';
      final birthDate16YearsAgo = '${now.year - 16}-05-20';

      final kidMember = Member.fromJson({
        'id': 1,
        'first_name': 'Juan',
        'last_name': 'Dela Cruz',
        'birth_date': birthDate10YearsAgo,
        'access_level': 'member',
        'status': 'Active',
      });

      expect(kidMember.age, 10);
      expect(kidMember.ministryCategory, 'Kids (4-12)');

      final youthMember = Member.fromJson({
        'id': 2,
        'first_name': 'Maria',
        'last_name': 'Santos',
        'birth_date': birthDate16YearsAgo,
        'access_level': 'member',
        'status': 'Active',
      });

      expect(youthMember.age, 16);
      expect(youthMember.ministryCategory, 'Youth (13-21)');

      final leaderMember = Member.fromJson({
        'id': 3,
        'first_name': 'Brother',
        'last_name': 'Leader',
        'access_level': 'chapter_servant',
        'status': 'Active',
      });

      expect(leaderMember.ministryCategory, 'Chapter Servant');
      expect(leaderMember.accessLevel, 'chapter_servant');
    });

    test('Member full name and contact handling', () {
      final member = Member.fromJson({
        'id': 'uuid-101',
        'first_name': 'Francis',
        'last_name': 'Javier',
        'contact_number': '+639171234567',
        'emergency_contact_name': 'Parent Name',
        'emergency_contact_phone': '+639189876543',
        'school': 'University of Santo Tomas',
        'status': 'Active',
      });

      expect(member.fullName, 'Francis Javier');
      expect(member.phone, '+639171234567');
      expect(member.emergencyContactName, 'Parent Name');
      expect(member.isActive, isTrue);
    });
  });

  group('EventParticipant Model Tests', () {
    test('Correctly deserializes from backend schema and supports attendance copyWith', () {
      final json = {
        'id': 42,
        'event_id': 10,
        'member_id': 100,
        'member_name': 'Gabriel Reyes',
        'attended': false,
        'payment_status': 'Paid',
        'mode_of_payment': 'GCash',
        'reference_number': 'REF123456',
      };

      final p = EventParticipant.fromJson(json);
      expect(p.id, 42);
      expect(p.memberName, 'Gabriel Reyes');
      expect(p.attended, isFalse);
      expect(p.paymentStatus, 'Paid');

      final checkedIn = p.copyWith(attended: true);
      expect(checkedIn.attended, isTrue);
      expect(checkedIn.memberName, 'Gabriel Reyes');
      expect(checkedIn.id, 42);
    });
  });

  group('DailyReading and Report Model Tests', () {
    test('Daily reading fallback content and formatting', () {
      final reading = DailyReading.fromJson({
        'date': '2026-10-02',
        'title': 'Memorial of the Holy Guardian Angels',
        'gospel': {
          'reference': 'Matthew 18:1-5, 10',
          'text': 'See that you do not despise one of these little ones.',
        },
      });

      expect(reading.title, 'Memorial of the Holy Guardian Angels');
      expect(reading.gospelRef, 'Matthew 18:1-5, 10');
      expect(reading.content, contains('despise'));
    });

    test('Pastoral Activity Report deserialization', () {
      final report = ActivityReport.fromJson({
        'id': 5,
        'report_type': 'Household',
        'title': 'October Household Meeting',
        'activity_date': '2026-10-01',
        'location': 'Community Center',
        'participant_count': 12,
        'notes': 'Great discussion on servant leadership.',
      });

      expect(report.reportType, 'Household');
      expect(report.title, 'October Household Meeting');
      expect(report.participantCount, 12);
      expect(report.location, 'Community Center');
    });
  });
}
