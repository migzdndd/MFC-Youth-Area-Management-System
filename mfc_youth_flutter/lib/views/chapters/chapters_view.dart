import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../constants/app_colors.dart';
import '../../models/chapter.dart';
import '../../models/member.dart';
import '../../providers/auth_provider.dart';
import '../../services/api_service.dart';
import '../../widgets/wireframe_skeleton.dart';

class ChaptersView extends StatefulWidget {
  const ChaptersView({super.key});

  @override
  State<ChaptersView> createState() => _ChaptersViewState();
}

class _ChaptersViewState extends State<ChaptersView> {
  bool _loading = true;
  List<Chapter> _chapters = [];

  @override
  void initState() {
    super.initState();
    _loadChapters();
  }

  Future<void> _loadChapters() async {
    setState(() => _loading = true);
    final auth = context.read<AuthProvider>();
    final api = context.read<ApiService>();

    try {
      final res = await api.request('/chapters', token: auth.session?.accessToken, areaId: auth.areaId);
      if (res['ok'] == true && res['chapters'] is List) {
        setState(() {
          _chapters = (res['chapters'] as List).map((c) => Chapter.fromJson(c)).toList();
          _loading = false;
        });
        return;
      }
    } catch (_) {}

    final supData = await api.supabaseRest('chapters', token: auth.session?.accessToken);
    if (supData is List) {
      setState(() {
        _chapters = supData.map((c) => Chapter.fromJson(c)).toList();
        _loading = false;
      });
      return;
    }

    setState(() => _loading = false);
  }

