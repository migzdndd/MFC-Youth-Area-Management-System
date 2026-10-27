import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../constants/app_colors.dart';
import '../providers/auth_provider.dart';
import '../services/sync_service.dart';
import '../widgets/app_drawer.dart';
import '../widgets/area_onboarding_dialog.dart';
import '../widgets/responsive_layout.dart';
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
        return 'Dashboard';
      case 'members':
        return 'Members';
      case 'chapters':
        return 'Chapters';
      case 'events':
        return 'Events';
      case 'services':
        return 'Services';
      case 'gig':
        return 'GIG Contributions';
      case 'reports':
        return 'Activity Reports';
      case 'readings':
        return 'Daily Scripture';
      case 'settings':
        return 'Account Security';
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
      case 'services':
        return const ServicesView();
      case 'gig':
        return const GigView();
      case 'reports':
        return const ReportsView();
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
      case 'chapters':
        return 2;
      case 'events':
        return 3;
      case 'services':
        return 4;
      case 'reports':
        return 5;
      default:
        return 0;
    }
  }

  void _onBottomNavTapped(int index) {
    const routes = ['dashboard', 'members', 'chapters', 'events', 'services', 'reports'];
    if (index >= 0 && index < routes.length) {
      setState(() => _currentRoute = routes[index]);
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final sync = context.watch<SyncService>();
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final isWide = ResponsiveLayout.isDesktop(context);

    return CallbackShortcuts(
      bindings: {
        const SingleActivator(LogicalKeyboardKey.keyK, control: true): _handleGlobalSearch,
        const SingleActivator(LogicalKeyboardKey.keyK, meta: true): _handleGlobalSearch,
      },
      child: Focus(
        autofocus: true,
        child: Scaffold(
          backgroundColor: isDark ? AppColors.navyDark : AppColors.pageLight,
          appBar: AppBar(
            leading: isWide
                ? IconButton(
                    icon: Icon(_sidebarCollapsed ? Icons.menu : Icons.menu_open),
                    tooltip: _sidebarCollapsed ? 'Expand Navigation Sidebar' : 'Collapse Navigation Sidebar',
                    onPressed: () {
                      setState(() => _sidebarCollapsed = !_sidebarCollapsed);
                    },
                  )
                : null,
            title: Row(
              children: [
                if (!isWide) ...[
                  Image.asset('assets/images/logo-2.png', height: 26),
                  const SizedBox(width: 8),
                ],
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

              // Area Context Selection Button
              IconButton(
                tooltip: 'Select Active Area Scope',
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
                        icon: Icon(Icons.apartment_outlined),
                        selectedIcon: Icon(Icons.apartment, color: AppColors.blue),
                        label: 'Chapters',
                      ),
                      NavigationDestination(
                        icon: Icon(Icons.event_outlined),
                        selectedIcon: Icon(Icons.event, color: AppColors.blue),
                        label: 'Events',
                      ),
                      NavigationDestination(
                        icon: Icon(Icons.handshake_outlined),
                        selectedIcon: Icon(Icons.handshake, color: AppColors.blue),
                        label: 'Services',
                      ),
                      NavigationDestination(
                        icon: Icon(Icons.analytics_outlined),
                        selectedIcon: Icon(Icons.analytics, color: AppColors.blue),
                        label: 'Reports',
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
      {'route': 'services', 'icon': Icons.handshake_outlined, 'tooltip': 'Services'},
      {'route': 'gig', 'icon': Icons.volunteer_activism_outlined, 'tooltip': 'GIG Contributions'},
      {'route': 'reports', 'icon': Icons.analytics_outlined, 'tooltip': 'Activity Reports'},
      {'route': 'readings', 'icon': Icons.menu_book_outlined, 'tooltip': 'Daily Scripture'},
      {'route': 'settings', 'icon': Icons.settings_outlined, 'tooltip': 'Account Security'},
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
