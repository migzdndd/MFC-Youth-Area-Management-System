import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../constants/app_colors.dart';
import '../../models/member.dart';
import '../../providers/members_provider.dart';
import '../../widgets/wireframe_skeleton.dart';

class ServicesView extends StatefulWidget {
  const ServicesView({super.key});

  @override
  State<ServicesView> createState() => _ServicesViewState();
}

class _ServicesViewState extends State<ServicesView> {
  final List<Map<String, dynamic>> _creativeMinistries = [
    {
      'id': 'Music',
      'title': 'Music Ministry',
      'description': 'Worship leaders, instrumentalists, choir, and praise band servants.',
      'icon': Icons.music_note,
      'color': AppColors.blue,
    },
    {
      'id': 'Dance',
      'title': 'Dance Ministry',
      'description': 'Liturgical praise and conference youth dance team.',
      'icon': Icons.directions_run,
      'color': AppColors.purple,
    },
    {
      'id': 'Creative Writing',
      'title': 'Creative Writing',
      'description': 'Reflections, newsletters, scripts, and promotional write-ups.',
      'icon': Icons.edit_note,
      'color': AppColors.cyan,
    },
    {
      'id': 'Graphics & Promo',
      'title': 'Graphics & Promo',
      'description': 'Visual branding, posters, social media publicity, and presentations.',
      'icon': Icons.palette_outlined,
      'color': AppColors.gold,
    },
    {
      'id': 'Photography & Videography',
      'title': 'Media & Tech',
      'description': 'Photo coverage, live sound, event recaps, and video testimonies.',
      'icon': Icons.videocam_outlined,
      'color': AppColors.danger,
    },
  ];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<MembersProvider>().fetchMembers();
    });
  }

  void _showMinistryMembersSheet(BuildContext context, Map<String, dynamic> ministry, List<Member> ministryMembers) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) {
        return DraggableScrollableSheet(
          initialChildSize: 0.6,
          maxChildSize: 0.9,
          minChildSize: 0.4,
          expand: false,
          builder: (context, scrollController) {
            return Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Center(
                    child: Container(
                      width: 40,
                      height: 4,
                      decoration: BoxDecoration(
                        color: isDark ? AppColors.borderDark : AppColors.borderLight,
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: (ministry['color'] as Color).withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Icon(ministry['icon'] as IconData, color: ministry['color'] as Color, size: 24),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              ministry['title'] as String,
                              style: TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.w800,
                                color: isDark ? AppColors.textLight : AppColors.textDark,
                              ),
                            ),
                            Text(
                              '${ministryMembers.length} Servants assigned',
                              style: TextStyle(
                                fontSize: 13,
                                color: isDark ? AppColors.mutedDark : AppColors.mutedLight,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  const Divider(),
                  const SizedBox(height: 8),
                  Expanded(
                    child: ministryMembers.isEmpty
                        ? Center(
                            child: Text(
                              'No members assigned to this ministry yet.',
                              style: TextStyle(color: isDark ? AppColors.mutedDark : AppColors.mutedLight),
                            ),
                          )
                        : ListView.separated(
                            controller: scrollController,
                            itemCount: ministryMembers.length,
                            separatorBuilder: (_, __) => const Divider(height: 1),
                            itemBuilder: (context, idx) {
                              final mem = ministryMembers[idx];
                              return ListTile(
                                contentPadding: EdgeInsets.zero,
                                leading: CircleAvatar(
                                  backgroundColor: AppColors.blue,
                                  radius: 18,
                                  child: Text(
                                    mem.name.isNotEmpty ? mem.name[0].toUpperCase() : 'M',
                                    style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                                  ),
                                ),
                                title: Text(
                                  mem.name,
                                  style: TextStyle(
                                    fontWeight: FontWeight.w700,
                                    color: isDark ? AppColors.textLight : AppColors.textDark,
                                  ),
                                ),
                                subtitle: Text(
                                  mem.chapterName != null ? 'Chapter: ${mem.chapterName}' : 'MFC Youth',
                                  style: TextStyle(fontSize: 12, color: isDark ? AppColors.mutedDark : AppColors.mutedLight),
                                ),
                              );
                            },
                          ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final membersProv = context.watch<MembersProvider>();


    if (membersProv.loading) {
      return const TableSkeletonWidget(itemCount: 4);
    }

    return Scaffold(
      backgroundColor: Colors.transparent,
      body: RefreshIndicator(
        onRefresh: () => membersProv.fetchMembers(),
        color: AppColors.blue,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            ..._creativeMinistries.map((ministry) {
              final serviceId = ministry['id'] as String;
              final assignedMembers = membersProv.members.where((m) => m.services.contains(serviceId)).toList();

              return Container(
                margin: const EdgeInsets.only(bottom: 12),
                decoration: BoxDecoration(
                  color: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: isDark ? AppColors.borderDark : AppColors.borderLight),
                ),
                child: ListTile(
                  contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  leading: Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: (ministry['color'] as Color).withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Icon(ministry['icon'] as IconData, color: ministry['color'] as Color, size: 24),
                  ),
                  title: Text(
                    ministry['title'] as String,
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w800,
                      color: isDark ? AppColors.textLight : AppColors.textDark,
                    ),
                  ),
                  subtitle: Padding(
                    padding: const EdgeInsets.only(top: 4),
                    child: Text(
                      ministry['description'] as String,
                      style: TextStyle(fontSize: 12, color: isDark ? AppColors.mutedDark : AppColors.mutedLight),
                    ),
                  ),
                  trailing: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    decoration: BoxDecoration(
                      color: (ministry['color'] as Color).withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(999),
                    ),
                    child: Text(
                      '${assignedMembers.length} Servants',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                        color: ministry['color'] as Color,
                      ),
                    ),
                  ),
                  onTap: () => _showMinistryMembersSheet(context, ministry, assignedMembers),
                ),
              );
            }),
          ],
        ),
      ),
    );
  }
}
