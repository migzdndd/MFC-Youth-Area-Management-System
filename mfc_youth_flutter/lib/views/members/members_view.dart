import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
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

  void _showAddEditMemberDialog([Member? existing]) {
    final isEdit = existing != null;
    final firstCtrl = TextEditingController(text: existing?.firstName ?? '');
    final lastCtrl = TextEditingController(text: existing?.lastName ?? '');
    final emailCtrl = TextEditingController(text: existing?.email ?? '');
    final phoneCtrl = TextEditingController(text: existing?.phone ?? '');
    final birthCtrl = TextEditingController(text: existing?.birthDate ?? '');
    final schoolCtrl = TextEditingController(text: existing?.school ?? '');
    final emergencyNameCtrl = TextEditingController(text: existing?.emergencyContactName ?? '');
    final emergencyPhoneCtrl = TextEditingController(text: existing?.emergencyContactPhone ?? '');
    String status = existing?.status ?? 'Active';
    String accessLevel = existing?.accessLevel ?? 'member';

    bool saving = false;

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setDlgState) {
          final isDark = Theme.of(context).brightness == Brightness.dark;

          return AlertDialog(
            backgroundColor: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            title: Text(
              isEdit ? 'Edit Pastoral Profile' : 'Register New Youth Member',
              style: TextStyle(
                fontWeight: FontWeight.w800,
                color: isDark ? AppColors.textLight : AppColors.navy,
              ),
            ),
            content: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 500),
              child: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: TextField(
                            controller: firstCtrl,
                            decoration: InputDecoration(
                              labelText: 'First Name',
                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                            ),
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: TextField(
                            controller: lastCtrl,
                            decoration: InputDecoration(
                              labelText: 'Last Name',
                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: emailCtrl,
                      keyboardType: TextInputType.emailAddress,
                      decoration: InputDecoration(
                        labelText: 'Email Address',
                        prefixIcon: const Icon(Icons.email_outlined, size: 20),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: phoneCtrl,
                      keyboardType: TextInputType.phone,
                      decoration: InputDecoration(
                        labelText: 'Contact Number',
                        prefixIcon: const Icon(Icons.phone_outlined, size: 20),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: birthCtrl,
                      decoration: InputDecoration(
                        labelText: 'Birth Date (YYYY-MM-DD)',
                        hintText: '2005-08-15',
                        prefixIcon: const Icon(Icons.cake_outlined, size: 20),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: schoolCtrl,
                      decoration: InputDecoration(
                        labelText: 'School / University Campus',
                        prefixIcon: const Icon(Icons.school_outlined, size: 20),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          child: TextField(
                            controller: emergencyNameCtrl,
                            decoration: InputDecoration(
                              labelText: 'Emergency Contact Name',
                              prefixIcon: const Icon(Icons.contact_phone_outlined, size: 20),
                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                            ),
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: TextField(
                            controller: emergencyPhoneCtrl,
                            keyboardType: TextInputType.phone,
                            decoration: InputDecoration(
                              labelText: 'Emergency Phone',
                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          child: DropdownButtonFormField<String>(
                            initialValue: status,
                            decoration: InputDecoration(
                              labelText: 'Status',
                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                            ),
                            items: const [
                              DropdownMenuItem(value: 'Active', child: Text('Active')),
                              DropdownMenuItem(value: 'Inactive', child: Text('Inactive')),
                            ],
                            onChanged: (v) => setDlgState(() => status = v ?? 'Active'),
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: DropdownButtonFormField<String>(
                            initialValue: accessLevel,
                            decoration: InputDecoration(
                              labelText: 'Ministry Role',
                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                            ),
                            items: const [
                              DropdownMenuItem(value: 'member', child: Text('Youth Member')),
                              DropdownMenuItem(value: 'chapter_servant', child: Text('Chapter Servant')),
                              DropdownMenuItem(value: 'lit_servant', child: Text('LIT Servant')),
                              DropdownMenuItem(value: 'campus_servant', child: Text('Campus Servant')),
                              DropdownMenuItem(value: 'mfc_high_servant', child: Text('High Servant')),
                            ],
                            onChanged: (v) => setDlgState(() => accessLevel = v ?? 'member'),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.of(ctx).pop(),
                child: const Text('Cancel'),
              ),
              ElevatedButton(
                onPressed: saving
                    ? null
                    : () async {
                        if (firstCtrl.text.trim().isEmpty || lastCtrl.text.trim().isEmpty) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('First and last name are required.')),
                          );
                          return;
                        }

                        setDlgState(() => saving = true);
                        final auth = context.read<AuthProvider>();
                        final prov = context.read<MembersProvider>();

                        final payload = <String, dynamic>{
                          if (isEdit) 'id': existing.id,
                          'firstName': firstCtrl.text.trim(),
                          'lastName': lastCtrl.text.trim(),
                          'email': emailCtrl.text.trim().isNotEmpty ? emailCtrl.text.trim() : null,
                          'contactNumber': phoneCtrl.text.trim().isNotEmpty ? phoneCtrl.text.trim() : null,
                          'birthDate': birthCtrl.text.trim().isNotEmpty ? birthCtrl.text.trim() : null,
                          'school': schoolCtrl.text.trim().isNotEmpty ? schoolCtrl.text.trim() : null,
                          'emergencyContactName': emergencyNameCtrl.text.trim().isNotEmpty ? emergencyNameCtrl.text.trim() : null,
                          'emergencyContactPhone': emergencyPhoneCtrl.text.trim().isNotEmpty ? emergencyPhoneCtrl.text.trim() : null,
                          'status': status,
                          'accessLevel': accessLevel,
                        };

                        final success = await prov.saveMember(
                          payload,
                          token: auth.session?.accessToken,
                          areaId: auth.areaId,
                        );

                        if (context.mounted) {
                          Navigator.of(ctx).pop();
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text(success ? 'Member profile saved successfully.' : 'Failed to save member profile.'),
                              backgroundColor: success ? AppColors.success : AppColors.danger,
                            ),
                          );
                        }
                      },
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.blue,
                  foregroundColor: Colors.white,
                ),
                child: saving
                    ? const SizedBox(
                        width: 16,
                        height: 16,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                      )
                    : const Text('Save Profile'),
              ),
            ],
          );
        },
      ),
    );
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
      builder: (sheetCtx) {
        return Padding(
          padding: EdgeInsets.only(
            left: 24,
            right: 24,
            top: 20,
            bottom: MediaQuery.of(sheetCtx).viewInsets.bottom + 24,
          ),
          child: SingleChildScrollView(
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
                          Row(
                            children: [
                              Text(
                                m.chapterName ?? 'Unassigned Chapter',
                                style: TextStyle(fontSize: 13, color: isDark ? AppColors.mutedDark : AppColors.mutedLight),
                              ),
                              if (m.age != null) ...[
                                Text(' • Age ${m.age}', style: TextStyle(fontSize: 13, color: isDark ? AppColors.mutedDark : AppColors.mutedLight)),
                              ],
                            ],
                          ),
                        ],
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: m.isActive ? AppColors.successBg : AppColors.dangerBg,
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        m.status,
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w700,
                          color: m.isActive ? AppColors.success : AppColors.danger,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 18),
                Divider(color: isDark ? AppColors.borderDark : AppColors.borderLight),
                const SizedBox(height: 10),

                // Personal & Pastoral Information
                _DetailRow(icon: Icons.badge_outlined, label: 'Ministry Category', value: m.ministryCategory),
                _DetailRow(icon: Icons.cake_outlined, label: 'Birthdate', value: m.birthDate ?? 'Not specified'),
                _DetailRow(icon: Icons.email_outlined, label: 'Email Address', value: m.email ?? 'No email provided'),
                _DetailRow(icon: Icons.phone_outlined, label: 'Contact Phone', value: m.phone ?? 'No phone provided'),
                _DetailRow(icon: Icons.school_outlined, label: 'Campus / School', value: m.school ?? 'Not recorded'),
                if (m.gradeLevel != null) _DetailRow(icon: Icons.grade_outlined, label: 'Grade / Year', value: m.gradeLevel!),

                // Emergency Contact with Call / WhatsApp Trigger
                if (m.emergencyContactName != null || m.emergencyContactPhone != null) ...[
                  const SizedBox(height: 12),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: isDark ? AppColors.surfaceDarkSecondary : AppColors.surfaceLightSecondary,
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: isDark ? AppColors.borderDark : AppColors.borderLight),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Emergency Pastoral Contact',
                          style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.blue),
                        ),
                        const SizedBox(height: 6),
                        Row(
                          children: [
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    m.emergencyContactName ?? 'Guardian',
                                    style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
                                  ),
                                  Text(
                                    m.emergencyContactPhone ?? 'No phone',
                                    style: TextStyle(fontSize: 12, color: isDark ? AppColors.mutedDark : AppColors.mutedLight),
                                  ),
                                ],
                              ),
                            ),
                            if (m.emergencyContactPhone != null && m.emergencyContactPhone!.isNotEmpty) ...[
                              IconButton(
                                icon: const Icon(Icons.call, color: AppColors.success, size: 20),
                                tooltip: 'Call Emergency Contact',
                                onPressed: () {
                                  Clipboard.setData(ClipboardData(text: m.emergencyContactPhone!));
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    SnackBar(content: Text('Copied phone number ${m.emergencyContactPhone} to clipboard.')),
                                  );
                                },
                              ),
                              IconButton(
                                icon: const Icon(Icons.chat, color: AppColors.cyan, size: 20),
                                tooltip: 'WhatsApp Message',
                                onPressed: () {
                                  Clipboard.setData(ClipboardData(text: m.emergencyContactPhone!));
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    SnackBar(content: Text('Ready for WhatsApp: phone number ${m.emergencyContactPhone} copied.')),
                                  );
                                },
                              ),
                            ],
                          ],
                        ),
                      ],
                    ),
                  ),
                ],

                const SizedBox(height: 20),
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton.icon(
                        icon: const Icon(Icons.edit_outlined, size: 16),
                        label: const Text('Edit Details'),
                        onPressed: () {
                          Navigator.of(sheetCtx).pop();
                          _showAddEditMemberDialog(m);
                        },
                      ),
                    ),
                    const SizedBox(width: 12),
                    IconButton(
                      icon: const Icon(Icons.delete_outline, color: AppColors.danger),
                      tooltip: 'Remove Member',
                      onPressed: () async {
                        final auth = context.read<AuthProvider>();
                        final prov = context.read<MembersProvider>();
                        final confirm = await showDialog<bool>(
                          context: context,
                          builder: (c) => AlertDialog(
                            title: const Text('Remove Member'),
                            content: Text('Are you sure you want to remove ${m.fullName}?'),
                            actions: [
                              TextButton(onPressed: () => Navigator.pop(c, false), child: const Text('Cancel')),
                              TextButton(
                                onPressed: () => Navigator.pop(c, true),
                                style: TextButton.styleFrom(foregroundColor: AppColors.danger),
                                child: const Text('Remove'),
                              ),
                            ],
                          ),
                        );
                        if (confirm == true && mounted) {
                          if (sheetCtx.mounted) {
                            Navigator.of(sheetCtx).pop();
                          }
                          await prov.deleteMember(
                            m.id,
                            token: auth.session?.accessToken,
                            areaId: auth.areaId,
                          );
                        }
                      },
                    ),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  void _showCsvExportDialog() {
    final csvContent = context.read<MembersProvider>().generateCsv();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Export Members CSV', style: TextStyle(fontWeight: FontWeight.w800)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'The currently filtered member list has been prepared as standard CSV data for spreadsheets.',
              style: TextStyle(fontSize: 13),
            ),
            const SizedBox(height: 14),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.grey.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                '${csvContent.split('\n').take(4).join('\n')}\n...',
                style: const TextStyle(fontFamily: 'monospace', fontSize: 11),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Close')),
          ElevatedButton.icon(
            icon: const Icon(Icons.copy, size: 16),
            label: const Text('Copy to Clipboard'),
            onPressed: () {
              Clipboard.setData(ClipboardData(text: csvContent));
              Navigator.pop(ctx);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('CSV data successfully copied to clipboard.'),
                  backgroundColor: AppColors.success,
                ),
              );
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.blue,
              foregroundColor: Colors.white,
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final membersProv = context.watch<MembersProvider>();
    final auth = context.watch<AuthProvider>();
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: Colors.transparent,
      floatingActionButton: FloatingActionButton(
        onPressed: () => _showAddEditMemberDialog(),
        backgroundColor: AppColors.blue,
        foregroundColor: Colors.white,
        tooltip: 'Add Youth Member',
        child: const Icon(Icons.person_add),
      ),
      body: Column(
        children: [
          // Filter and Action Controls
          Container(
            padding: const EdgeInsets.all(16),
            color: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: _searchController,
                        onChanged: (v) => membersProv.setSearchQuery(v),
                        decoration: InputDecoration(
                          hintText: 'Search by name, email, phone, campus...',
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
                      ),
                    ),
                    const SizedBox(width: 8),
                    IconButton.filledTonal(
                      icon: const Icon(Icons.file_download_outlined),
                      tooltip: 'Export CSV',
                      onPressed: _showCsvExportDialog,
                    ),
                    const SizedBox(width: 4),
                    IconButton.filledTonal(
                      icon: const Icon(Icons.refresh),
                      tooltip: 'Reload',
                      onPressed: () => membersProv.loadMembers(
                        token: auth.session?.accessToken,
                        areaId: auth.areaId,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),

                // Status Filter Chips
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: [
                      _FilterChip(
                        label: 'All Status',
                        selected: membersProv.selectedStatus == 'All',
                        onSelected: () => membersProv.setStatusFilter('All'),
                      ),
                      const SizedBox(width: 8),
                      _FilterChip(
                        label: 'Active Only',
                        selected: membersProv.selectedStatus == 'Active',
                        onSelected: () => membersProv.setStatusFilter('Active'),
                      ),
                      const SizedBox(width: 8),
                      _FilterChip(
                        label: 'Inactive',
                        selected: membersProv.selectedStatus == 'Inactive',
                        onSelected: () => membersProv.setStatusFilter('Inactive'),
                      ),
                      const SizedBox(width: 16),
                      // Category Filter Chips
                      _FilterChip(
                        label: 'All Ministries',
                        selected: membersProv.selectedCategory == 'All',
                        onSelected: () => membersProv.setCategoryFilter('All'),
                      ),
                      const SizedBox(width: 8),
                      _FilterChip(
                        label: 'Kids (4-12)',
                        selected: membersProv.selectedCategory == 'Kids',
                        onSelected: () => membersProv.setCategoryFilter('Kids'),
                      ),
                      const SizedBox(width: 8),
                      _FilterChip(
                        label: 'Youth (13-21)',
                        selected: membersProv.selectedCategory == 'Youth',
                        onSelected: () => membersProv.setCategoryFilter('Youth'),
                      ),
                      const SizedBox(width: 8),
                      _FilterChip(
                        label: 'Servants',
                        selected: membersProv.selectedCategory == 'Servant',
                        onSelected: () => membersProv.setCategoryFilter('Servant'),
                      ),
                    ],
                  ),
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
                                            '${m.chapterName ?? "Chapter Unassigned"} • ${m.ministryCategory}${m.age != null ? " • Age ${m.age}" : ""}',
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
