import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:provider/provider.dart';
import '../../constants/app_colors.dart';
import '../../models/event.dart';
import '../../models/participant.dart';
import '../../providers/auth_provider.dart';
import '../../services/sync_service.dart';

class FastCheckInDialog extends StatefulWidget {
  final Event event;
  final List<EventParticipant> participants;
  final Function(EventParticipant updated) onAttendanceChanged;

  const FastCheckInDialog({
    super.key,
    required this.event,
    required this.participants,
    required this.onAttendanceChanged,
  });

  @override
  State<FastCheckInDialog> createState() => _FastCheckInDialogState();
}

class _FastCheckInDialogState extends State<FastCheckInDialog> {
  final TextEditingController _manualCodeCtrl = TextEditingController();
  final MobileScannerController _scannerController = MobileScannerController();

  String? _recentCheckedInName;
  bool _recentSuccess = false;
  String? _feedbackMessage;

  @override
  void dispose() {
    _manualCodeCtrl.dispose();
    _scannerController.dispose();
    super.dispose();
  }

  void _processScannedCode(String rawCode) {
    final cleanCode = rawCode.trim();
    if (cleanCode.isEmpty) return;

    // Match code to participant ID or member ID
    EventParticipant? match;
    for (final p in widget.participants) {
      if (p.id.toString() == cleanCode ||
          p.memberId.toString() == cleanCode ||
          (p.memberName != null && p.memberName!.toLowerCase().contains(cleanCode.toLowerCase()))) {
        match = p;
        break;
      }
    }

    final auth = context.read<AuthProvider>();
    final sync = context.read<SyncService>();

    if (match != null) {
      final validMatch = match;
      final newStatus = !validMatch.attended;
      sync.markAttendanceOptimistic(
        participantId: validMatch.id,
        attended: newStatus,
        paymentStatus: validMatch.paymentStatus,
        token: auth.session?.accessToken,
        areaId: auth.areaId,
      );

      final updated = validMatch.copyWith(attended: newStatus);
      widget.onAttendanceChanged(updated);

      setState(() {
        _recentCheckedInName = validMatch.memberName ?? 'Participant #${validMatch.id}';
        _recentSuccess = true;
        _feedbackMessage = newStatus ? 'Marked as Present' : 'Marked as Absent';
      });
    } else {
      setState(() {
        _recentCheckedInName = cleanCode;
        _recentSuccess = false;
        _feedbackMessage = 'No matching registration found for this event';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Dialog(
      backgroundColor: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 520, maxHeight: 680),
        child: Padding(
          padding: const EdgeInsets.all(22),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Header
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Rapid QR Check-In',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w800,
                            color: isDark ? AppColors.textLight : AppColors.navy,
                          ),
                        ),
                        Text(
                          widget.event.title,
                          style: const TextStyle(fontSize: 12, color: AppColors.blue, fontWeight: FontWeight.w600),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close),
                    onPressed: () => Navigator.of(context).pop(),
                  ),
                ],
              ),
              const SizedBox(height: 12),

              // Scanner Viewport
              Expanded(
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(16),
                  child: Stack(
                    children: [
                      MobileScanner(
                        controller: _scannerController,
                        onDetect: (capture) {
                          final barcodes = capture.barcodes;
                          for (final barcode in barcodes) {
                            if (barcode.rawValue != null) {
                              _processScannedCode(barcode.rawValue!);
                              break;
                            }
                          }
                        },
                      ),
                      // Target Reticle Overlay
                      Center(
                        child: Container(
                          width: 220,
                          height: 220,
                          decoration: BoxDecoration(
                            border: Border.all(color: AppColors.cyan, width: 2.5),
                            borderRadius: BorderRadius.circular(16),
                          ),
                        ),
                      ),
                      Positioned(
                        bottom: 12,
                        left: 0,
                        right: 0,
                        child: Center(
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                            decoration: BoxDecoration(
                              color: Colors.black.withValues(alpha: 0.65),
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: const Text(
                              'Align QR Code or Barcode inside target',
                              style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w600),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 14),

              // Live Feedback Alert
              if (_feedbackMessage != null) ...[
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                  decoration: BoxDecoration(
                    color: _recentSuccess ? AppColors.successBg : AppColors.dangerBg,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(
                      color: (_recentSuccess ? AppColors.success : AppColors.danger).withValues(alpha: 0.3),
                    ),
                  ),
                  child: Row(
                    children: [
                      Icon(
                        _recentSuccess ? Icons.check_circle : Icons.error_outline,
                        color: _recentSuccess ? AppColors.success : AppColors.danger,
                        size: 20,
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              _recentCheckedInName ?? '',
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w700,
                                color: _recentSuccess ? AppColors.success : AppColors.danger,
                              ),
                            ),
                            Text(
                              _feedbackMessage!,
                              style: TextStyle(
                                fontSize: 11,
                                color: _recentSuccess ? AppColors.success : AppColors.danger,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 12),
              ],

              // Manual Code / Barcode Scanner Input
              Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _manualCodeCtrl,
                      decoration: InputDecoration(
                        hintText: 'Type Member ID / Code...',
                        prefixIcon: const Icon(Icons.qr_code, size: 20),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                      onSubmitted: (v) {
                        _processScannedCode(v);
                        _manualCodeCtrl.clear();
                      },
                    ),
                  ),
                  const SizedBox(width: 8),
                  ElevatedButton(
                    onPressed: () {
                      _processScannedCode(_manualCodeCtrl.text);
                      _manualCodeCtrl.clear();
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.blue,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    ),
                    child: const Text('Check In', style: TextStyle(fontWeight: FontWeight.w700)),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
