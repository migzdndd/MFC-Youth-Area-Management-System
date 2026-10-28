class AppConstants {
  static const String appName = 'MFC Youth';
  static const String appVersion = '1.0.0';

  // Cloud Backend & Supabase Configuration
  static const String supabaseUrl = 'https://desmhxtmnmfybrsdwhwz.supabase.co';
  static const String supabaseAnonKey = 'sb_publishable_rUW_5JS39kngwMT6bY5b4w_Se_Lo3eT';
  static const String defaultApiUrl = 'https://mfc-youth-area-management-system.vercel.app';

  // 6-Level Role Hierarchy Definition
  static const Map<String, String> roleLabels = {
    // Level 1: National Coordinator
    'national_coordinator': 'National Coordinator',
    // Level 2: Couple Coordinator & Area Servant
    'couple_coordinator': 'Couple Coordinator',
    'area_servant': 'Area Servant',
    // Level 3: Specialized Ministry Servants
    'lit_servant': 'Area LIT Servant',
    'campus_servant': 'Campus Servant',
    'mfc_high_servant': 'MFC High Servant',
    'area_kids_servant': 'Area Kids Servant',
    // Level 4: Chapter Servant
    'chapter_servant': 'Chapter Servant',
    // Level 5: Household & Unit Servants
    'household_servant': 'Household Servant',
    'unit_servant': 'Unit Servant',
    // Level 6: General Member
    'member': 'Member',
  };

  static const Set<String> leadershipRoles = {
    'national_coordinator',
    'couple_coordinator',
    'area_servant',
    'lit_servant',
    'campus_servant',
    'mfc_high_servant',
    'area_kids_servant',
    'chapter_servant',
    'household_servant',
    'unit_servant',
  };

  static String normalizeRole(String? role) {
    final clean = (role ?? 'member').trim().toLowerCase();
    if (clean == 'area_admin') return 'area_servant';
    return roleLabels.containsKey(clean) ? clean : 'member';
  }

  static bool isLeadership(String? role) {
    return leadershipRoles.contains(normalizeRole(role));
  }

  static int roleLevel(String? role) {
    final r = normalizeRole(role);
    switch (r) {
      case 'national_coordinator':
        return 1;
      case 'couple_coordinator':
      case 'area_servant':
        return 2;
      case 'lit_servant':
      case 'campus_servant':
      case 'mfc_high_servant':
      case 'area_kids_servant':
        return 3;
      case 'chapter_servant':
        return 4;
      case 'household_servant':
      case 'unit_servant':
        return 5;
      default:
        return 6;
    }
  }
}
