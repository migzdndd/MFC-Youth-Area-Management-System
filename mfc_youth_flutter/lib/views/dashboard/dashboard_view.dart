import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../constants/app_colors.dart';
import '../../providers/auth_provider.dart';
import '../../providers/dashboard_provider.dart';
import '../../services/sync_service.dart';
import '../../widgets/stat_card.dart';
import '../../widgets/wireframe_skeleton.dart';

class DashboardView extends StatefulWidget {
  final Function(String route)? onNavigate;

  const DashboardView({super.key, this.onNavigate});

  @override
  State<DashboardView> createState() => _DashboardViewState();
}

class _DashboardViewState extends State<DashboardView> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _refreshDashboard();
    });
  }

  Future<void> _refreshDashboard() async {
    final auth = context.read<AuthProvider>();
    final sync = context.read<SyncService>();
    await Future.wait([
      context.read<DashboardProvider>().loadDashboardData(
            token: auth.session?.accessToken,
            areaId: auth.areaId,
          ),
      sync.syncNow(
        token: auth.session?.accessToken,
        areaId: auth.areaId,
      ),
    ]);
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final dash = context.watch<DashboardProvider>();
    final sync = context.watch<SyncService>();
    final isDark = Theme.of(context).brightness == Brightness.dark;

    if (dash.loading) {
      return const DashboardSkeletonWidget();
    }

    final screenWidth = MediaQuery.of(context).size.width;
    final isWide = screenWidth > 960;
    final isTablet = screenWidth > 600 && screenWidth <= 960;
    final currencyFormat = NumberFormat.currency(symbol: 'PHP ', decimalDigits: 0);

    return RefreshIndicator(
      onRefresh: _refreshDashboard,
      color: AppColors.blue,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Welcome Header Card
            Container(
              padding: const EdgeInsets.all(22),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [AppColors.navy, AppColors.blueDark],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(
                    color: AppColors.navy.withValues(alpha: 0.22),
                    blurRadius: 16,
                    offset: const Offset(0, 6),
                  ),
                ],
              ),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                              decoration: BoxDecoration(
                                color: Colors.white.withValues(alpha: 0.16),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Text(
                                auth.session?.roleDisplay.toUpperCase() ?? 'SERVANT LEADER',
                                style: const TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.w800,
                                  letterSpacing: 0.6,
                                  color: AppColors.cyan,
                                ),
                              ),
                            ),
                            const SizedBox(width: 8),
                            // Live Sync Status Pill
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                              decoration: BoxDecoration(
                                color: sync.state == SyncState.offline
                                    ? AppColors.warning.withValues(alpha: 0.25)
                                    : AppColors.success.withValues(alpha: 0.25),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(
                                    sync.state == SyncState.offline ? Icons.cloud_off : Icons.cloud_done,
                                    size: 11,
                                    color: sync.state == SyncState.offline ? AppColors.warning : AppColors.success,
                                  ),
                                  const SizedBox(width: 4),
                                  Text(
                                    sync.statusMessage ?? 'Synced',
                                    style: TextStyle(
                                      fontSize: 10,
                                      fontWeight: FontWeight.w700,
                                      color: sync.state == SyncState.offline ? AppColors.warning : AppColors.success,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 10),
                        Text(
                          'Welcome, ${auth.session?.name ?? "Leader"}',
                          style: const TextStyle(
                            fontSize: 22,
                            fontWeight: FontWeight.w800,
                            color: Colors.white,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Row(
                          children: [
                            const Icon(Icons.location_on, color: AppColors.cyan, size: 14),
                            const SizedBox(width: 4),
                            Text(
                              auth.areaName,
                              style: TextStyle(
                                fontSize: 13,
                                color: Colors.white.withValues(alpha: 0.85),
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  Container(
                    width: 50,
                    height: 50,
                    padding: const EdgeInsets.all(6),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.12),
                      shape: BoxShape.circle,
                    ),
                    child: Image.asset(
                      'assets/images/logo-2.png',
                      fit: BoxFit.contain,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Section Title: Overview Metrics
            Text(
              'Ministry Metrics',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w800,
                color: isDark ? AppColors.textLight : AppColors.textDark,
              ),
            ),
            const SizedBox(height: 12),

            // 9 Summary Metric Cards
            GridView.count(
              crossAxisCount: isWide ? 3 : (isTablet ? 3 : 2),
              crossAxisSpacing: 12,
              mainAxisSpacing: 12,
              childAspectRatio: 1.35,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              children: [
                StatCard(
                  title: 'Total Members',
                  value: dash.totalMembers.toString(),
                  subtitle: '${dash.activeMembers} active youth',
                  icon: Icons.people,
                  iconColor: AppColors.blue,
                  onTap: () => widget.onNavigate?.call('members'),
                ),
                StatCard(
                  title: 'Active Members',
                  value: dash.activeMembers.toString(),
                  subtitle: 'In good standing',
                  icon: Icons.how_to_reg,
                  iconColor: AppColors.success,
                  onTap: () => widget.onNavigate?.call('members'),
                ),
                StatCard(
                  title: 'Active Chapters',
                  value: dash.totalChapters.toString(),
                  subtitle: 'Units organized',
                  icon: Icons.apartment,
                  iconColor: AppColors.cyan,
                  onTap: () => widget.onNavigate?.call('chapters'),
                ),
                StatCard(
                  title: 'Creative Ministries',
                  value: dash.totalServices.toString(),
                  subtitle: 'LIT, Music, Technical',
                  icon: Icons.palette_outlined,
                  iconColor: AppColors.purple,
                  onTap: () => widget.onNavigate?.call('services'),
                ),
                StatCard(
                  title: 'Area Events',
                  value: dash.totalEvents.toString(),
                  subtitle: 'Assemblies & retreats',
                  icon: Icons.event,
                  iconColor: AppColors.warning,
                  onTap: () => widget.onNavigate?.call('events'),
                ),
                StatCard(
                  title: 'Registrations',
                  value: dash.totalRegistrations.toString(),
                  subtitle: '${dash.totalAttended} attended',
                  icon: Icons.app_registration,
                  iconColor: AppColors.info,
                  onTap: () => widget.onNavigate?.call('events'),
                ),
                StatCard(
                  title: 'Total Attended',
                  value: dash.totalAttended.toString(),
                  subtitle: 'Fast check-in count',
                  icon: Icons.verified_user_outlined,
                  iconColor: AppColors.success,
                  onTap: () => widget.onNavigate?.call('events'),
                ),
                StatCard(
                  title: 'Activity Reports',
                  value: dash.totalReports.toString(),
                  subtitle: 'Pastoral logs',
                  icon: Icons.analytics_outlined,
                  iconColor: AppColors.blue,
                  onTap: () => widget.onNavigate?.call('reports'),
                ),
                StatCard(
                  title: 'GIG Stewardship',
                  value: currencyFormat.format(dash.gigStewardshipTotal),
                  subtitle: 'God Is Generous',
                  icon: Icons.volunteer_activism,
                  iconColor: AppColors.gold,
                  onTap: () => widget.onNavigate?.call('gig'),
                ),
              ],
            ),
            const SizedBox(height: 24),

            // Quick Actions Bar
            Text(
              'Quick Action Shortcuts',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w800,
                color: isDark ? AppColors.textLight : AppColors.textDark,
              ),
            ),
            const SizedBox(height: 12),
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: [
                  _QuickActionButton(
                    icon: Icons.person_add,
                    label: 'Add Member',
                    color: AppColors.blue,
                    onTap: () => widget.onNavigate?.call('members'),
                  ),
                  const SizedBox(width: 10),
                  _QuickActionButton(
                    icon: Icons.event_available,
                    label: 'Create Event',
                    color: AppColors.cyan,
                    onTap: () => widget.onNavigate?.call('events'),
                  ),
                  const SizedBox(width: 10),
                  _QuickActionButton(
                    icon: Icons.post_add,
                    label: 'Submit Report',
                    color: AppColors.warning,
                    onTap: () => widget.onNavigate?.call('reports'),
                  ),
                  const SizedBox(width: 10),
                  _QuickActionButton(
                    icon: Icons.list_alt,
                    label: 'Chapter Roster',
                    color: AppColors.success,
                    onTap: () => widget.onNavigate?.call('chapters'),
                  ),
                  const SizedBox(width: 10),
                  _QuickActionButton(
                    icon: Icons.volunteer_activism,
                    label: 'Log GIG',
                    color: AppColors.gold,
                    onTap: () => widget.onNavigate?.call('gig'),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Daily Scripture Card
            if (dash.dailyReading != null) ...[
              Container(
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(
                  color: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: isDark ? AppColors.borderDark : AppColors.borderLight),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Icon(Icons.menu_book, color: AppColors.blue, size: 20),
                        const SizedBox(width: 8),
                        Text(
                          'Daily Scripture & Reflection',
                          style: TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.w800,
                            color: isDark ? AppColors.textLight : AppColors.navy,
                          ),
                        ),
                        const Spacer(),
                        TextButton(
                          onPressed: () => widget.onNavigate?.call('readings'),
                          child: const Text('Read Full', style: TextStyle(fontSize: 12, color: AppColors.blue)),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Text(
                      dash.dailyReading!.title,
                      style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      dash.dailyReading!.content,
                      maxLines: 3,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        fontSize: 13,
                        color: isDark ? AppColors.mutedDark : AppColors.mutedLight,
                        height: 1.4,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),
            ],

            // Upcoming Events Section
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Upcoming Area Events',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w800,
                    color: isDark ? AppColors.textLight : AppColors.textDark,
                  ),
                ),
                TextButton(
                  onPressed: () => widget.onNavigate?.call('events'),
                  child: const Text('View All', style: TextStyle(color: AppColors.blue, fontSize: 13, fontWeight: FontWeight.w600)),
                ),
              ],
            ),
            const SizedBox(height: 8),
            if (dash.events.isEmpty)
              Container(
                padding: const EdgeInsets.all(20),
                width: double.infinity,
                decoration: BoxDecoration(
                  color: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: isDark ? AppColors.borderDark : AppColors.borderLight),
                ),
                child: Center(
                  child: Text(
                    'No scheduled events currently. Click Create Event to schedule one.',
                    style: TextStyle(fontSize: 13, color: isDark ? AppColors.mutedDark : AppColors.mutedLight),
                  ),
                ),
              )
            else
              ListView.separated(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: dash.events.take(3).length,
                separatorBuilder: (_, __) => const SizedBox(height: 10),
                itemBuilder: (context, index) {
                  final ev = dash.events[index];
                  return Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: isDark ? AppColors.borderDark : AppColors.borderLight),
                    ),
                    child: Row(
                      children: [
                        Container(
                          width: 44,
                          height: 44,
                          decoration: BoxDecoration(
                            color: AppColors.blue.withValues(alpha: 0.12),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: const Icon(Icons.event, color: AppColors.blue, size: 22),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                ev.title,
                                style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                '${ev.venue ?? "Area Venue"} | ${ev.date ?? "Upcoming"}',
                                style: TextStyle(
                                  fontSize: 12,
                                  color: isDark ? AppColors.mutedDark : AppColors.mutedLight,
                                ),
                              ),
                            ],
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: AppColors.infoBg,
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            ev.fee > 0 ? 'PHP ${ev.fee.toStringAsFixed(0)}' : 'Free',
                            style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: AppColors.info),
                          ),
                        ),
                      ],
                    ),
                  );
                },
              ),
            const SizedBox(height: 24),

            // Recent Pastoral Reports
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Recent Activity Reports',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w800,
                    color: isDark ? AppColors.textLight : AppColors.textDark,
                  ),
                ),
                TextButton(
                  onPressed: () => widget.onNavigate?.call('reports'),
                  child: const Text('View All', style: TextStyle(color: AppColors.blue, fontSize: 13, fontWeight: FontWeight.w600)),
                ),
              ],
            ),
            const SizedBox(height: 8),
            if (dash.reports.isEmpty)
              Container(
                padding: const EdgeInsets.all(20),
                width: double.infinity,
                decoration: BoxDecoration(
                  color: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: isDark ? AppColors.borderDark : AppColors.borderLight),
                ),
                child: Center(
                  child: Text(
                    'No pastoral activity reports logged yet.',
                    style: TextStyle(fontSize: 13, color: isDark ? AppColors.mutedDark : AppColors.mutedLight),
                  ),
                ),
              )
            else
              ListView.separated(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: dash.reports.take(3).length,
                separatorBuilder: (_, __) => const SizedBox(height: 10),
                itemBuilder: (context, index) {
                  final rep = dash.reports[index];
                  return Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: isDark ? AppColors.borderDark : AppColors.borderLight),
                    ),
                    child: Row(
                      children: [
                        Container(
                          width: 44,
                          height: 44,
                          decoration: BoxDecoration(
                            color: AppColors.warning.withValues(alpha: 0.12),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: const Icon(Icons.analytics_outlined, color: AppColors.warning, size: 22),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                rep.title,
                                style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                '${rep.reportType} | ${rep.location ?? "Chapter Assembly"} | ${rep.participantCount} youth',
                                style: TextStyle(
                                  fontSize: 12,
                                  color: isDark ? AppColors.mutedDark : AppColors.mutedLight,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  );
                },
              ),
          ],
        ),
      ),
    );
  }
}

class _QuickActionButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;

  const _QuickActionButton({
    required this.icon,
    required this.label,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
          decoration: BoxDecoration(
            color: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: isDark ? AppColors.borderDark : AppColors.borderLight),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 32,
                height: 32,
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.14),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(icon, color: color, size: 18),
              ),
              const SizedBox(width: 10),
              Text(
                label,
                style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
