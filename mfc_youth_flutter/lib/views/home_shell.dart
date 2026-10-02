import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../constants/app_colors.dart';
import '../providers/auth_provider.dart';
import '../services/sync_service.dart';
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
  bool _sidebarCollapsed = false;

  @override
  void initState() {
    super.initState();
    // Background sync on load
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final auth = context.read<AuthProvider>();
      context.read<SyncService>().syncNow(
            token: auth.session?.accessToken,
            areaId: auth.areaId,
          );
    });
  }

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

  void _handleGlobalSearch() {
    setState(() => _currentRoute = 'members');
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
        return 'Events & Attendance';
      case 'gig':
        return 'GIG Stewardship';
      case 'reports':
        return 'Activity Reports';
      case 'services':
        return 'Creative Ministries';
      case 'readings':
        return 'Daily Scripture';
      case 'settings':
        return 'Settings & Security';
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
      case 'reports':
        return 3;
      case 'settings':
      case 'readings':
      case 'chapters':
      case 'gig':
      case 'services':
        return 4;
      default:
        return 0;
    }
  }

  void _onBottomNavTapped(int index) {
    HapticFeedback.lightImpact();
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
        setState(() => _currentRoute = 'reports');
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
    final sync = context.watch<SyncService>();
    final auth = context.watch<AuthProvider>();

    return CallbackShortcuts(
      bindings: {
        const SingleActivator(LogicalKeyboardKey.keyK, control: true): _handleGlobalSearch,
        const SingleActivator(LogicalKeyboardKey.keyK, meta: true): _handleGlobalSearch,
      },
      child: Focus(
        autofocus: true,
        child: Scaffold(
          backgroundColor: isDark ? AppColors.navyDark : AppColors.surfaceLight,
          appBar: AppBar(
            automaticallyImplyLeading: !isWide,
            title: Row(
              children: [
                if (isWide) ...[
                  IconButton(
                    icon: Icon(_sidebarCollapsed ? Icons.menu_open : Icons.menu),
                    tooltip: _sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar',
                    onPressed: () => setState(() => _sidebarCollapsed = !_sidebarCollapsed),
                  ),
                  const SizedBox(width: 4),
                ],
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
              // Live Sync Status Chip
              GestureDetector(
                onTap: () {
                  sync.syncNow(
                    token: auth.session?.accessToken,
                    areaId: auth.areaId,
                  );
                },
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                  decoration: BoxDecoration(
                    color: sync.state == SyncState.offline
                        ? AppColors.warning.withValues(alpha: 0.18)
                        : (sync.state == SyncState.syncing ? AppColors.blue.withValues(alpha: 0.18) : AppColors.success.withValues(alpha: 0.18)),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        sync.state == SyncState.offline ? Icons.cloud_off : (sync.state == SyncState.syncing ? Icons.sync : Icons.cloud_done),
                        size: 14,
                        color: sync.state == SyncState.offline ? AppColors.warning : (sync.state == SyncState.syncing ? AppColors.blue : AppColors.success),
                      ),
                      const SizedBox(width: 6),
                      Text(
                        sync.statusMessage ?? 'Synced',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                          color: sync.state == SyncState.offline ? AppColors.warning : (sync.state == SyncState.syncing ? AppColors.blue : AppColors.success),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(width: 8),

              // Area Database Selection Button
              IconButton(
                tooltip: 'Select Active Area Database',
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
                    AnimatedContainer(
                      duration: const Duration(milliseconds: 200),
                      width: _sidebarCollapsed ? 72 : 270,
                      child: _sidebarCollapsed
                          ? _buildCollapsedSidebar(isDark)
                          : AppDrawer(
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
              : SafeArea(
                  child: _getBody(),
                ),
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
                        icon: Icon(Icons.analytics_outlined),
                        selectedIcon: Icon(Icons.analytics, color: AppColors.blue),
                        label: 'Reports',
                      ),
                      NavigationDestination(
                        icon: Icon(Icons.menu),
                        selectedIcon: Icon(Icons.menu_open, color: AppColors.blue),
                        label: 'More',
                      ),
                    ],
                  ),
                ),
        ),
      ),
    );
  }

  Widget _buildCollapsedSidebar(bool isDark) {
    final items = [
      {'route': 'dashboard', 'icon': Icons.dashboard_outlined, 'tooltip': 'Dashboard'},
      {'route': 'members', 'icon': Icons.people_outline, 'tooltip': 'Members'},
      {'route': 'chapters', 'icon': Icons.apartment_outlined, 'tooltip': 'Chapters'},
      {'route': 'events', 'icon': Icons.event_outlined, 'tooltip': 'Events'},
      {'route': 'gig', 'icon': Icons.volunteer_activism_outlined, 'tooltip': 'GIG'},
      {'route': 'reports', 'icon': Icons.analytics_outlined, 'tooltip': 'Reports'},
      {'route': 'services', 'icon': Icons.handshake_outlined, 'tooltip': 'Services'},
      {'route': 'readings', 'icon': Icons.menu_book_outlined, 'tooltip': 'Scripture'},
      {'route': 'settings', 'icon': Icons.settings_outlined, 'tooltip': 'Settings'},
    ];

    return Container(
      color: isDark ? AppColors.navyDark : AppColors.surfaceLight,
      padding: const EdgeInsets.symmetric(vertical: 12),
      child: Column(
        children: [
          Image.asset('assets/images/logo-2.png', height: 28),
          const SizedBox(height: 16),
          Expanded(
            child: ListView.builder(
              itemCount: items.length,
              itemBuilder: (context, idx) {
                final item = items[idx];
                final isSelected = _currentRoute == item['route'];
                return Padding(
                  padding: const EdgeInsets.symmetric(vertical: 4, horizontal: 8),
                  child: IconButton(
                    icon: Icon(item['icon'] as IconData),
                    color: isSelected ? AppColors.blue : (isDark ? AppColors.mutedDark : AppColors.mutedLight),
                    tooltip: item['tooltip'] as String,
                    onPressed: () => setState(() => _currentRoute = item['route'] as String),
                    style: IconButton.styleFrom(
                      backgroundColor: isSelected ? AppColors.blue.withValues(alpha: 0.15) : null,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
