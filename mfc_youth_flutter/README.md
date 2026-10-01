# MFC Youth Area Management System - Flutter Client

Official multiplatform Flutter application for the **MFC Youth Area Management System**, maintaining 100% functional parity and strict Role-Based Access Control (RBAC) with the web platform.

---

## 🌟 Key Features & Parity Architecture

- **Area Dashboard**: Real-time KPI metrics (Active Youth, Established Chapters, Scheduled Events, GIG Tithes collections), upcoming events timeline, and quick-action navigation.
- **Youth Directory (`/members`)**: Searchable roster with real-time query filtering, Chapter chips, status pills (Active, Inactive, Alumni), and full member detail modal sheets.
- **Chapters & Units (`/chapters`)**: Chapter registry with servant leader designations, member tallies, and new chapter creation.
- **Events & Attendance (`/events`)**: Scheduled area assemblies and youth camps with fee tracking (PHP) and venue badges.
- **God Is Generous (GIG) Stewardship (`/gig`)**: Tithes, Love Offerings, and Mission fund tracking with gradient collections summary.
- **Universal Service Catalog (`/services`)**: LIT Creative Ministries (Music, Dance, Creative Writing, Graphics & Promo, Media & Tech) with assigned servant rosters.
- **Liturgical Mass Readings (`/readings`)**: Daily scripture bread of life (First Reading, Responsorial Psalm, Second Reading, Holy Gospel).
- **Dual-Layer Failover Architecture**: Central API `/api/...` query with seamless, automatic fallback directly to Supabase Cloud REST with bearer token authentication.
- **Zero-Blank-Screen Shimmer Wireframes**: Implements `ShimmerContainer`, `DashboardSkeletonWidget`, and `TableSkeletonWidget` across all async operations.
- **Responsive Theme Engine**: Light and dark mode support with tailored MFC Youth palette (Navy `#002847`, Blue `#0878BD`, Cyan `#38BDF8`).

---

## 📁 Project Structure

```
mfc_youth_flutter/
├── assets/
│   └── images/
│       ├── logo.png
│       └── logo-2.png
├── lib/
│   ├── constants/
│   │   ├── app_colors.dart         # Design system tokens and shimmer colors
│   │   └── app_constants.dart      # Supabase credentials and RBAC roles
│   ├── models/
│   │   ├── user_session.dart       # Session state and permissions
│   │   ├── member.dart             # Youth profile model
│   │   ├── chapter.dart            # Chapter model
│   │   ├── event.dart              # Event model
│   │   ├── gig_record.dart         # GIG financial tracking model
│   │   ├── report.dart             # Activity report model
│   │   └── daily_reading.dart      # Liturgical scripture model
│   ├── providers/
│   │   ├── auth_provider.dart      # Auth, demo login, and Area setup
│   │   ├── dashboard_provider.dart # KPI statistics
│   │   ├── members_provider.dart   # Member filtering and CRUD
│   │   └── theme_provider.dart     # Light/Dark mode state
│   ├── services/
│   │   ├── api_service.dart        # HTTP client with Supabase REST fallback
│   │   ├── storage_service.dart    # SharedPreferences local persistence
│   │   └── supabase_service.dart   # Direct Supabase authentication
│   ├── views/
│   │   ├── auth/login_view.dart    # Login with demo accounts & password toggle
│   │   ├── dashboard/dashboard_view.dart
│   │   ├── members/members_view.dart
│   │   ├── chapters/chapters_view.dart
│   │   ├── events/events_view.dart
│   │   ├── gig/gig_view.dart
│   │   ├── reports/reports_view.dart
│   │   ├── services/services_view.dart
│   │   ├── readings/readings_view.dart
│   │   ├── settings/settings_view.dart
│   │   └── home_shell.dart         # Main responsive shell with NavigationBar
│   ├── widgets/
│   │   ├── app_drawer.dart         # Navigation drawer
│   │   ├── area_onboarding_dialog.dart # First-time Area setup modal
│   │   ├── stat_card.dart          # KPI metric cards
│   │   └── wireframe_skeleton.dart # Shimmer loading wireframes
│   └── main.dart                   # Application entrypoint
└── pubspec.yaml
```

---

## 🚀 Getting Started

### Prerequisites
- [Flutter SDK](https://docs.flutter.dev/get-started/install) (version 3.3.0 or higher)
- Android Studio / Xcode (for mobile builds)
- VS Code or Android Studio with Flutter extensions

### Installation & Run

1. Navigate to the Flutter directory:
   ```bash
   cd mfc_youth_flutter
   ```

2. Get dependencies:
   ```bash
   flutter pub get
   ```

3. Run on connected device or emulator:
   ```bash
   flutter run
   ```

4. Build release APK for Android:
   ```bash
   flutter build apk --release
   ```

5. Build for Web:
   ```bash
   flutter build web --release
   ```
