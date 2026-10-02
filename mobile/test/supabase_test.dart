import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:mfc_youth_flutter/constants/app_constants.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  test('Supabase client initializes properly with AppConstants', () async {
    SharedPreferences.setMockInitialValues({});

    await Supabase.initialize(
      url: AppConstants.supabaseUrl,
      publishableKey: AppConstants.supabaseAnonKey,
    );

    expect(Supabase.instance.client, isNotNull);
    expect(Supabase.instance.client.auth, isNotNull);
  });
}
