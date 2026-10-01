import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../constants/app_colors.dart';
import '../../models/report.dart';
import '../../providers/auth_provider.dart';
import '../../services/api_service.dart';
import '../../widgets/wireframe_skeleton.dart';

class ReportsView extends StatefulWidget {
  const ReportsView({super.key});

  @override
  State<ReportsView> createState() => _ReportsViewState();
}

class _ReportsViewState extends State<ReportsView> {
  bool _loading = true;
  List<ActivityReport> _reports = [];

  @override
  void initState() {
    super.initState();
    _loadReports();
  }

  Future<void> _loadReports() async {
    setState(() => _loading = true);
    final auth = context.read<AuthProvider>();
    final api = context.read<ApiService>();

    try {
      final res = await api.request('/reports', token: auth.session?.accessToken, areaId: auth.areaId);
      if (res['ok'] == true && res['reports'] is List) {
        setState(() {
          _reports = (res['reports'] as List).map((r) => ActivityReport.fromJson(r)).toList();
          _loading = false;
        });
        return;
      }
    } catch (_) {}

    // Supabase REST fallback
    final supData = await api.supabaseRest('reports', token: auth.session?.accessToken);
    if (supData is List) {
      setState(() {
        _reports = supData.map((r) => ActivityReport.fromJson(r)).toList();
        _loading = false;
      });
      return;
    }

    setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    if (_loading) {
      return const TableSkeletonWidget(itemCount: 4);
    }

    return Scaffold(
      backgroundColor: Colors.transparent,
      body: RefreshIndicator(
        onRefresh: _loadReports,
        color: AppColors.blue,
        child: _reports.isEmpty
            ? Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.assessment_outlined, size: 56, color: isDark ? AppColors.mutedDark : AppColors.mutedLight),
                    const SizedBox(height: 12),
                    Text(
                      'No activity reports logged yet.',
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
                itemCount: _reports.length,
                separatorBuilder: (_, __) => const SizedBox(height: 12),
                itemBuilder: (context, index) {
                  final rep = _reports[index];
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
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Expanded(
                              child: Text(
                                rep.title,
                                style: TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w800,
                                  color: isDark ? AppColors.textLight : AppColors.textDark,
                                ),
                              ),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                              decoration: BoxDecoration(
                                color: AppColors.blue.withValues(alpha: 0.12),
                                borderRadius: BorderRadius.circular(999),
                              ),
                              child: Text(
                                rep.activityType ?? 'Activity',
                                style: const TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w700,
                                  color: AppColors.blue,
                                ),
                              ),
                            ),
                          ],
                        ),
                        if (rep.notes != null && rep.notes!.isNotEmpty) ...[
                          const SizedBox(height: 6),
                          Text(
                            rep.notes!,
                            style: TextStyle(fontSize: 13, color: isDark ? AppColors.mutedDark : AppColors.mutedLight),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                        const SizedBox(height: 12),
                        Row(
                          children: [
                            const Icon(Icons.calendar_today, size: 14, color: AppColors.blue),
                            const SizedBox(width: 6),
                            Text(
                              rep.date ?? 'Date unrecorded',
                              style: TextStyle(fontSize: 12, color: isDark ? AppColors.textLight : AppColors.textDark),
                            ),
                            const Spacer(),
                            const Icon(Icons.people_outline, size: 14, color: AppColors.cyan),
                            const SizedBox(width: 4),
                            Text(
                              '${rep.attendeesCount} attended',
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w700,
                                color: isDark ? AppColors.textLight : AppColors.textDark,
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
