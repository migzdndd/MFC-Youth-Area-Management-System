import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../constants/app_colors.dart';
import '../../models/event.dart';
import '../../providers/auth_provider.dart';
import '../../services/api_service.dart';
import '../../widgets/wireframe_skeleton.dart';

class EventsView extends StatefulWidget {
  const EventsView({super.key});

  @override
  State<EventsView> createState() => _EventsViewState();
}

class _EventsViewState extends State<EventsView> {
  bool _loading = true;
  List<Event> _events = [];

  @override
  void initState() {
    super.initState();
    _loadEvents();
  }

  Future<void> _loadEvents() async {
    setState(() => _loading = true);
    final auth = context.read<AuthProvider>();
    final api = context.read<ApiService>();

    try {
      final res = await api.request('/events', token: auth.session?.accessToken, areaId: auth.areaId);
      if (res['ok'] == true && res['events'] is List) {
        setState(() {
          _events = (res['events'] as List).map((e) => Event.fromJson(e)).toList();
          _loading = false;
        });
        return;
      }
    } catch (_) {}

    // Supabase REST fallback
    final supData = await api.supabaseRest('events', token: auth.session?.accessToken);
    if (supData is List) {
      setState(() {
        _events = supData.map((e) => Event.fromJson(e)).toList();
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
      return const TableSkeletonWidget(itemCount: 5);
    }

    return Scaffold(
      backgroundColor: Colors.transparent,
      body: RefreshIndicator(
        onRefresh: _loadEvents,
        color: AppColors.blue,
        child: _events.isEmpty
            ? Center(
                child: Text(
                  'No area events scheduled yet.',
                  style: TextStyle(color: isDark ? AppColors.mutedDark : AppColors.mutedLight),
                ),
              )
            : ListView.separated(
                padding: const EdgeInsets.all(16),
                itemCount: _events.length,
                separatorBuilder: (_, __) => const SizedBox(height: 12),
                itemBuilder: (context, index) {
                  final ev = _events[index];
                  return Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: isDark ? AppColors.borderDark : AppColors.borderLight),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Expanded(
                              child: Text(
                                ev.title,
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
                                color: AppColors.success.withValues(alpha: 0.12),
                                borderRadius: BorderRadius.circular(999),
                              ),
                              child: Text(
                                ev.fee > 0 ? '₱${ev.fee.toStringAsFixed(0)}' : 'Free Entry',
                                style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.success),
                              ),
                            ),
                          ],
                        ),
                        if (ev.description != null && ev.description!.isNotEmpty) ...[
                          const SizedBox(height: 6),
                          Text(
                            ev.description!,
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
                              ev.date ?? 'Date TBA',
                              style: TextStyle(fontSize: 12, color: isDark ? AppColors.textLight : AppColors.textDark),
                            ),
                            const SizedBox(width: 16),
                            const Icon(Icons.place, size: 14, color: AppColors.cyan),
                            const SizedBox(width: 6),
                            Expanded(
                              child: Text(
                                ev.venue ?? 'Venue TBA',
                                style: TextStyle(fontSize: 12, color: isDark ? AppColors.textLight : AppColors.textDark),
                                overflow: TextOverflow.ellipsis,
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
