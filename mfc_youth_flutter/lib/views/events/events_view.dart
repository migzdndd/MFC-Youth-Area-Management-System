import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../constants/app_colors.dart';
import '../../models/event.dart';
import '../../models/participant.dart';
import '../../providers/auth_provider.dart';
import '../../services/api_service.dart';
import '../../services/sync_service.dart';
import '../../widgets/wireframe_skeleton.dart';
import 'fast_check_in_dialog.dart';

class EventsView extends StatefulWidget {
  const EventsView({super.key});

  @override
  State<EventsView> createState() => _EventsViewState();
}

class _EventsViewState extends State<EventsView> {
  bool _loading = true;
  List<Event> _events = [];
  Event? _selectedEvent;
  List<EventParticipant> _participants = [];
  bool _loadingParticipants = false;

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
        final list = (res['events'] as List).map((e) => Event.fromJson(e)).toList();
        setState(() {
          _events = list;
          if (_selectedEvent == null && list.isNotEmpty) {
            _selectedEvent = list.first;
            _loadParticipants(list.first.id);
          }
          _loading = false;
        });
        return;
      }
    } catch (_) {}

    final supData = await api.supabaseRest('events', token: auth.session?.accessToken);
    if (supData is List) {
      final list = supData.map((e) => Event.fromJson(e)).toList();
      setState(() {
        _events = list;
        if (_selectedEvent == null && list.isNotEmpty) {
          _selectedEvent = list.first;
          _loadParticipants(list.first.id);
        }
        _loading = false;
      });
      return;
    }

    setState(() => _loading = false);
  }

  Future<void> _loadParticipants(dynamic eventId) async {
    setState(() => _loadingParticipants = true);
    final auth = context.read<AuthProvider>();
    final api = context.read<ApiService>();

    try {
      final res = await api.request(
        '/participants?eventId=$eventId',
        token: auth.session?.accessToken,
        areaId: auth.areaId,
      );
      if (res['ok'] == true && res['participants'] is List) {
        setState(() {
          _participants = (res['participants'] as List).map((p) => EventParticipant.fromJson(p)).toList();
          _loadingParticipants = false;
        });
        return;
      }
    } catch (_) {}

    setState(() => _loadingParticipants = false);
  }

  void _showCreateEventDialog() {
    final titleCtrl = TextEditingController();
    final descCtrl = TextEditingController();
    final venueCtrl = TextEditingController();
    final feeCtrl = TextEditingController(text: '0');
    final dateCtrl = TextEditingController(text: DateTime.now().toIso8601String().split('T').first);

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
              title: Text(
                'Create Area Event',
                style: TextStyle(fontWeight: FontWeight.w800, color: isDark ? AppColors.textLight : AppColors.navy),
              ),
              content: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    TextField(
                      controller: titleCtrl,
                      decoration: InputDecoration(
                        labelText: 'Event Name',
                        hintText: 'e.g. Youth Camp 2026',
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: descCtrl,
                      maxLines: 2,
                      decoration: InputDecoration(
                        labelText: 'Description',
                        hintText: 'Theme, scripture or purpose',
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: venueCtrl,
                      decoration: InputDecoration(
                        labelText: 'Venue / Parish Location',
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
                              labelText: 'Date (YYYY-MM-DD)',
                              prefixIcon: const Icon(Icons.calendar_today, size: 18),
                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                            ),
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: TextField(
                            controller: feeCtrl,
                            keyboardType: TextInputType.number,
                            decoration: InputDecoration(
                              labelText: 'Fee (PHP)',
                              prefixIcon: const Icon(Icons.payments_outlined, size: 18),
                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                            ),
                          ),
                        ),
                      ],
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
                          final api = context.read<ApiService>();

                          try {
                            await api.request(
                              '/events',
                              method: 'POST',
                              body: {
                                'name': titleCtrl.text.trim(),
                                'description': descCtrl.text.trim(),
                                'venue': venueCtrl.text.trim(),
                                'startsAt': dateCtrl.text.trim(),
                                'fee': double.tryParse(feeCtrl.text.trim()) ?? 0.0,
                              },
                              token: auth.session?.accessToken,
                              areaId: auth.areaId,
                            );
                            if (ctx.mounted) Navigator.pop(ctx);
                            _loadEvents();
                          } catch (_) {
                            setDlgState(() => saving = false);
                          }
                        },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.blue,
                    foregroundColor: Colors.white,
                  ),
                  child: const Text('Create Event'),
                ),
              ],
            );
          },
        );
      },
    );
  }

  void _showAddParticipantDialog() {
    if (_selectedEvent == null) return;
    final memberIdCtrl = TextEditingController();
    String paymentStatus = 'Unpaid';
    String mode = 'Cash';

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
              title: const Text('Register Participant', style: TextStyle(fontWeight: FontWeight.w800)),
              content: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  TextField(
                    controller: memberIdCtrl,
                    decoration: InputDecoration(
                      labelText: 'Member ID or UUID',
                      hintText: 'Paste youth member ID',
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                  ),
                  const SizedBox(height: 12),
                  DropdownButtonFormField<String>(
                    initialValue: paymentStatus,
                    decoration: InputDecoration(
                      labelText: 'Payment Status',
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                    items: const [
                      DropdownMenuItem(value: 'Paid', child: Text('Paid')),
                      DropdownMenuItem(value: 'Unpaid', child: Text('Unpaid')),
                      DropdownMenuItem(value: 'Waived', child: Text('Waived (Scholarship)')),
                    ],
                    onChanged: (v) => setDlgState(() => paymentStatus = v ?? 'Unpaid'),
                  ),
                  const SizedBox(height: 12),
                  DropdownButtonFormField<String>(
                    initialValue: mode,
                    decoration: InputDecoration(
                      labelText: 'Payment Mode',
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                    items: const [
                      DropdownMenuItem(value: 'Cash', child: Text('Cash')),
                      DropdownMenuItem(value: 'GCash', child: Text('GCash')),
                      DropdownMenuItem(value: 'Bank Transfer', child: Text('Bank Transfer')),
                    ],
                    onChanged: (v) => setDlgState(() => mode = v ?? 'Cash'),
                  ),
                ],
              ),
              actions: [
                TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
                ElevatedButton(
                  onPressed: saving
                      ? null
                      : () async {
                          if (memberIdCtrl.text.trim().isEmpty) return;
                          setDlgState(() => saving = true);
                          final auth = context.read<AuthProvider>();
                          final api = context.read<ApiService>();

                          try {
                            await api.request(
                              '/participants',
                              method: 'POST',
                              body: {
                                'eventId': _selectedEvent!.id,
                                'memberId': memberIdCtrl.text.trim(),
                                'paymentStatus': paymentStatus,
                                'paymentMode': mode,
                              },
                              token: auth.session?.accessToken,
                              areaId: auth.areaId,
                            );
                            if (ctx.mounted) Navigator.pop(ctx);
                            _loadParticipants(_selectedEvent!.id);
                          } catch (_) {
                            setDlgState(() => saving = false);
                          }
                        },
                  style: ElevatedButton.styleFrom(backgroundColor: AppColors.blue, foregroundColor: Colors.white),
                  child: const Text('Register'),
                ),
              ],
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final isWide = MediaQuery.of(context).size.width >= 860;

    if (_loading) {
      return const TableSkeletonWidget(itemCount: 5);
    }

    return Scaffold(
      backgroundColor: Colors.transparent,
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _showCreateEventDialog,
        backgroundColor: AppColors.blue,
        foregroundColor: Colors.white,
        icon: const Icon(Icons.add),
        label: const Text('Create Event', style: TextStyle(fontWeight: FontWeight.w700)),
      ),
      body: isWide ? _buildDesktopSplitLayout(isDark) : _buildMobileEventList(isDark),
    );
  }

  Widget _buildDesktopSplitLayout(bool isDark) {
    return Row(
      children: [
        // Left Column: Event List
        SizedBox(
          width: 360,
          child: Column(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                color: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Area Events (${_events.length})', style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 15)),
                    IconButton(icon: const Icon(Icons.refresh, size: 20), onPressed: _loadEvents),
                  ],
                ),
              ),
              const Divider(height: 1),
              Expanded(
                child: _events.isEmpty
                    ? Center(child: Text('No events found', style: TextStyle(color: isDark ? AppColors.mutedDark : AppColors.mutedLight)))
                    : ListView.builder(
                        itemCount: _events.length,
                        itemBuilder: (context, idx) {
                          final ev = _events[idx];
                          final isSelected = _selectedEvent?.id == ev.id;
                          return ListTile(
                            selected: isSelected,
                            selectedTileColor: AppColors.blue.withValues(alpha: 0.1),
                            title: Text(ev.title, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14)),
                            subtitle: Text('${ev.venue ?? "Parish Venue"} • ${ev.date ?? "Upcoming"}', style: const TextStyle(fontSize: 12)),
                            trailing: ev.fee > 0 ? Text('₱${ev.fee.toStringAsFixed(0)}', style: const TextStyle(fontWeight: FontWeight.w700, color: AppColors.info)) : const Text('Free', style: TextStyle(color: AppColors.success, fontWeight: FontWeight.w700)),
                            onTap: () {
                              setState(() => _selectedEvent = ev);
                              _loadParticipants(ev.id);
                            },
                          );
                        },
                      ),
              ),
            ],
          ),
        ),
        VerticalDivider(width: 1, color: isDark ? AppColors.borderDark : AppColors.borderLight),

        // Right Column: Event Details & Fast QR Check-In
        Expanded(
          child: _selectedEvent == null
              ? const Center(child: Text('Select an event to view attendees'))
              : _buildEventDetailPanel(isDark),
        ),
      ],
    );
  }

  Widget _buildMobileEventList(bool isDark) {
    if (_selectedEvent != null) {
      return PopScope(
        canPop: false,
        onPopInvokedWithResult: (didPop, _) {
          if (!didPop) setState(() => _selectedEvent = null);
        },
        child: Column(
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
              color: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
              child: Row(
                children: [
                  IconButton(
                    icon: const Icon(Icons.arrow_back),
                    onPressed: () => setState(() => _selectedEvent = null),
                  ),
                  Expanded(
                    child: Text(
                      _selectedEvent!.title,
                      style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ),
            ),
            const Divider(height: 1),
            Expanded(child: _buildEventDetailPanel(isDark)),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _loadEvents,
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
                return InkWell(
                  onTap: () {
                    setState(() => _selectedEvent = ev);
                    _loadParticipants(ev.id);
                  },
                  borderRadius: BorderRadius.circular(14),
                  child: Container(
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
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(
                                color: ev.fee > 0 ? AppColors.infoBg : AppColors.successBg,
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Text(
                                ev.fee > 0 ? '₱${ev.fee.toStringAsFixed(0)}' : 'Free',
                                style: TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w700,
                                  color: ev.fee > 0 ? AppColors.info : AppColors.success,
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 6),
                        Row(
                          children: [
                            const Icon(Icons.location_on_outlined, size: 14, color: AppColors.mutedLight),
                            const SizedBox(width: 4),
                            Expanded(
                              child: Text(
                                ev.venue ?? 'Parish Venue',
                                style: TextStyle(fontSize: 13, color: isDark ? AppColors.mutedDark : AppColors.mutedLight),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 4),
                        Row(
                          children: [
                            const Icon(Icons.calendar_today, size: 13, color: AppColors.blue),
                            const SizedBox(width: 5),
                            Text(ev.date ?? 'Date TBA', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.blue)),
                            const Spacer(),
                            const Text('Tap to view attendees →', style: TextStyle(fontSize: 12, color: AppColors.blue, fontWeight: FontWeight.w600)),
                          ],
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
    );
  }

  Widget _buildEventDetailPanel(bool isDark) {
    final attendedCount = _participants.where((p) => p.attended).length;
    final totalCount = _participants.length;

    return Padding(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Event Header & Fast QR Action
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      _selectedEvent!.title,
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.w800,
                        color: isDark ? AppColors.textLight : AppColors.navy,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      '${_selectedEvent!.venue ?? "Parish Venue"} • ${_selectedEvent!.date ?? "Upcoming"}',
                      style: TextStyle(fontSize: 13, color: isDark ? AppColors.mutedDark : AppColors.mutedLight),
                    ),
                  ],
                ),
              ),
              ElevatedButton.icon(
                icon: const Icon(Icons.qr_code_scanner, size: 18),
                label: const Text('Rapid QR Check-In'),
                onPressed: () {
                  showDialog(
                    context: context,
                    builder: (ctx) => FastCheckInDialog(
                      event: _selectedEvent!,
                      participants: _participants,
                      onAttendanceChanged: (updated) {
                        final idx = _participants.indexWhere((p) => p.id == updated.id);
                        if (idx != -1) {
                          setState(() => _participants[idx] = updated);
                        }
                      },
                    ),
                  );
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.blue,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Attendance Stat Summary Strip
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: isDark ? AppColors.borderDark : AppColors.borderLight),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _StatItem(label: 'Registered', value: totalCount.toString(), color: AppColors.blue),
                _StatItem(label: 'Checked In', value: attendedCount.toString(), color: AppColors.success),
                _StatItem(
                  label: 'Turnout Rate',
                  value: totalCount > 0 ? '${((attendedCount / totalCount) * 100).toInt()}%' : '0%',
                  color: AppColors.cyan,
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Participants Roster Header
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Participant Roster',
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w800,
                  color: isDark ? AppColors.textLight : AppColors.textDark,
                ),
              ),
              TextButton.icon(
                icon: const Icon(Icons.person_add_alt_1, size: 16),
                label: const Text('Add Attendee'),
                onPressed: _showAddParticipantDialog,
              ),
            ],
          ),
          const SizedBox(height: 8),

          // Participants Table / List
          Expanded(
            child: _loadingParticipants
                ? const TableSkeletonWidget(itemCount: 4)
                : _participants.isEmpty
                    ? Center(
                        child: Text(
                          'No participants registered yet for this event.',
                          style: TextStyle(color: isDark ? AppColors.mutedDark : AppColors.mutedLight),
                        ),
                      )
                    : ListView.separated(
                        itemCount: _participants.length,
                        separatorBuilder: (_, __) => const SizedBox(height: 8),
                        itemBuilder: (context, idx) {
                          final p = _participants[idx];
                          final auth = context.read<AuthProvider>();
                          final sync = context.read<SyncService>();

                          return Container(
                            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                            decoration: BoxDecoration(
                              color: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
                              borderRadius: BorderRadius.circular(10),
                              border: Border.all(color: isDark ? AppColors.borderDark : AppColors.borderLight),
                            ),
                            child: Row(
                              children: [
                                CircleAvatar(
                                  radius: 18,
                                  backgroundColor: p.attended
                                      ? AppColors.success.withValues(alpha: 0.15)
                                      : Colors.grey.withValues(alpha: 0.15),
                                  child: Icon(
                                    p.attended ? Icons.check : Icons.person_outline,
                                    size: 18,
                                    color: p.attended ? AppColors.success : Colors.grey,
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        p.memberName ?? 'Participant #${p.memberId}',
                                        style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13),
                                      ),
                                      Text(
                                        'Payment: ${p.paymentStatus} (${p.modeOfPayment ?? "Cash"})',
                                        style: TextStyle(fontSize: 11, color: isDark ? AppColors.mutedDark : AppColors.mutedLight),
                                      ),
                                    ],
                                  ),
                                ),
                                Switch(
                                  value: p.attended,
                                  activeThumbColor: AppColors.success,
                                  onChanged: (val) {
                                    sync.markAttendanceOptimistic(
                                      participantId: p.id,
                                      attended: val,
                                      paymentStatus: p.paymentStatus,
                                      modeOfPayment: p.modeOfPayment,
                                      token: auth.session?.accessToken,
                                      areaId: auth.areaId,
                                    );
                                    setState(() {
                                      _participants[idx] = p.copyWith(attended: val);
                                    });
                                  },
                                ),
                              ],
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

class _StatItem extends StatelessWidget {
  final String label;
  final String value;
  final Color color;

  const _StatItem({required this.label, required this.value, required this.color});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(value, style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: color)),
        Text(label, style: const TextStyle(fontSize: 11, color: AppColors.mutedLight)),
      ],
    );
  }
}
