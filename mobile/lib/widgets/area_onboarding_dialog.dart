import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../constants/app_colors.dart';
import '../providers/auth_provider.dart';
import '../services/supabase_service.dart';

class AreaOnboardingDialog extends StatefulWidget {
  const AreaOnboardingDialog({super.key});

  @override
  State<AreaOnboardingDialog> createState() => _AreaOnboardingDialogState();
}

class _AreaOnboardingDialogState extends State<AreaOnboardingDialog> {
  final SupabaseService _supabase = SupabaseService();
  final TextEditingController _newAreaController = TextEditingController();

  bool _loadingAreas = true;
  bool _submitting = false;
  bool _showCreate = false;
  List<Map<String, dynamic>> _areas = [];
  String? _selectedAreaId;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadAreas();
  }

  @override
  void dispose() {
    _newAreaController.dispose();
    super.dispose();
  }

  Future<void> _loadAreas() async {
    setState(() {
      _loadingAreas = true;
      _error = null;
    });

    final auth = context.read<AuthProvider>();
    final list = await _supabase.fetchAreas(token: auth.session?.accessToken);

    setState(() {
      _areas = list;
      if (list.isNotEmpty) {
        _selectedAreaId = list.first['id'].toString();
      }
      _loadingAreas = false;
    });
  }

  Future<void> _handleSelect() async {
    if (_selectedAreaId == null) return;
    setState(() {
      _submitting = true;
      _error = null;
    });

    final auth = context.read<AuthProvider>();
    final chosen = _areas.firstWhere(
      (a) => a['id'].toString() == _selectedAreaId,
      orElse: () => {'name': 'Selected Area'},
    );

    final ok = await auth.selectArea(_selectedAreaId!, chosenAreaName: chosen['name']?.toString());
    if (mounted) {
      if (ok) {
        Navigator.of(context).pop();
      } else {
        setState(() {
          _submitting = false;
          _error = 'Failed to connect to the selected Area.';
        });
      }
    }
  }

  Future<void> _handleCreate() async {
    final clean = _newAreaController.text.trim();
    if (clean.length < 3) {
      setState(() => _error = 'Area Name must be at least 3 characters.');
      return;
    }

    setState(() {
      _submitting = true;
      _error = null;
    });

    final auth = context.read<AuthProvider>();
    final ok = await auth.createArea(clean);
    if (mounted) {
      if (ok) {
        Navigator.of(context).pop();
      } else {
        setState(() {
          _submitting = false;
          _error = auth.authError ?? 'Failed to create Area.';
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      backgroundColor: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
      child: Container(
        constraints: const BoxConstraints(maxWidth: 440),
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: AppColors.blue.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: const Text(
                    'ACCOUNT SETUP',
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w800,
                      letterSpacing: 0.6,
                      color: AppColors.blue,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              'Select Your MFC Youth Area',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w800,
                color: isDark ? AppColors.textLight : AppColors.textDark,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              'Your Servant Leader account was created successfully. Before entering the management dashboard, connect it to the Area you serve.',
              style: TextStyle(
                fontSize: 12,
                color: isDark ? AppColors.mutedDark : AppColors.mutedLight,
                height: 1.4,
              ),
            ),
            const SizedBox(height: 18),

            if (_error != null) ...[
              Container(
                padding: const EdgeInsets.all(12),
                margin: const EdgeInsets.only(bottom: 16),
                decoration: BoxDecoration(
                  color: AppColors.dangerBg,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: AppColors.danger.withValues(alpha: 0.3)),
                ),
                child: Text(
                  _error!,
                  style: const TextStyle(fontSize: 12, color: AppColors.danger),
                ),
              ),
            ],

            if (!_showCreate) ...[
              // Option 1: Existing Area Selection
              const Text('Existing Area', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
              const SizedBox(height: 6),
              if (_loadingAreas)
                const LinearProgressIndicator(color: AppColors.blue)
              else if (_areas.isEmpty)
                const Text('No Area records found. Please create one below.', style: TextStyle(fontSize: 12))
              else
                DropdownButtonFormField<String>(
                  initialValue: _selectedAreaId,
                  decoration: InputDecoration(
                    contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                  items: _areas.map((a) {
                    return DropdownMenuItem<String>(
                      value: a['id'].toString(),
                      child: Text(a['name']?.toString() ?? 'Unnamed Area'),
                    );
                  }).toList(),
                  onChanged: _submitting ? null : (v) => setState(() => _selectedAreaId = v),
                ),
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                height: 46,
                child: ElevatedButton(
                  onPressed: _submitting || _loadingAreas || _areas.isEmpty ? null : _handleSelect,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.blue,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                  child: _submitting
                      ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                      : const Text('Continue with Selected Area', style: TextStyle(fontWeight: FontWeight.w700)),
                ),
              ),
              const SizedBox(height: 14),
              Center(
                child: TextButton(
                  onPressed: _submitting ? null : () => setState(() => _showCreate = true),
                  child: const Text('Create New Area-Based Account', style: TextStyle(color: AppColors.blue, fontSize: 13)),
                ),
              ),
            ] else ...[
              // Option 2: Create New Area
              const Text('New Area Name', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
              const SizedBox(height: 6),
              TextField(
                controller: _newAreaController,
                decoration: InputDecoration(
                  hintText: 'e.g. MFC Youth NCR East',
                  contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                ),
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: _submitting ? null : () => setState(() => _showCreate = false),
                      style: OutlinedButton.styleFrom(
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        minimumSize: const Size(0, 46),
                      ),
                      child: const Text('Cancel'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: _submitting ? null : _handleCreate,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.blue,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        minimumSize: const Size(0, 46),
                      ),
                      child: _submitting
                          ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                          : const Text('Create Area', style: TextStyle(fontWeight: FontWeight.w700)),
                    ),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }
}
