import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../../constants/app_colors.dart';
import '../../models/report.dart';
import '../../providers/auth_provider.dart';
import '../../services/api_service.dart';
import '../../services/sync_service.dart';
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

  void _showSubmitReportDialog() {
    final titleCtrl = TextEditingController();
    final locationCtrl = TextEditingController();
    final headcountCtrl = TextEditingController(text: '10');
    final notesCtrl = TextEditingController();
    final dateCtrl = TextEditingController(text: DateTime.now().toIso8601String().split('T').first);
    String reportType = 'Household';

    showDialog(
      context: context,
      builder: (ctx) {
        final isDark = Theme.of(context).brightness == Brightness.dark;
        bool saving = false;

        return StatefulBuilder(
          builder: (context, setDlgState) {
            return AlertDialog(
              backgroundColor: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              title: const Text('Submit Activity Report', style: TextStyle(fontWeight: FontWeight.w800)),
              content: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    DropdownButtonFormField<String>(
                      initialValue: reportType,
                      decoration: InputDecoration(
                        labelText: 'Activity Type',
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                      items: const [
                        DropdownMenuItem(value: 'Household', child: Text('Household Meeting')),
                        DropdownMenuItem(value: 'Youth Camp', child: Text('Youth Camp / Retreat')),
                        DropdownMenuItem(value: 'Fellowship', child: Text('General Fellowship')),
                        DropdownMenuItem(value: 'Chapter Assembly', child: Text('Chapter Assembly')),
                        DropdownMenuItem(value: 'Service Meeting', child: Text('Service Ministry Meeting')),
                      ],
                      onChanged: (v) => setDlgState(() => reportType = v ?? 'Household'),
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: titleCtrl,
                      decoration: InputDecoration(
                        labelText: 'Report Title',
                        hintText: 'e.g. Chapter 2 Monthly Assembly',
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: locationCtrl,
                      decoration: InputDecoration(
                        labelText: 'Location / Venue',
                        prefixIcon: const Icon(Icons.location_on_outlined, size: 20),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          child: TextField(
                            controller: dateCtrl,
                            decoration: InputDecoration(
                              labelText: 'Activity Date',
                              prefixIcon: const Icon(Icons.calendar_today, size: 18),
                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                            ),
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: TextField(
                            controller: headcountCtrl,
                            keyboardType: TextInputType.number,
                            decoration: InputDecoration(
                              labelText: 'Headcount',
                              prefixIcon: const Icon(Icons.people_outline, size: 18),
                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: notesCtrl,
                      maxLines: 3,
                      decoration: InputDecoration(
                        labelText: 'Pastoral Notes / Highlights',
                        hintText: 'Key discussions, prayer intentions, or challenges',
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                    ),
                  ],
                ),
              ),
              actions: [
                TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
                ElevatedButton(
                  onPressed: saving
                      ? null
                      : () async {
                          if (titleCtrl.text.trim().isEmpty) return;
                          setDlgState(() => saving = true);
                          final auth = context.read<AuthProvider>();
                          final sync = context.read<SyncService>();

                          final payload = {
                            'title': titleCtrl.text.trim(),
                            'reportType': reportType,
                            'location': locationCtrl.text.trim(),
                            'activityDate': dateCtrl.text.trim(),
                            'participantCount': int.tryParse(headcountCtrl.text.trim()) ?? 0,
                            'notes': notesCtrl.text.trim(),
                            'areaId': auth.areaId,
                          };

                          await sync.queueMutation(
                            action: 'create_report',
                            payload: payload,
                            token: auth.session?.accessToken,
                            areaId: auth.areaId,
                          );

                          if (ctx.mounted) Navigator.pop(ctx);
                          _loadReports();
                        },
                  style: ElevatedButton.styleFrom(backgroundColor: AppColors.blue, foregroundColor: Colors.white),
                  child: const Text('Submit Report'),
                ),
              ],
            );
          },
        );
      },
    );
  }

  void _exportReports() {
    final buffer = StringBuffer();
    buffer.writeln('ID,Title,Type,Date,Location,Headcount,Notes');
    for (final r in _reports) {
      buffer.writeln('"${r.id}","${r.title}","${r.reportType}","${r.activityDate}","${r.location ?? ''}","${r.participantCount}","${(r.notes ?? '').replaceAll('"', '""')}"');
    }
    Clipboard.setData(ClipboardData(text: buffer.toString()));
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Activity reports copied as CSV data to clipboard.')),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    if (_loading) {
      return const TableSkeletonWidget(itemCount: 4);
    }

    return Scaffold(
      backgroundColor: Colors.transparent,
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _showSubmitReportDialog,
        backgroundColor: AppColors.blue,
        foregroundColor: Colors.white,
        icon: const Icon(Icons.add),
        label: const Text('Submit Report', style: TextStyle(fontWeight: FontWeight.w700)),
      ),
      body: RefreshIndicator(
        onRefresh: _loadReports,
        color: AppColors.blue,
        child: Column(
          children: [
            // Top action bar
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Historical Reports (${_reports.length})',
                    style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 14),
                  ),
                  TextButton.icon(
                    icon: const Icon(Icons.file_download_outlined, size: 16),
                    label: const Text('Export CSV'),
                    onPressed: _exportReports,
                  ),
                ],
              ),
            ),
            Expanded(
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
                          const SizedBox(height: 4),
                          Text(
                            'Click Submit Report to file a pastoral activity.',
                            style: TextStyle(fontSize: 12, color: isDark ? AppColors.mutedDark : AppColors.mutedLight),
                          ),
                        ],
                      ),
                    )
                  : ListView.separated(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
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
                                children: [
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                    decoration: BoxDecoration(
                                      color: AppColors.blue.withValues(alpha: 0.12),
                                      borderRadius: BorderRadius.circular(6),
                                    ),
                                    child: Text(
                                      rep.reportType.toUpperCase(),
                                      style: const TextStyle(
                                        fontSize: 10,
                                        fontWeight: FontWeight.w800,
                                        color: AppColors.blue,
                                        letterSpacing: 0.5,
                                      ),
                                    ),
                                  ),
                                  const Spacer(),
                                  if (rep.activityDate != null)
                                    Text(
                                      rep.activityDate!,
                                      style: TextStyle(
                                        fontSize: 12,
                                        color: isDark ? AppColors.mutedDark : AppColors.mutedLight,
                                        fontWeight: FontWeight.w500,
                                      ),
                                    ),
                                ],
                              ),
                              const SizedBox(height: 8),
                              Text(
                                rep.title,
                                style: TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w800,
                                  color: isDark ? AppColors.textLight : AppColors.textDark,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Row(
                                children: [
                                  const Icon(Icons.location_on_outlined, size: 14, color: AppColors.mutedLight),
                                  const SizedBox(width: 4),
                                  Expanded(
                                    child: Text(
                                      rep.location ?? 'Parish Venue',
                                      style: TextStyle(
                                        fontSize: 12,
                                        color: isDark ? AppColors.mutedDark : AppColors.mutedLight,
                                      ),
                                    ),
                                  ),
                                  const Icon(Icons.people_outline, size: 14, color: AppColors.blue),
                                  const SizedBox(width: 4),
                                  Text(
                                    '${rep.participantCount} youth',
                                    style: const TextStyle(
                                      fontSize: 12,
                                      fontWeight: FontWeight.w700,
                                      color: AppColors.blue,
                                    ),
                                  ),
                                ],
                              ),
                              if (rep.notes != null && rep.notes!.isNotEmpty) ...[
                                const SizedBox(height: 8),
                                Container(
                                  width: double.infinity,
                                  padding: const EdgeInsets.all(10),
                                  decoration: BoxDecoration(
                                    color: isDark ? AppColors.surfaceDarkSecondary : AppColors.surfaceLightSecondary,
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: Text(
                                    rep.notes!,
                                    style: TextStyle(
                                      fontSize: 12,
                                      color: isDark ? AppColors.mutedDark : AppColors.mutedLight,
                                      height: 1.4,
                                    ),
                                  ),
                                ),
                              ],
                            ],
                          ),
                        );
                      },
                    ),
            ),
          ],
        ),
      ),
    );
  }
}
