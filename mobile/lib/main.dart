import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'constants/app_colors.dart';
import 'constants/app_constants.dart';
import 'providers/auth_provider.dart';
import 'providers/dashboard_provider.dart';
import 'providers/members_provider.dart';
import 'providers/theme_provider.dart';
import 'services/api_service.dart';
import 'services/storage_service.dart';
import 'services/sync_service.dart';
import 'views/auth/login_view.dart';
import 'views/home_shell.dart';
import 'widgets/wireframe_skeleton.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize Supabase client
  try {
    await Supabase.initialize(
      url: AppConstants.supabaseUrl,
      publishableKey: AppConstants.supabaseAnonKey,
    );
  } catch (err) {
    debugPrint('Supabase initial setup warning: $err');
  }

  // Initialize Local Storage
  final storageService = StorageService();
  await storageService.init();

  runApp(
    MultiProvider(
      providers: [
        Provider<StorageService>.value(value: storageService),
        ProxyProvider<StorageService, ApiService>(
          update: (_, storage, __) => ApiService(storage),
        ),
        ChangeNotifierProxyProvider<ApiService, SyncService>(
          create: (ctx) => SyncService(ctx.read<ApiService>()),
          update: (_, api, prev) => prev ?? SyncService(api),
        ),
        ChangeNotifierProvider(create: (_) => ThemeProvider(storageService)),
        ChangeNotifierProxyProvider2<ApiService, StorageService, AuthProvider>(
          create: (ctx) => AuthProvider(
            ctx.read<ApiService>(),
            ctx.read<StorageService>(),
          ),
          update: (_, api, storage, prev) => prev ?? AuthProvider(api, storage),
        ),
        ChangeNotifierProxyProvider<ApiService, DashboardProvider>(
          create: (ctx) => DashboardProvider(ctx.read<ApiService>()),
          update: (_, api, prev) => prev ?? DashboardProvider(api),
        ),
        ChangeNotifierProxyProvider<ApiService, MembersProvider>(
          create: (ctx) => MembersProvider(ctx.read<ApiService>()),
          update: (_, api, prev) => prev ?? MembersProvider(api),
        ),
      ],
      child: const MfcYouthApp(),
    ),
  );
}

class MfcYouthApp extends StatelessWidget {
  const MfcYouthApp({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = context.watch<ThemeProvider>();

    final lightBase = ThemeData.light();
    final lightTheme = ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      primaryColor: AppColors.blue,
      scaffoldBackgroundColor: AppColors.surfaceLight,
      colorScheme: ColorScheme.fromSeed(
        seedColor: AppColors.blue,
        primary: AppColors.blue,
        secondary: AppColors.cyan,
        surface: AppColors.surfaceLight,
        brightness: Brightness.light,
      ),
      textTheme: GoogleFonts.interTextTheme(lightBase.textTheme).copyWith(
        titleLarge: GoogleFonts.poppins(fontWeight: FontWeight.w700, color: AppColors.navy),
        titleMedium: GoogleFonts.poppins(fontWeight: FontWeight.w600, color: AppColors.navy),
        headlineSmall: GoogleFonts.poppins(fontWeight: FontWeight.w800, color: AppColors.navy),
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: Colors.white,
        foregroundColor: AppColors.navy,
        elevation: 0,
      ),
    );

    final darkBase = ThemeData.dark();
    final darkTheme = ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      primaryColor: AppColors.blue,
      scaffoldBackgroundColor: AppColors.navyDark,
      colorScheme: ColorScheme.fromSeed(
        seedColor: AppColors.blue,
        primary: AppColors.blue,
        secondary: AppColors.cyan,
        surface: AppColors.surfaceDark,
        brightness: Brightness.dark,
      ),
      textTheme: GoogleFonts.interTextTheme(darkBase.textTheme).copyWith(
        titleLarge: GoogleFonts.poppins(fontWeight: FontWeight.w700, color: AppColors.textLight),
        titleMedium: GoogleFonts.poppins(fontWeight: FontWeight.w600, color: AppColors.textLight),
        headlineSmall: GoogleFonts.poppins(fontWeight: FontWeight.w800, color: AppColors.textLight),
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: AppColors.surfaceDark,
        foregroundColor: AppColors.textLight,
        elevation: 0,
      ),
    );

    return MaterialApp(
      title: 'MFC Youth Area Management',
      debugShowCheckedModeBanner: false,
      themeMode: theme.themeMode,
      theme: lightTheme,
      darkTheme: darkTheme,
      home: Consumer<AuthProvider>(
        builder: (context, auth, _) {
          if (auth.loading) {
            return const Scaffold(
              body: Center(
                child: DashboardSkeletonWidget(),
              ),
            );
          }

          if (auth.isAuthenticated) {
            return const HomeShell();
          }

          return const LoginView();
        },
      ),
    );
  }
}
