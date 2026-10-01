import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../constants/app_colors.dart';
import '../providers/auth_provider.dart';
import '../widgets/app_drawer.dart';
import '../widgets/area_onboarding_dialog.dart';
import 'chapters/chapters_view.dart';
import 'dashboard/dashboard_view.dart';
import 'events/events_view.dart';
import 'gig/gig_view.dart';
import 'members/members_view.dart';
import 'readings/readings_view.dart';
import 'reports/reports_view.dart';
import 'services/services_view.dart';
import 'settings/settings_view.dart';

class HomeShell extends StatefulWidget {
  const HomeShell({super.key});

  @override
  State<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends State<HomeShell> {
  String _currentRoute = 'dashboard';
  bool _checkedAreaSetup = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (!_checkedAreaSetup) {
      _checkedAreaSetup = true;
      WidgetsBinding.instance.addPostFrameCallback((_) {
        _checkAreaOnboarding();
      });
    }
  }

  void _checkAreaOnboarding() {
    final auth = context.read<AuthProvider>();
    if (auth.needsAreaSetup && auth.isLeadership) {
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (ctx) => const AreaOnboardingDialog(),
      );
    }
  }

  String _getTitle() {
    switch (_currentRoute) {
      case 'dashboard':
        return 'Area Dashboard';
      case 'members':
        return 'Youth Directory';
      case 'chapters':
        return 'Chapters & Units';
      case 'events':
        return 'Events & Assembly';
      case 'gig':
        return 'GIG Financials';
      case 'reports':
        return 'Activity Reports';
      case 'services':
        return 'Creative Ministries';
      case 'readings':
        return 'Daily Scripture';
      case 'settings':
        return 'Settings & Area';
      default:
        return 'MFC Youth';
    }
  }

  Widget _getBody() {
    switch (_currentRoute) {
      case 'dashboard':
        return DashboardView(onNavigate: (r) => setState(() => _currentRoute = r));
      case 'members':
        return const MembersView();
      case 'chapters':
        return const ChaptersView();
      case 'events':
        return const EventsView();
      case 'gig':
        return const GigView();
      case 'reports':
        return const ReportsView();
      case 'services':
        return const ServicesView();
      case 'readings':
        return const ReadingsView();
      case 'settings':
        return const SettingsView();
      default:
        return DashboardView(onNavigate: (r) => setState(() => _currentRoute = r));
    }
  }

  int _getBottomNavIndex() {
    switch (_currentRoute) {
      case 'dashboard':
        return 0;
      case 'members':
        return 1;
      case 'events':
        return 2;
      case 'readings':
        return 3;
      case 'settings':
        return 4;
      default:
        return 0;
    }
  }

  void _onBottomNavTapped(int index) {
    switch (index) {
      case 0:
        setState(() => _currentRoute = 'dashboard');
        break;
      case 1:
        setState(() => _currentRoute = 'members');
        break;
      case 2:
        setState(() => _currentRoute = 'events');
        break;
      case 3:
        setState(() => _currentRoute = 'readings');
        break;
      case 4:
        setState(() => _currentRoute = 'settings');
        break;
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final isWide = MediaQuery.of(context).size.width >= 960;

    return Scaffold(
      backgroundColor: isDark ? AppColors.navyDark : AppColors.surfaceLight,
      appBar: AppBar(
        automaticallyImplyLeading: !isWide,
        title: Row(
          children: [
            Image.asset(
              'assets/images/logo-2.png',
              height: 28,
              fit: BoxFit.contain,
            ),
            const SizedBox(width: 10),
            Text(
              _getTitle(),
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w800,
                color: isDark ? AppColors.textLight : AppColors.navy,
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            tooltip: 'Area Database Selection',
            icon: const Icon(Icons.hub_outlined),
            onPressed: () {
              showDialog(
                context: context,
                builder: (ctx) => const AreaOnboardingDialog(),
              );
            },
          ),
          const SizedBox(width: 8),
        ],
        elevation: 0,
        backgroundColor: isDark ? AppColors.surfaceDark : Colors.white,
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1),
          child: Container(
            color: isDark ? AppColors.borderDark : AppColors.borderLight,
            height: 1,
          ),
        ),
      ),
      drawer: isWide
          ? null
          : AppDrawer(
              currentRoute: _currentRoute,
              onNavigate: (r) => setState(() => _currentRoute = r),
              isPermanent: false,
            ),
      body: isWide
          ? Row(
              children: [
                SizedBox(
                  width: 270,
                  child: AppDrawer(
                    currentRoute: _currentRoute,
                    onNavigate: (r) => setState(() => _currentRoute = r),
                    isPermanent: true,
                  ),
                ),
                VerticalDivider(
                  width: 1,
                  thickness: 1,
                  color: isDark ? AppColors.borderDark : AppColors.borderLight,
                ),
                Expanded(child: _getBody()),
              ],
            )
          : _getBody(),
      bottomNavigationBar: isWide
          ? null
          : Container(
              decoration: BoxDecoration(
                border: Border(
                  top: BorderSide(
                    color: isDark ? AppColors.borderDark : AppColors.borderLight,
                  ),
                ),
              ),
              child: NavigationBar(
                selectedIndex: _getBottomNavIndex(),
                onDestinationSelected: _onBottomNavTapped,
                backgroundColor: isDark ? AppColors.surfaceDark : Colors.white,
                indicatorColor: AppColors.blue.withValues(alpha: 0.15),
                destinations: const [
                  NavigationDestination(
                    icon: Icon(Icons.dashboard_outlined),
                    selectedIcon: Icon(Icons.dashboard, color: AppColors.blue),
                    label: 'Dashboard',
                  ),
                  NavigationDestination(
                    icon: Icon(Icons.people_outline),
                    selectedIcon: Icon(Icons.people, color: AppColors.blue),
                    label: 'Members',
                  ),
                  NavigationDestination(
                    icon: Icon(Icons.event_outlined),
                    selectedIcon: Icon(Icons.event, color: AppColors.blue),
                    label: 'Events',
                  ),
                  NavigationDestination(
                    icon: Icon(Icons.menu_book_outlined),
                    selectedIcon: Icon(Icons.menu_book, color: AppColors.blue),
                    label: 'Word',
                  ),
                  NavigationDestination(
                    icon: Icon(Icons.settings_outlined),
                    selectedIcon: Icon(Icons.settings, color: AppColors.blue),
                    label: 'Settings',
                  ),
                ],
              ),
            ),
    );
  }
}