  void _showAddChapterDialog() {
    final nameCtrl = TextEditingController();
    final servantCtrl = TextEditingController();

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
              'Add New Chapter',
              style: TextStyle(
                fontWeight: FontWeight.w800,
                color: isDark ? AppColors.textLight : AppColors.textDark,
              ),
            ),
            content: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  TextField(
                    controller: nameCtrl,
                    decoration: InputDecoration(
                      labelText: 'Chapter Name',
                      hintText: 'e.g. Chapter 1, North Sector',
                      prefixIcon: const Icon(Icons.apartment),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: servantCtrl,
                    decoration: InputDecoration(
                      labelText: 'Chapter Servant',
                      hintText: 'Servant Leader Name',
                      prefixIcon: const Icon(Icons.person_outline),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                  ),
                ],
              ),
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(ctx),
                child: const Text('Cancel'),
              ),
              FilledButton(
                onPressed: saving
                    ? null
                    : () async {
                        final name = nameCtrl.text.trim();
                        if (name.isEmpty) return;
                        setDlgState(() => saving = true);
                        final auth = context.read<AuthProvider>();
                        final api = context.read<ApiService>();
                        try {
                          await api.request(
                            '/chapters',
                            method: 'POST',
                            token: auth.session?.accessToken,
                            areaId: auth.areaId,
                            body: {
                              'name': name,
                              'servant_name': servantCtrl.text.trim(),
                              'area_id': auth.areaId,
                            },
                          );
                        } catch (_) {}
                        if (context.mounted) {
                          Navigator.pop(ctx);
                          _loadChapters();
                        }
                      },
                style: FilledButton.styleFrom(
                  backgroundColor: AppColors.blue,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                ),
                child: saving
                    ? const SizedBox(
                        width: 16,
                        height: 16,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                      )
                    : const Text('Save Chapter'),
              ),
            ],
          );
        },
      ),
    );
  }

  void _showAssignMembersDialog(Chapter chapter) async {
    final auth = context.read<AuthProvider>();
    final api = context.read<ApiService>();

    List<Member> unassigned = [];
    bool fetching = true;

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setDlgState) {
          final isDark = Theme.of(context).brightness == Brightness.dark;
          final selectedIds = <dynamic>{};

          if (fetching) {
            api.request('/chapters/assign-members?chapterId=${chapter.id}', token: auth.session?.accessToken, areaId: auth.areaId).then((res) {
              if (res['ok'] == true && res['members'] is List) {
                setDlgState(() {
                  unassigned = (res['members'] as List).map((m) => Member.fromJson(m)).toList();
                  fetching = false;
                });
              } else {
                setDlgState(() => fetching = false);
              }
            }).catchError((_) {
              setDlgState(() => fetching = false);
            });
          }

          return AlertDialog(
            backgroundColor: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            title: Text(
              'Assign Members to ${chapter.name}',
              style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16),
            ),
            content: SizedBox(
              width: 440,
              height: 380,
              child: fetching
                  ? const Center(child: CircularProgressIndicator())
                  : unassigned.isEmpty
                      ? const Center(child: Text('No unassigned members currently available in this Area.'))
                      : ListView.builder(
                          itemCount: unassigned.length,
                          itemBuilder: (context, idx) {
                            final m = unassigned[idx];
                            final checked = selectedIds.contains(m.id);
                            return CheckboxListTile(
                              title: Text(m.fullName, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                              subtitle: Text(m.email ?? m.phone ?? 'No contact info', style: const TextStyle(fontSize: 12)),
                              value: checked,
                              activeColor: AppColors.blue,
                              onChanged: (val) {
                                setDlgState(() {
                                  if (val == true) {
                                    selectedIds.add(m.id);
                                  } else {
                                    selectedIds.remove(m.id);
                                  }
                                });
                              },
                            );
                          },
                        ),
            ),
            actions: [
              TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
              ElevatedButton(
                onPressed: selectedIds.isEmpty
                    ? null
                    : () async {
                        try {
                          await api.request(
                            '/chapters/assign-members',
                            method: 'POST',
                            body: {
                              'chapterId': chapter.id,
                              'memberIds': selectedIds.toList(),
                            },
                            token: auth.session?.accessToken,
                            areaId: auth.areaId,
                          );
                        } catch (_) {}
                        if (ctx.mounted) Navigator.pop(ctx);
                        _loadChapters();
                      },
                style: ElevatedButton.styleFrom(backgroundColor: AppColors.blue, foregroundColor: Colors.white),
                child: Text('Assign (${selectedIds.length})'),
              ),
            ],
          );
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final isLeader = context.watch<AuthProvider>().isLeadership;

    if (_loading) {
      return const TableSkeletonWidget(itemCount: 4);
    }

    return Scaffold(
      backgroundColor: Colors.transparent,
      floatingActionButton: isLeader
          ? FloatingActionButton.extended(
              onPressed: _showAddChapterDialog,
              backgroundColor: AppColors.blue,
              foregroundColor: Colors.white,
              icon: const Icon(Icons.add),
              label: const Text('New Chapter', style: TextStyle(fontWeight: FontWeight.w700)),
            )
          : null,
      body: RefreshIndicator(
        onRefresh: _loadChapters,
        color: AppColors.blue,
        child: _chapters.isEmpty
            ? Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.apartment_outlined, size: 56, color: isDark ? AppColors.mutedDark : AppColors.mutedLight),
                    const SizedBox(height: 12),
                    Text(
                      'No chapters established in this area.',
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w600,
                        color: isDark ? AppColors.mutedDark : AppColors.mutedLight,
                      ),
                    ),
                  ],
                ),
              )
            : ListView.separated(
                padding: const EdgeInsets.all(16),
                itemCount: _chapters.length,
                separatorBuilder: (_, __) => const SizedBox(height: 12),
                itemBuilder: (context, index) {
                  final ch = _chapters[index];
                  return Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: isDark ? AppColors.borderDark : AppColors.borderLight),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.03),
                          blurRadius: 6,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Container(
                              width: 44,
                              height: 44,
                              decoration: BoxDecoration(
                                color: AppColors.blue.withValues(alpha: 0.12),
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: const Icon(Icons.apartment, color: AppColors.blue, size: 22),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    ch.name,
                                    style: TextStyle(
                                      fontSize: 16,
                                      fontWeight: FontWeight.w800,
                                      color: isDark ? AppColors.textLight : AppColors.textDark,
                                    ),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    ch.servantName != null && ch.servantName!.isNotEmpty
                                        ? 'Servant: ${ch.servantName}'
                                        : 'Servant: Not assigned',
                                    style: TextStyle(
                                      fontSize: 13,
                                      color: isDark ? AppColors.mutedDark : AppColors.mutedLight,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                              decoration: BoxDecoration(
                                color: AppColors.cyan.withValues(alpha: 0.15),
                                borderRadius: BorderRadius.circular(999),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  const Icon(Icons.people_outline, size: 14, color: AppColors.blue),
                                  const SizedBox(width: 4),
                                  Text(
                                    '${ch.memberCount} members',
                                    style: const TextStyle(
                                      fontSize: 12,
                                      fontWeight: FontWeight.w700,
                                      color: AppColors.blue,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                        if (isLeader) ...[
                          const SizedBox(height: 12),
                          const Divider(height: 1),
                          const SizedBox(height: 8),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.end,
                            children: [
                              TextButton.icon(
                                icon: const Icon(Icons.group_add_outlined, size: 16),
                                label: const Text('Assign Unassigned Youth'),
                                onPressed: () => _showAssignMembersDialog(ch),
                              ),
                            ],
                          ),
                        ],
                      ],
                    ),
                  );
                },
              ),
      ),
    );
  }
}
