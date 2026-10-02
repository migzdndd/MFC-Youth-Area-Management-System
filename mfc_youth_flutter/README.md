# MFC Youth Area Management System: Universal Cross-Platform App

Universal multiplatform Flutter application for the **MFC Youth Area Management System** (Missionary Families for Christ Youth and Kids Ministries), providing 100% functional parity with the web platform across **iOS, Android, Windows, macOS, and Web**.

---

## Key Modules & Full Feature Parity

### 1. Authentication, Claiming & Role-Based Access Control
- **Supabase Authentication**: Connects directly to Supabase PostgreSQL backend with JWT authentication and persistent sessions.
- **Servant Leader Registration**: Registration flow requiring official servant passcode verification (`/api/auth/admin-register`).
- **Youth Member Profile Claiming**: Allows youth members to self-claim existing profiles using their birth date and verification passcode (`/api/auth/member-claim`).
- **Multi-Factor Authentication (MFA)**: TOTP / Authenticator enrollment, security challenge, and code verification (`mfa-setup`, `mfa-verify`).
- **Password Management**: In-app recovery dialog, reset token dispatch, and password changes.
- **Dynamic RBAC & Area Switcher**: Tailored UI views for Area Coordinators, Chapter Servants, High Servants, LIT Servants, Campus Servants, and Members with multi-area selection.

### 2. Area Dashboard
- **Ministry Summary Metrics**: Real-time KPI cards for Total Members, Active Members, Chapters, Services, Events, Reports, Registrations, Total Attended, and GIG Tithes collections.
- **Quick Action Shortcuts**: 1-tap modals for Add Member, Create Event, Submit Report, and Chapter Roster.
- **Daily Scripture & Mass Readings**: Catholic liturgical readings (First Reading, Responsorial Psalm, Second Reading, Holy Gospel) with offline persistence.
- **Live Sync Status Indicator**: Real-time cloud sync status pill indicating active connection, pending offline changes, or syncing state.

### 3. Members Directory & Pastoral Profiles
- **Real-Time Search & Category Filters**: Filter by Chapter, Ministry category (Kids 4-12, Youth 13-21, LIT, Campus, High Servant), and Status (Active/Inactive).
- **Comprehensive Profile Modal**:
  - Personal information, birthdate with automatic age calculation, nicknames, and gender.
  - Contact details, residential address, school, and academic track.
  - Emergency contacts with 1-tap phone dialer and WhatsApp quick actions.
  - Ministry assignments: Chapter, household head, and creative services.
- **Member CRUD Operations**: Add new member and edit existing pastoral records with instant optimistic updates.
- **Spreadsheet CSV Export**: One-tap CSV generation with clipboard copy functionality.

### 4. Chapters & Households
- **Chapter Roster**: Active status indicators, member tallies, and assigned servant leaders.
- **Member Assignment Tool**: Multi-member assignment interface (`/api/chapters/assign-members`).
- **Chapter Creation**: Modal dialog for registering new community chapters.

### 5. Events & Rapid Attendance Tracking
- **Event Scheduling**: Title, description, venue, start/end dates and times, registration fees (PHP), and attendance modes.
- **Attendee Roster & Turnout Rate**: Real-time calculation of attendance rates, payment status (Paid, Unpaid, Waived), and payment methods.
- **QR Code Fast Check-In**: High-speed camera scanner using `mobile_scanner` with target overlay, plus manual input supporting USB barcode/handheld scanners.
- **Live Attendance Toggling**: Switch attendee presence with optimistic state update and background synchronization.

### 6. Universal Services & GIG Stewardship
- **Creative Service Catalog**: LIT Creative Ministries (Music, Dance, Creative Writing, Graphics & Media) with assigned servants.
- **GIG (God Is Generous) Stewardship**: Tithe and love offering logging with donor attribution, payment modes, and chapter aggregates.

### 7. Pastoral Activity Reports
- **Report Submission**: Category selection (Household, Youth Camp, Fellowship, Chapter Assembly, Service Meeting), activity date, headcount, location, and pastoral notes.
- **Historical Report Browser & CSV Export**: Browse, filter, and export pastoral records.

### 8. Bidirectional Offline Sync Engine
- **Full Snapshot Sync**: Pulls latest data via `/api/sync` on launch and pull-to-refresh.
- **Offline Mutation Queue**: Stores mutations locally with idempotency keys (`mut_*`) in `SharedPreferences` when offline. Automatically replays mutations in order once network connectivity resumes.
- **Optimistic UI Updates**: Immediate local feedback for attendance marks, member saves, and reports without waiting for server responses.

---

## Responsive Multi-Platform UX

- **Mobile (Phones & Tablets)**:
  - Bottom navigation bar with primary tabs (Dashboard, Members, Events, Reports, More/Menu).
  - Minimum 48x48dp touch targets, safe area insets, and smooth bottom sheets.
- **Desktop (Windows, macOS, Linux)**:
  - Collapsible persistent left sidebar with official MFC branding.
  - Keyboard shortcuts: `Ctrl/Cmd + K` search dialog, `Esc` to dismiss dialogs, `Enter` to submit.
  - Responsive multi-column grid layouts with data tables and split-pane event attendee views.

---

## Brand Identity & Design Tokens

- **Primary Navy**: `#002847` (Dark Navy: `#001B30`)
- **Accent Blue**: `#0878BD` (Secondary Blue: `#05659F`, Soft Blue: `#E7F5FF`)
- **Accent Cyan**: `#38BDF8`
- **Page Background**: `#F4F7FB` (Light), `#001B30` (Dark)
- **Surface Background**: `#FFFFFF` (Light), `#031F34` (Dark)
- **Typography**: Poppins (Headings & Titles), Inter (Body text & Inputs)
- **WCAG AA Compliance**: High-contrast text, clear semantic badges (Success `#2F8C5A`, Warning `#E0A01C`, Danger `#BD3F45`).

---

## Getting Started

### Prerequisites
- Flutter SDK (version 3.24 or higher)
- Android Studio / Xcode (for mobile builds)
- Visual Studio C++ build tools (for Windows desktop builds)

### Installation & Run

1. Navigate to the Flutter directory:
   ```bash
   cd mfc_youth_flutter
   ```

2. Install dependencies:
   ```bash
   flutter pub get
   ```

3. Run static analysis:
   ```bash
   flutter analyze
   ```

4. Run test suite:
   ```bash
   flutter test
   ```

5. Launch on desired platform:
   ```bash
   # Windows Desktop
   flutter run -d windows

   # macOS Desktop
   flutter run -d macos

   # Android Device / Emulator
   flutter run -d android

   # iOS Simulator
   flutter run -d ios

   # Chrome Web
   flutter run -d chrome
   ```
