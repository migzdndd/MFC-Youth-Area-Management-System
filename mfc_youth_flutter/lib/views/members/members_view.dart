import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../constants/app_colors.dart';
import '../../models/member.dart';
import '../../providers/auth_provider.dart';
import '../../providers/members_provider.dart';
import '../../widgets/wireframe_skeleton.dart';

class MembersView extends StatefulWidget {
  const MembersView({super.key});

  @override
  State<MembersView> createState() => _MembersViewState();
}

class _MembersViewState extends State<MembersView> {
  final TextEditingController _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final auth = context.read<AuthProvider>();
      context.read<MembersProvider>().loadMembers(
            token: auth.session?.accessToken,
            areaId: auth.areaId,
          );
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _showMemberDetail(Member m) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) {
        return Padding(
          padding: EdgeInsets.only(
            left: 24,
            right: 24,
            top: 20,
            bottom: MediaQuery.of(context).viewInsets.bottom + 24,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 36,
                  height: 4,
                  decoration: BoxDecoration(
                    color: Colors.grey.withValues(alpha: 0.3),
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 18),
              Row(
                children: [
                  CircleAvatar(
                    radius: 26,
                    backgroundColor: AppColors.blue.withValues(alpha: 0.15),
                    child: Text(
                      m.firstName.isNotEmpty ? m.firstName[0].toUpperCase() : 'M',
                      style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: AppColors.blue),
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          m.fullName,
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w800,
                            color: isDark ? AppColors.textLight : AppColors.textDark,
                          ),
                        ),
                        Text(
                          m.chapterName ?? 'Unassigned Chapter',
                          style: TextStyle(fontSize: 13, color: isDark ? AppColors.mutedDark : AppColors.mutedLight),
                        ),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: (m.isActive ? AppColors.success : AppColors.danger).withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(999),
                    ),
                    child: Text(
                      m.status,
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        color: m.isActive ? AppColors.success : AppColors.danger,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),
              _DetailRow(icon: Icons.email_outlined, label: 'Email', value: m.email ?? 'No email on record'),
              _DetailRow(icon: Icons.phone_outlined, label: 'Phone', value: m.phone ?? 'No phone recorded'),
              _DetailRow(icon: Icons.badge_outlined, label: 'Access Level', value: m.accessLevel ?? 'member'),
              if (m.services.isNotEmpty) ...[
                const SizedBox(height: 12),
                const Text('Ministry Services', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700)),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 6,
                  runSpacing: 6,
                  children: m.services.map((s) {
                    return Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: AppColors.blue.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        s,
                        style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppColors.blue),
                      ),
                    );
                  }).toList(),
                ),
              ],
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                height: 46,
                child: OutlinedButton(
                  onPressed: () => Navigator.of(context).pop(),
                  style: OutlinedButton.styleFrom(
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                  child: const Text('Close'),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final membersProv = context.watch<MembersProvider>();
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: Colors.transparent,
      body: Column(
        children: [
          // Search & Filters Header
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
              border: Border(bottom: BorderSide(color: isDark ? AppColors.borderDark : AppColors.borderLight)),
            ),
            child: Column(
              children: [
                TextField(
                  controller: _searchController,
                  decoration: InputDecoration(
                    hintText: 'Search by name, email, or ministry...',
                    prefixIcon: const Icon(Icons.search, size: 20),
                    suffixIcon: _searchController.text.isNotEmpty
                        ? IconButton(
                            icon: const Icon(Icons.clear, size: 18),
                            onPressed: () {
                              _searchController.clear();
                              membersProv.setSearchQuery('');
                            },
                          )
                        : null,
                    contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                  onChanged: (val) => membersProv.setSearchQuery(val),
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    _FilterChip(
                      label: 'All',
                      selected: membersProv.selectedStatus == 'All',
                      onSelected: () => membersProv.setStatusFilter('All'),
                    ),
                    const SizedBox(width: 8),
                    _FilterChip(
                      label: 'Active',
                      selected: membersProv.selectedStatus == 'Active',
                      onSelected: () => membersProv.setStatusFilter('Active'),
                    ),
                    const SizedBox(width: 8),
                    _FilterChip(
                      label: 'Inactive',
                      selected: membersProv.selectedStatus == 'Inactive',
                      onSelected: () => membersProv.setStatusFilter('Inactive'),
                    ),
                  ],
                ),
              ],
            ),
          ),

          // Member List
          Expanded(
            child: membersProv.loading
                ? const TableSkeletonWidget(itemCount: 7)
                : membersProv.filteredMembers.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.people_outline, size: 48, color: isDark ? AppColors.mutedDark : AppColors.mutedLight),
                            const SizedBox(height: 12),
                            Text(
                              'No member records found',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w700,
                                color: isDark ? AppColors.textLight : AppColors.textDark,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              'Try adjusting your search query or filters.',
                              style: TextStyle(fontSize: 12, color: isDark ? AppColors.mutedDark : AppColors.mutedLight),
                            ),
                          ],
                        ),
                      )
                    : ListView.separated(
                        padding: const EdgeInsets.all(16),
                        itemCount: membersProv.filteredMembers.length,
                        separatorBuilder: (_, __) => const SizedBox(height: 10),
                        itemBuilder: (context, index) {
                          final m = membersProv.filteredMembers[index];
                          return Material(
                            color: Colors.transparent,
                            child: InkWell(
                              onTap: () => _showMemberDetail(m),
                              borderRadius: BorderRadius.circular(12),
                              child: Container(
                                padding: const EdgeInsets.all(14),
                                decoration: BoxDecoration(
                                  color: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(color: isDark ? AppColors.borderDark : AppColors.borderLight),
                                ),
                                child: Row(
                                  children: [
                                    CircleAvatar(
                                      radius: 20,
                                      backgroundColor: AppColors.blue.withValues(alpha: 0.12),
                                      child: Text(
                                        m.firstName.isNotEmpty ? m.firstName[0].toUpperCase() : 'M',
                                        style: const TextStyle(fontWeight: FontWeight.w700, color: AppColors.blue),
                                      ),
                                    ),
                                    const SizedBox(width: 12),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            m.fullName,
                                            style: TextStyle(
                                              fontSize: 14,
                                              fontWeight: FontWeight.w700,
                                              color: isDark ? AppColors.textLight : AppColors.textDark,
                                            ),
                                          ),
                                          const SizedBox(height: 3),
                                          Text(
                                            m.chapterName ?? 'Chapter Unassigned',
                                            style: TextStyle(
                                              fontSize: 12,
                                              color: isDark ? AppColors.mutedDark : AppColors.mutedLight,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                    Container(
                                      width: 8,
                                      height: 8,
                                      decoration: BoxDecoration(
                                        color: m.isActive ? AppColors.success : AppColors.danger,
                                        shape: BoxShape.circle,
                                      ),
                                    ),
                                    const SizedBox(width: 8),
                                    const Icon(Icons.chevron_right, size: 20, color: Colors.grey),
                                  ],
                                ),
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

class _FilterChip extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onSelected;

  const _FilterChip({required this.label, required this.selected, required this.onSelected});

  @override
  Widget build(BuildContext context) {
    return ChoiceChip(
      label: Text(label, style: TextStyle(fontSize: 12, fontWeight: selected ? FontWeight.w700 : FontWeight.w500)),
      selected: selected,
      onSelected: (_) => onSelected(),
      selectedColor: AppColors.blue,
      labelStyle: TextStyle(color: selected ? Colors.white : null),
    );
  }
}

class _DetailRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;

  const _DetailRow({required this.icon, required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        children: [
          Icon(icon, size: 18, color: isDark ? AppColors.mutedDark : AppColors.mutedLight),
          const SizedBox(width: 10),
          Text('$label: ', style: TextStyle(fontSize: 13, color: isDark ? AppColors.mutedDark : AppColors.mutedLight)),
          Expanded(
            child: Text(
              value,
              style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: isDark ? AppColors.textLight : AppColors.textDark),
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }
}
