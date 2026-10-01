class AppConstants {
  static const String appName = 'MFC Youth AMS';
  static const String appSubtitle = 'Area Management System';
  static const String appVersion = '1.0.1';

  // Cloud Backend & Supabase Configuration
  static const String supabaseUrl = 'https://desmhxtmnmfybrsdwhwz.supabase.co';
  static const String supabaseAnonKey = 'sb_publishable_rUW_5JS39kngwMT6bY5b4w_Se_Lo3eT';
  static const String defaultApiUrl = 'https://mfc-youth-area-management-web.vercel.app';

  // Roles Definition
  static const Map<String, String> roleLabels = {
    'national_coordinator': 'National Coordinator',
    'couple_coordinator': 'Couple Coordinator',
    'area_servant': 'Area Servant',
    'lit_servant': 'Area LIT Servant',
    'campus_servant': 'Campus Servant',
    'mfc_high_servant': 'MFC High Servant',
    'area_kids_servant': 'Area Kids Servant',
    'chapter_servant': 'Chapter Servant',
    'member': 'Youth Member',
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
  };

  static String normalizeRole(String? role) {
    final clean = (role ?? 'member').trim().toLowerCase();
    if (clean == 'area_admin') return 'area_servant';
    return roleLabels.containsKey(clean) ? clean : 'member';
  }

  static bool isLeadership(String? role) {
    return leadershipRoles.contains(normalizeRole(role));
  }
}
