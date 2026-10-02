import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../constants/app_colors.dart';
import '../../models/daily_reading.dart';
import '../../services/api_service.dart';
import '../../widgets/wireframe_skeleton.dart';

class ReadingsView extends StatefulWidget {
  const ReadingsView({super.key});

  @override
  State<ReadingsView> createState() => _ReadingsViewState();
}

class _ReadingsViewState extends State<ReadingsView> {
  bool _loading = true;
  DailyReading? _reading;

  @override
  void initState() {
    super.initState();
    _loadReading();
  }

  Future<void> _loadReading() async {
    setState(() => _loading = true);
    final api = context.read<ApiService>();

    try {
      final res = await api.request('/readings/today');
      if (res['reading'] is Map<String, dynamic>) {
        setState(() {
          _reading = DailyReading.fromJson(res['reading']);
          _loading = false;
        });
        return;
      }
    } catch (_) {}

    // Fallback default reading
    setState(() {
      _reading = DailyReading(
        date: 'Today',
        title: 'Daily Liturgical Mass Readings',
        firstReadingRef: '1 Corinthians 13:4-8',
        firstReadingText: 'Love is patient, love is kind. It does not envy, it does not boast, it is not proud. It does not dishonor others, it is not self-seeking, it is not easily angered, it keeps no record of wrongs. Love does not delight in evil but rejoices with the truth. It always protects, always trusts, always hopes, always perseveres. Love never fails.',
        psalmRef: 'Psalm 23:1-3, 4, 5, 6',
        psalmText: 'The Lord is my shepherd; there is nothing I shall want. Fresh and green are the pastures where he gives me repose, near restful waters he leads me; he revives my soul.',
        gospelRef: 'Matthew 28:19-20',
        gospelText: 'Go, therefore, and make disciples of all nations, baptizing them in the name of the Father, and of the Son, and of the Holy Spirit, teaching them to observe all that I have commanded you. And behold, I am with you always, until the end of the age.',
      );
      _loading = false;
    });
  }

  Widget _buildReadingCard({
    required BuildContext context,
    required String sectionTitle,
    required String? reference,
    required String? text,
    required IconData icon,
    required Color accentColor,
  }) {
    if (text == null || text.isEmpty) return const SizedBox.shrink();
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: isDark ? AppColors.borderDark : AppColors.borderLight),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 8,
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
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: accentColor.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(icon, color: accentColor, size: 20),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      sectionTitle,
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                        color: accentColor,
                        letterSpacing: 0.5,
                      ),
                    ),
                    if (reference != null)
                      Text(
                        reference,
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w800,
                          color: isDark ? AppColors.textLight : AppColors.textDark,
                        ),
                      ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Text(
            text,
            style: TextStyle(
              fontSize: 14,
              height: 1.6,
              color: isDark ? AppColors.textLight.withValues(alpha: 0.9) : AppColors.textDark.withValues(alpha: 0.9),
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const TableSkeletonWidget(itemCount: 3);
    }

    final r = _reading;

    return Scaffold(
      backgroundColor: Colors.transparent,
      body: RefreshIndicator(
        onRefresh: _loadReading,
        color: AppColors.blue,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            if (r != null) ...[
              _buildReadingCard(
                context: context,
                sectionTitle: 'FIRST READING',
                reference: r.firstReadingRef,
                text: r.firstReadingText,
                icon: Icons.auto_stories,
                accentColor: AppColors.blue,
              ),
              _buildReadingCard(
                context: context,
                sectionTitle: 'RESPONSORIAL PSALM',
                reference: r.psalmRef,
                text: r.psalmText,
                icon: Icons.music_note,
                accentColor: AppColors.cyan,
              ),
              if (r.secondReadingRef != null && r.secondReadingText != null)
                _buildReadingCard(
                  context: context,
                  sectionTitle: 'SECOND READING',
                  reference: r.secondReadingRef,
                  text: r.secondReadingText,
                  icon: Icons.bookmark_border,
                  accentColor: AppColors.purple,
                ),
              _buildReadingCard(
                context: context,
                sectionTitle: 'HOLY GOSPEL',
                reference: r.gospelRef,
                text: r.gospelText,
                icon: Icons.church,
                accentColor: AppColors.gold,
              ),
            ],
          ],
        ),
      ),
    );
  }
}
