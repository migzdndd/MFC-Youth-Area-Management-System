import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:qr_flutter/qr_flutter.dart';
import '../constants/app_colors.dart';
import '../models/event.dart';
import '../models/member.dart';

class DigitalIdPassDialog extends StatefulWidget {
  final Member member;
  final List<Event> events;

  const DigitalIdPassDialog({
    super.key,
    required this.member,
    this.events = const [],
  });

  @override
  State<DigitalIdPassDialog> createState() => _DigitalIdPassDialogState();
}

class _DigitalIdPassDialogState extends State<DigitalIdPassDialog> {
  String _passMode = 'universal';
  dynamic _selectedEventId;

  @override
  void initState() {
    super.initState();
    if (widget.events.isNotEmpty) {
      _selectedEventId = widget.events.first.id;
    }
  }

  String get _qrValue {
    final memberId = widget.member.id?.toString() ?? 'member';
    if (_passMode == 'event' && _selectedEventId != null) {
      return 'mfc_ticket:$_selectedEventId:$memberId';
    }
    return 'mfc_ticket:all:$memberId';
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final m = widget.member;
    final mfcCode = m.mfcId ?? 'MFC-${m.id.toString().padLeft(4, '0')}';

    return Dialog(
      backgroundColor: Colors.transparent,
      insetPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 400),
        child: Container(
          decoration: BoxDecoration(
            color: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
            borderRadius: BorderRadius.circular(20),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.25),
                blurRadius: 20,
                offset: const Offset(0, 10),
              ),
            ],
          ),
          clipBehavior: Clip.antiAlias,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Pass Header Banner
              Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 18),
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    colors: [AppColors.navy, AppColors.blue],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                ),
                child: Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'OFFICIAL DIGITAL PASS',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w800,
                            letterSpacing: 1.0,
                            color: AppColors.cyan,
                          ),
                        ),
                        IconButton(
                          icon: const Icon(Icons.close, color: Colors.white, size: 20),
                          padding: EdgeInsets.zero,
                          constraints: const BoxConstraints(minWidth: 44, minHeight: 44),
                          onPressed: () => Navigator.of(context).pop(),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      m.fullName,
                      style: const TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.w800,
                        color: Colors.white,
                      ),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 2),
                    Text(
                      '${m.chapterName ?? "MFC Youth Area"} • $mfcCode',
                      style: const TextStyle(
                        fontSize: 13,
                        color: Colors.white70,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              ),

              // Mode Selector
              Container(
                color: isDark ? AppColors.surfaceDarkSecondary : AppColors.surfaceLightSecondary,
                child: Row(
                  children: [
                    Expanded(
                      child: InkWell(
                        onTap: () => setState(() => _passMode = 'universal'),
                        child: Container(
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          decoration: BoxDecoration(
                            border: Border(
                              bottom: BorderSide(
                                color: _passMode == 'universal' ? AppColors.blue : Colors.transparent,
                                width: 2.5,
                              ),
                            ),
                          ),
                          child: Text(
                            'Universal Pass',
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              fontSize: 13,
                              fontWeight: _passMode == 'universal' ? FontWeight.w800 : FontWeight.w500,
                              color: _passMode == 'universal'
                                  ? (isDark ? AppColors.cyan : AppColors.blue)
                                  : (isDark ? AppColors.mutedDark : AppColors.mutedLight),
                            ),
                          ),
                        ),
                      ),
                    ),
                    Expanded(
                      child: InkWell(
                        onTap: widget.events.isEmpty
                            ? null
                            : () => setState(() => _passMode = 'event'),
                        child: Container(
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          decoration: BoxDecoration(
                            border: Border(
                              bottom: BorderSide(
                                color: _passMode == 'event' ? AppColors.blue : Colors.transparent,
                                width: 2.5,
                              ),
                            ),
                          ),
                          child: Text(
                            'Event Ticket',
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              fontSize: 13,
                              fontWeight: _passMode == 'event' ? FontWeight.w800 : FontWeight.w500,
                              color: widget.events.isEmpty
                                  ? (isDark ? AppColors.mutedDark.withValues(alpha: 0.5) : AppColors.mutedLight.withValues(alpha: 0.5))
                                  : (_passMode == 'event'
                                      ? (isDark ? AppColors.cyan : AppColors.blue)
                                      : (isDark ? AppColors.mutedDark : AppColors.mutedLight)),
                            ),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              // Event Dropdown if in Event Pass mode
              if (_passMode == 'event' && widget.events.isNotEmpty)
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
                  child: DropdownButtonFormField<dynamic>(
                    initialValue: _selectedEventId,
                    decoration: InputDecoration(
                      labelText: 'Select Scheduled Event',
                      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                    items: widget.events.map((ev) {
                      return DropdownMenuItem(
                        value: ev.id,
                        child: Text(ev.title, overflow: TextOverflow.ellipsis),
                      );
                    }).toList(),
                    onChanged: (val) => setState(() => _selectedEventId = val),
                  ),
                ),

              // QR Display Area
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
                child: Column(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: Colors.grey.withValues(alpha: 0.2)),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.05),
                            blurRadius: 10,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: QrImageView(
                        data: _qrValue,
                        version: QrVersions.auto,
                        size: 200,
                        backgroundColor: Colors.white,
                        eyeStyle: const QrEyeStyle(
                          eyeShape: QrEyeShape.square,
                          color: AppColors.navy,
                        ),
                        dataModuleStyle: const QrDataModuleStyle(
                          dataModuleShape: QrDataModuleShape.square,
                          color: AppColors.navy,
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                    Text(
                      _passMode == 'universal'
                          ? 'Valid for all Area Assemblies, G.I.G., and Chapter Fellowships'
                          : 'Valid for selected event attendance scanning',
                      style: TextStyle(
                        fontSize: 12,
                        color: isDark ? AppColors.mutedDark : AppColors.mutedLight,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              ),

              // Footer Actions
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
                decoration: BoxDecoration(
                  border: Border(
                    top: BorderSide(color: isDark ? AppColors.borderDark : AppColors.borderLight),
                  ),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: OutlinedButton.icon(
                        icon: const Icon(Icons.copy, size: 16),
                        label: const Text('Copy Pass String'),
                        style: OutlinedButton.styleFrom(
                          minimumSize: const Size.fromHeight(44),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        ),
                        onPressed: () {
                          Clipboard.setData(ClipboardData(text: _qrValue));
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('Pass QR string copied to clipboard.')),
                          );
                        },
                      ),
                    ),
                    const SizedBox(width: 12),
                    ElevatedButton(
                      onPressed: () => Navigator.of(context).pop(),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.blue,
                        foregroundColor: Colors.white,
                        minimumSize: const Size(80, 44),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                      child: const Text('Done'),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
