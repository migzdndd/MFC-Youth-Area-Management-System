import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../constants/app_colors.dart';
import '../../providers/auth_provider.dart';
import '../../providers/dashboard_provider.dart';
import '../../services/sync_service.dart';
import '../../widgets/area_onboarding_dialog.dart';
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
    final isDark = Theme.of(context).brightness == Brightness.dark;

    if (dash.loading) {
      return const DashboardSkeletonWidget();
    }

    final screenWidth = MediaQuery.of(context).size.width;
    final isWide = screenWidth > 960;
    final currencyFormat = NumberFormat.currency(symbol: 'PHP ', decimalDigits: 0);

    // Compute Members by Chapter distribution
    final Map<String, int> chapterCounts = {};
    for (final m in dash.members) {
      final name = m.chapterName?.trim().isNotEmpty == true ? m.chapterName! : 'Unassigned';
      chapterCounts[name] = (chapterCounts[name] ?? 0) + 1;
    }
    final totalMembersCount = dash.members.length;

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
                        Text(
                          'Welcome back, ${auth.session?.name ?? "Leader"}.',
                          style: const TextStyle(
                            fontSize: 22,
                            fontWeight: FontWeight.w800,
                            color: Colors.white,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Row(
                          children: [
                            GestureDetector(
                              onTap: () {
                                showDialog(
                                  context: context,
                                  builder: (ctx) => const AreaOnboardingDialog(),
                                );
                              },
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                                decoration: BoxDecoration(
                                  color: Colors.white.withValues(alpha: 0.15),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    const Icon(Icons.location_on, color: AppColors.cyan, size: 14),
                                    const SizedBox(width: 6),
                                    Text(
                                      auth.areaName,
                                      style: const TextStyle(
                                        fontSize: 12,
                                        color: Colors.white,
                                        fontWeight: FontWeight.w700,
                                      ),
                                    ),
                                    const SizedBox(width: 4),
                                    const Icon(Icons.arrow_drop_down, color: Colors.white, size: 16),
                                  ],
                                ),
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

            // 5 Live KPI Data Gauges
            GridView.count(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              crossAxisCount: isWide ? 5 : (screenWidth > 600 ? 3 : 2),
              crossAxisSpacing: 12,
              mainAxisSpacing: 12,
              childAspectRatio: isWide ? 1.35 : 1.3,
              children: [
                StatCard(
                  title: 'Active Members',
                  value: dash.activeMembers.toString(),
                  icon: Icons.people_outline,
                  iconColor: AppColors.blue,
                  onTap: () => widget.onNavigate?.call('members'),
                ),
                StatCard(
                  title: 'Chapters',
                  value: dash.totalChapters.toString(),
                  icon: Icons.apartment_outlined,
                  iconColor: AppColors.cyan,
                  onTap: () => widget.onNavigate?.call('chapters'),
                ),
                StatCard(
                  title: 'Households',
                  value: dash.reports.where((r) => r.reportType.toLowerCase().contains('household')).length.toString(),
                  icon: Icons.home_work_outlined,
                  iconColor: AppColors.info,
                  onTap: () => widget.onNavigate?.call('reports'),
                ),
                StatCard(
                  title: 'Upcoming Events',
                  value: dash.totalEvents.toString(),
                  icon: Icons.event_available_outlined,
                  iconColor: AppColors.warning,
                  onTap: () => widget.onNavigate?.call('events'),
                ),
                StatCard(
                  title: 'GIG Financial Tally',
                  value: currencyFormat.format(dash.gigStewardshipTotal),
                  icon: Icons.volunteer_activism_outlined,
                  iconColor: AppColors.gold,
                  onTap: () => widget.onNavigate?.call('gig'),
                ),
              ],
            ),
            const SizedBox(height: 24),

            // Section Widget 1: Members by Chapter
            Text(
              'Members by Chapter',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w800,
                color: isDark ? AppColors.textLight : AppColors.textDark,
              ),
            ),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: isDark ? AppColors.borderDark : AppColors.borderLight),
              ),
              child: chapterCounts.isEmpty
                  ? Center(
                      child: Text(
                        'No chapter member distributions available yet.',
                        style: TextStyle(color: isDark ? AppColors.mutedDark : AppColors.mutedLight),
                      ),
                    )
                  : Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: chapterCounts.entries.map((entry) {
                        final percent = totalMembersCount > 0 ? (entry.value / totalMembersCount) : 0.0;
                        return Padding(
                          padding: const EdgeInsets.symmetric(vertical: 8),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Text(
                                    entry.key,
                                    style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13),
                                  ),
                                  Text(
                                    '${entry.value} members (${(percent * 100).toStringAsFixed(1)}%)',
                                    style: TextStyle(
                                      fontSize: 12,
                                      fontWeight: FontWeight.w600,
                                      color: isDark ? AppColors.mutedDark : AppColors.mutedLight,
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 6),
                              ClipRRect(
                                borderRadius: BorderRadius.circular(4),
                                child: LinearProgressIndicator(
                                  value: percent,
                                  minHeight: 8,
                                  backgroundColor: (isDark ? Colors.white : Colors.black).withValues(alpha: 0.06),
                                  valueColor: const AlwaysStoppedAnimation<Color>(AppColors.blue),
                                ),
                              ),
                            ],
                          ),
                        );
                      }).toList(),
                    ),
            ),
            const SizedBox(height: 24),

            // Section Widget 2: Events Overview
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Events Overview',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w800,
                    color: isDark ? AppColors.textLight : AppColors.textDark,
                  ),
                ),
                TextButton(
                  onPressed: () => widget.onNavigate?.call('events'),
                  child: const Text('View All', style: TextStyle(color: AppColors.blue, fontWeight: FontWeight.w700)),
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
                    'No scheduled events.',
                    style: TextStyle(fontSize: 13, color: isDark ? AppColors.mutedDark : AppColors.mutedLight),
                  ),
                ),
              )
            else
              ListView.separated(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: dash.events.take(4).length,
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
                                '${ev.venue ?? "Area Venue"} • ${ev.date ?? "Upcoming"}',
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

            // Scripture Readings feed
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
                          'Daily Scripture',
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
          ],
        ),
      ),
    );
  }
}
