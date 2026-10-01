import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../constants/app_colors.dart';
import '../../models/chapter.dart';
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

    // Supabase REST fallback
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
                onPressed: saving ? null : () => Navigator.pop(ctx),
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
                    ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : const Text('Save Chapter'),
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
                              width: 42,
                              height: 42,
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
                      ],
                    ),
                  );
                },
              ),
      ),
    );
  }
}
