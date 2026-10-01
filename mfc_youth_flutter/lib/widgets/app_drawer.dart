import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../constants/app_colors.dart';
import '../providers/auth_provider.dart';
import '../providers/theme_provider.dart';

class AppDrawer extends StatelessWidget {
  final String currentRoute;
  final Function(String route) onNavigate;
  final bool isPermanent;

  const AppDrawer({
    super.key,
    required this.currentRoute,
    required this.onNavigate,
    this.isPermanent = false,
  });

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final theme = context.watch<ThemeProvider>();
    final isDark = theme.isDark;

    final navItems = [
      {'route': 'dashboard', 'title': 'Area Dashboard', 'icon': Icons.dashboard_outlined, 'activeIcon': Icons.dashboard},
      {'route': 'members', 'title': 'Members Directory', 'icon': Icons.people_outline, 'activeIcon': Icons.people},
      {'route': 'chapters', 'title': 'Chapters & Units', 'icon': Icons.apartment_outlined, 'activeIcon': Icons.apartment},
      {'route': 'events', 'title': 'Events & Attendance', 'icon': Icons.event_outlined, 'activeIcon': Icons.event},
      {'route': 'gig', 'title': 'GIG & Tithes', 'icon': Icons.volunteer_activism_outlined, 'activeIcon': Icons.volunteer_activism},
      {'route': 'reports', 'title': 'Activity Reports', 'icon': Icons.analytics_outlined, 'activeIcon': Icons.analytics},
      {'route': 'services', 'title': 'Ministries & Servants', 'icon': Icons.handshake_outlined, 'activeIcon': Icons.handshake},
      {'route': 'readings', 'title': 'Daily Scripture', 'icon': Icons.menu_book_outlined, 'activeIcon': Icons.menu_book},
      {'route': 'settings', 'title': 'Settings & Security', 'icon': Icons.settings_outlined, 'activeIcon': Icons.settings},
    ];

    return Drawer(
      backgroundColor: isDark ? AppColors.navyDark : AppColors.surfaceLight,
      child: SafeArea(
        child: Column(
          children: [
            // Drawer Header
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 18),
              decoration: BoxDecoration(
                border: Border(bottom: BorderSide(color: isDark ? AppColors.borderDark : AppColors.borderLight)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Image.asset(
                        'assets/images/logo-2.png',
                        height: 38,
                        fit: BoxFit.contain,
                      ),
                      const SizedBox(width: 12),
                      Text(
                        'MFC YOUTH',
                        style: TextStyle(
                          fontSize: 17,
                          fontWeight: FontWeight.w900,
                          color: isDark ? AppColors.textLight : AppColors.navy,
                          letterSpacing: 0.8,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),

                  // Area Indicator Chip
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    decoration: BoxDecoration(
                      color: AppColors.blue.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.location_on, color: AppColors.blue, size: 14),
                        const SizedBox(width: 6),
                        Flexible(
                          child: Text(
                            auth.areaName,
                            style: const TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w700,
                              color: AppColors.blue,
                            ),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            // Navigation List
            Expanded(
              child: ListView(
                padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 10),
                children: navItems.map((item) {
                  final isSelected = currentRoute == item['route'];
                  return Container(
                    margin: const EdgeInsets.symmetric(vertical: 2),
                    child: ListTile(
                      dense: true,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      selected: isSelected,
                      selectedTileColor: AppColors.blue.withValues(alpha: isDark ? 0.25 : 0.1),
                      leading: Icon(
                        (isSelected ? item['activeIcon'] : item['icon']) as IconData,
                        color: isSelected ? AppColors.blue : (isDark ? AppColors.mutedDark : AppColors.mutedLight),
                        size: 20,
                      ),
                      title: Text(
                        item['title'] as String,
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                          color: isSelected
                              ? (isDark ? AppColors.cyan : AppColors.blue)
                              : (isDark ? AppColors.textLight : AppColors.textDark),
                        ),
                      ),
                      onTap: () {
                        if (!isPermanent) {
                          Navigator.of(context).pop();
                        }
                        onNavigate(item['route'] as String);
                      },
                    ),
                  );
                }).toList(),
              ),
            ),

            // Footer (Theme toggle & Logout)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                border: Border(top: BorderSide(color: isDark ? AppColors.borderDark : AppColors.borderLight)),
              ),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          Icon(
                            isDark ? Icons.dark_mode : Icons.light_mode,
                            size: 18,
                            color: isDark ? AppColors.mutedDark : AppColors.mutedLight,
                          ),
                          const SizedBox(width: 8),
                          Text(
                            isDark ? 'Dark Theme' : 'Light Theme',
                            style: TextStyle(
                              fontSize: 13,
                              color: isDark ? AppColors.textLight : AppColors.textDark,
                            ),
                          ),
                        ],
                      ),
                      Switch.adaptive(
                        value: isDark,
                        onChanged: (_) => theme.toggleTheme(),
                        activeTrackColor: AppColors.blue,
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  ListTile(
                    dense: true,
                    contentPadding: EdgeInsets.zero,
                    leading: const Icon(Icons.logout, color: AppColors.danger, size: 20),
                    title: const Text(
                      'Sign Out',
                      style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.danger),
                    ),
                    onTap: () => auth.logout(),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
