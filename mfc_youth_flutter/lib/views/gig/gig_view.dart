import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../constants/app_colors.dart';
import '../../models/gig_record.dart';
import '../../providers/auth_provider.dart';
import '../../services/api_service.dart';
import '../../widgets/wireframe_skeleton.dart';

class GigView extends StatefulWidget {
  const GigView({super.key});

  @override
  State<GigView> createState() => _GigViewState();
}

class _GigViewState extends State<GigView> {
  bool _loading = true;
  List<GigRecord> _records = [];
  double _totalAmount = 0.0;

  @override
  void initState() {
    super.initState();
    _loadGigRecords();
  }

  Future<void> _loadGigRecords() async {
    setState(() => _loading = true);
    final auth = context.read<AuthProvider>();
    final api = context.read<ApiService>();

    try {
      final res = await api.request('/gig', token: auth.session?.accessToken, areaId: auth.areaId);
      if (res['ok'] == true && res['records'] is List) {
        final list = (res['records'] as List).map((r) => GigRecord.fromJson(r)).toList();
        final sum = list.fold<double>(0.0, (acc, item) => acc + item.amount);
        setState(() {
          _records = list;
          _totalAmount = sum;
          _loading = false;
        });
        return;
      }
    } catch (_) {}

    // Supabase REST fallback
    final supData = await api.supabaseRest('gig_records', token: auth.session?.accessToken);
    if (supData is List) {
      final list = supData.map((r) => GigRecord.fromJson(r)).toList();
      final sum = list.fold<double>(0.0, (acc, item) => acc + item.amount);
      setState(() {
        _records = list;
        _totalAmount = sum;
        _loading = false;
      });
      return;
    }

    setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final currencyFormat = NumberFormat.currency(symbol: '₱', decimalDigits: 2);

    if (_loading) {
      return const TableSkeletonWidget(itemCount: 4);
    }

    return Scaffold(
      backgroundColor: Colors.transparent,
      body: RefreshIndicator(
        onRefresh: _loadGigRecords,
        color: AppColors.blue,
        child: CustomScrollView(
          slivers: [
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [AppColors.navy, AppColors.blue],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(16),
                    boxShadow: [
                      BoxShadow(
                        color: AppColors.blue.withValues(alpha: 0.3),
                        blurRadius: 12,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text(
                            'GIG Financial Stewardship',
                            style: TextStyle(
                              color: AppColors.cyan,
                              fontSize: 13,
                              fontWeight: FontWeight.w700,
                              letterSpacing: 0.5,
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: Colors.white.withValues(alpha: 0.2),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: const Text(
                              'God Is Generous',
                              style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w600),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Text(
                        currencyFormat.format(_totalAmount),
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 30,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            if (_records.isEmpty)
              SliverFillRemaining(
                child: Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.volunteer_activism_outlined, size: 56, color: isDark ? AppColors.mutedDark : AppColors.mutedLight),
                      const SizedBox(height: 12),
                      Text(
                        'No GIG contributions recorded yet.',
                        style: TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w600,
                          color: isDark ? AppColors.mutedDark : AppColors.mutedLight,
                        ),
                      ),
                    ],
                  ),
                ),
              )
            else
              SliverPadding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                sliver: SliverList(
                  delegate: SliverChildBuilderDelegate(
                    (context, index) {
                      final rec = _records[index];
                      return Container(
                        margin: const EdgeInsets.only(bottom: 12),
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: isDark ? AppColors.borderDark : AppColors.borderLight),
                        ),
                        child: Row(
                          children: [
                            Container(
                              width: 44,
                              height: 44,
                              decoration: BoxDecoration(
                                color: AppColors.success.withValues(alpha: 0.12),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: const Icon(Icons.payments_outlined, color: AppColors.success, size: 22),
                            ),
                            const SizedBox(width: 14),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    rec.memberName ?? 'Anonymous Contributor',
                                    style: TextStyle(
                                      fontSize: 15,
                                      fontWeight: FontWeight.w800,
                                      color: isDark ? AppColors.textLight : AppColors.textDark,
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  Row(
                                    children: [
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                        decoration: BoxDecoration(
                                          color: AppColors.blue.withValues(alpha: 0.1),
                                          borderRadius: BorderRadius.circular(6),
                                        ),
                                        child: Text(
                                          rec.fundType ?? 'Tithes',
                                          style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: AppColors.blue),
                                        ),
                                      ),
                                      if (rec.date != null) ...[
                                        const SizedBox(width: 8),
                                        Text(
                                          rec.date!,
                                          style: TextStyle(fontSize: 12, color: isDark ? AppColors.mutedDark : AppColors.mutedLight),
                                        ),
                                      ],
                                    ],
                                  ),
                                ],
                              ),
                            ),
                            Text(
                              currencyFormat.format(rec.amount),
                              style: const TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w900,
                                color: AppColors.success,
                              ),
                            ),
                          ],
                        ),
                      );
                    },
                    childCount: _records.length,
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
