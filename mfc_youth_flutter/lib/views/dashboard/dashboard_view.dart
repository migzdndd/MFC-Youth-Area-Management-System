import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../constants/app_colors.dart';
import '../../providers/auth_provider.dart';
import '../../providers/dashboard_provider.dart';
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
      final auth = context.read<AuthProvider>();
      context.read<DashboardProvider>().loadDashboardData(
            token: auth.session?.accessToken,
            areaId: auth.areaId,
          );
    });
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final dash = context.watch<DashboardProvider>();
    final isDark = Theme.of(context).brightness == Brightness.dark;

    if (dash.loading) {
      return const DashboardSkeletonWidget();
    }

    final isWide = MediaQuery.of(context).size.width > 700;

    return RefreshIndicator(
      onRefresh: () => dash.loadDashboardData(
        token: auth.session?.accessToken,
        areaId: auth.areaId,
      ),
      color: AppColors.blue,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Welcome Header
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [AppColors.navy, AppColors.blueDark],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(
                    color: AppColors.navy.withValues(alpha: 0.25),
                    blurRadius: 14,
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
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.15),
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
                        const SizedBox(height: 8),
                        Text(
                          'Welcome, ${auth.session?.name ?? "Leader"}',
                          style: const TextStyle(
                            fontSize: 20,
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
                    width: 48,
                    height: 48,
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

            // 4 KPI Stat Cards
            GridView.count(
              crossAxisCount: isWide ? 4 : 2,
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
                  title: 'Active Chapters',
                  value: dash.totalChapters.toString(),
                  subtitle: 'Units organized',
                  icon: Icons.apartment,
                  iconColor: AppColors.cyan,
                  onTap: () => widget.onNavigate?.call('chapters'),
                ),
                StatCard(
                  title: 'Upcoming Events',
                  value: dash.upcomingEventsCount.toString(),
                  subtitle: 'Attendance tracked',
                  icon: Icons.event,
                  iconColor: AppColors.warning,
                  onTap: () => widget.onNavigate?.call('events'),
                ),
                StatCard(
                  title: 'Activity Reports',
                  value: dash.totalReports.toString(),
                  subtitle: 'Monthly chapters',
                  icon: Icons.analytics,
                  iconColor: AppColors.success,
                  onTap: () => widget.onNavigate?.call('reports'),
                ),
              ],
            ),
            const SizedBox(height: 24),

            // Quick Actions Bar
            Text(
              'Quick Actions',
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
                    label: 'New Event',
                    color: AppColors.cyan,
                    onTap: () => widget.onNavigate?.call('events'),
                  ),
                  const SizedBox(width: 10),
                  _QuickActionButton(
                    icon: Icons.volunteer_activism,
                    label: 'Log Tithes',
                    color: AppColors.success,
                    onTap: () => widget.onNavigate?.call('gig'),
                  ),
                  const SizedBox(width: 10),
                  _QuickActionButton(
                    icon: Icons.post_add,
                    label: 'File Report',
                    color: AppColors.warning,
                    onTap: () => widget.onNavigate?.call('reports'),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

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
                decoration: BoxDecoration(
                  color: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: isDark ? AppColors.borderDark : AppColors.borderLight),
                ),
                child: Center(
                  child: Text(
                    'No scheduled events yet. Add an event to begin tracking.',
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
                                style: TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w700,
                                  color: isDark ? AppColors.textLight : AppColors.textDark,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                '${ev.date ?? "Date TBA"} · ${ev.venue ?? "Venue TBA"}',
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
                            color: AppColors.success.withValues(alpha: 0.12),
                            borderRadius: BorderRadius.circular(999),
                          ),
                          child: Text(
                            ev.fee > 0 ? '₱${ev.fee.toStringAsFixed(0)}' : 'Free',
                            style: const TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w700,
                              color: AppColors.success,
                            ),
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
        borderRadius: BorderRadius.circular(10),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
          decoration: BoxDecoration(
            color: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: color.withValues(alpha: 0.3)),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(icon, color: color, size: 16),
              const SizedBox(width: 8),
              Text(
                label,
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                  color: isDark ? AppColors.textLight : AppColors.textDark,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
