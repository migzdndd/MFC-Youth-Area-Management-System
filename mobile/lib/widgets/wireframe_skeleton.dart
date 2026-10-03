import 'package:flutter/material.dart';
import '../constants/app_colors.dart';

/// Shimmering animation container for building wireframe skeleton screens
class ShimmerContainer extends StatefulWidget {
  final double? width;
  final double height;
  final BorderRadius? borderRadius;

  const ShimmerContainer({
    super.key,
    this.width,
    required this.height,
    this.borderRadius,
  });

  @override
  State<ShimmerContainer> createState() => _ShimmerContainerState();
}

class _ShimmerContainerState extends State<ShimmerContainer> with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _animation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1300),
    )..repeat();
    _animation = Tween<double>(begin: -1.0, end: 2.0).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOutSine),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final baseColor = isDark ? AppColors.shimmerBaseDark : AppColors.shimmerBaseLight;
    final highlightColor = isDark ? AppColors.shimmerHighlightDark : AppColors.shimmerHighlightLight;

    return AnimatedBuilder(
      animation: _animation,
      builder: (context, child) {
        return Container(
          width: widget.width,
          height: widget.height,
          decoration: BoxDecoration(
            borderRadius: widget.borderRadius ?? BorderRadius.circular(8),
            gradient: LinearGradient(
              begin: Alignment.centerLeft,
              end: Alignment.centerRight,
              colors: [baseColor, highlightColor, baseColor],
              stops: [
                (_animation.value - 0.3).clamp(0.0, 1.0),
                _animation.value.clamp(0.0, 1.0),
                (_animation.value + 0.3).clamp(0.0, 1.0),
              ],
            ),
          ),
        );
      },
    );
  }
}

/// Dashboard Wireframe Skeleton
class DashboardSkeletonWidget extends StatelessWidget {
  const DashboardSkeletonWidget({super.key});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header Skeleton
          const Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  ShimmerContainer(width: 180, height: 24),
                  SizedBox(height: 8),
                  ShimmerContainer(width: 260, height: 14),
                ],
              ),
              ShimmerContainer(width: 44, height: 44, borderRadius: BorderRadius.all(Radius.circular(12))),
            ],
          ),
          const SizedBox(height: 20),

          // 4 Stat Cards Skeleton
          GridView.count(
            crossAxisCount: MediaQuery.of(context).size.width > 600 ? 4 : 2,
            crossAxisSpacing: 12,
            mainAxisSpacing: 12,
            childAspectRatio: 1.35,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            children: List.generate(4, (index) => const ShimmerContainer(height: 100)),
          ),
          const SizedBox(height: 24),

          // Quick Action Bar Skeleton
          const ShimmerContainer(height: 52),
          const SizedBox(height: 24),

          // Activity Panels Skeleton
          const ShimmerContainer(width: 160, height: 20),
          const SizedBox(height: 12),
          const ShimmerContainer(height: 180),
        ],
      ),
    );
  }
}

/// List and Table Wireframe Skeleton
class TableSkeletonWidget extends StatelessWidget {
  final int itemCount;
  final EdgeInsetsGeometry padding;
  final bool shrinkWrap;
  final ScrollPhysics? physics;

  const TableSkeletonWidget({
    super.key,
    this.itemCount = 6,
    this.padding = const EdgeInsets.all(16),
    this.shrinkWrap = false,
    this.physics,
  });

  @override
  Widget build(BuildContext context) {
    return ListView.separated(
      padding: padding,
      shrinkWrap: shrinkWrap,
      physics: physics,
      itemCount: itemCount,
      separatorBuilder: (_, __) => const SizedBox(height: 12),
      itemBuilder: (_, __) => Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: Theme.of(context).cardColor,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Theme.of(context).dividerColor.withValues(alpha: 0.1)),
        ),
        child: const Row(
          children: [
            ShimmerContainer(width: 44, height: 44, borderRadius: BorderRadius.all(Radius.circular(10))),
            SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  ShimmerContainer(width: 160, height: 16),
                  SizedBox(height: 6),
                  ShimmerContainer(width: 220, height: 12),
                ],
              ),
            ),
            ShimmerContainer(width: 60, height: 24, borderRadius: BorderRadius.all(Radius.circular(999))),
          ],
        ),
      ),
    );
  }
}

/// Event List Skeleton Loader
class EventListSkeletonWidget extends StatelessWidget {
  final int itemCount;
  final EdgeInsetsGeometry padding;

  const EventListSkeletonWidget({
    super.key,
    this.itemCount = 5,
    this.padding = const EdgeInsets.all(16),
  });

  @override
  Widget build(BuildContext context) {
    return ListView.separated(
      padding: padding,
      itemCount: itemCount,
      separatorBuilder: (_, __) => const SizedBox(height: 12),
      itemBuilder: (_, __) => Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Theme.of(context).cardColor,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: Theme.of(context).dividerColor.withValues(alpha: 0.1)),
        ),
        child: const Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                ShimmerContainer(width: 180, height: 18),
                ShimmerContainer(width: 56, height: 22, borderRadius: BorderRadius.all(Radius.circular(999))),
              ],
            ),
            SizedBox(height: 10),
            ShimmerContainer(width: 240, height: 12),
            SizedBox(height: 14),
            Row(
              children: [
                ShimmerContainer(width: 100, height: 12),
                SizedBox(width: 16),
                ShimmerContainer(width: 80, height: 12),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
