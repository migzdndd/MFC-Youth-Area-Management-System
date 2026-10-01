# MFC Youth Area Management System

A standalone native **Cross-Platform Application** engineered for **Missionary Families for Christ (MFC) Youth & Kids Ministries**. Built with Flutter and Dart, the application delivers installable native clients for **Android**, **iOS**, **Windows Desktop**, and **macOS/Linux** to empower servant leaders, chapter heads, and area coordinators with real-time membership tracking, pastoral groupings, event registrations, service cataloging, GIG stewardship, and ministry analytics.

---

## Native Architecture

```
+-----------------------------------------------------------------------------------+
|               MFC Youth Area Management System - Native Application               |
|                                 (Flutter / Dart)                                  |
+--------------------+---------------------+--------------------+-------------------+
|   Android (.apk)   |     iOS (.ipa)      |   Windows (.exe)   |   macOS / Linux   |
+--------------------+---------------------+--------------------+-------------------+
                                         |
                                         | Secure HTTPS / REST / WebSockets
                                         v
+-----------------------------------------------------------------------------------+
|                             Supabase Cloud Backend                                |
|  - PostgreSQL Database with Row Level Security (RLS)                              |
|  - Encrypted Authentication & Session Management                                  |
|  - Role-Based Access Control (RBAC) & Automated Audit Logs                        |
+-----------------------------------------------------------------------------------+
```

### Core Architectural Principles
* **True Native Executables**: Compiles down to native machine code on mobile and desktop devices without requiring a web browser or WebView wrapper.
* **Offline-Resilient Caching**: Local preferences and secure storage ensure servant leaders have access to critical pastoral and contact records even in low-connectivity ministry areas.
* **Direct Cloud Synchronization**: Real-time two-way synchronization with Supabase PostgreSQL via authorized Row-Level Security (RLS).
* **Minimalist & Accessible UI**: Clean visual hierarchy adhering to antislop principles—zero cluttered subheadings, high-contrast typography, $\ge 48\times 48\text{px}$ touch targets, and wireframe shimmer skeleton loaders.
* **Official Branding**: Official MFC Youth flame emblem (`logo-2.png`) integrated as the primary brand asset and native application launcher icon.

---

## Key Features & Capabilities

### Member & Pastoral Profile Management
* **Youth & Kids Directory**: Complete profiles for MFC Kids (ages 4–12) and MFC Youth (ages 13–21), including contact info, residential details, emergency contacts, and chapter assignments.
* **Pastoral Grouping & Households**: Track household membership, household heads, and pastoral growth milestones across area chapters.
* **Extended Ministry Attributes**: Comprehensive tracking for campus/school info, Leaders in Training (LIT), Creative Ministries, and High Servant designations.

### Servant Leader Portal & Role-Based Access Control (RBAC)
* **Granular Authorization**: Role-based permissions for Chapter Servants, Area Coordinators, High Servants, LIT Ministry Heads, and Campus Admins.
* **Secure Authentication**: Built on Supabase Auth with encrypted sessions, servant leader registration passcodes, and role verification.
* **Adaptive Dashboard**: Real-time stats, chapter distribution summaries, upcoming schedules, and quick action shortcuts. Automatically adapts between desktop sidebars and mobile navigation bars.

### Event & Activity Management
* **Event Registrations**: Manage youth camps, conferences, household assemblies, and leadership training sessions.
* **Attendance & Payment Tracking**: Record participant attendance, fee collection (free vs. paid), and activity logs.

### GIG (God Is Generous) & Services Catalog
* **Stewardship & Resource Tracking**: Log community contributions, service catalog items, and financial stewardship records.
* **Ministry Roles**: Dedicated catalog of MFC Youth service roles with member-to-service assignments.

### Daily Readings & Prayer Guides
* **Scripture & Liturgical Feasts**: Built-in daily Catholic Mass readings, gospel reflections, and prayer intentions.

### Wireframe Skeleton Loaders
* Smooth loading skeletons provide instant visual feedback during data queries, eliminating blank or flickering screens.

---

## Repository Structure

```text
MFC-Youth-Area-Management-System/
├── mfc_youth_flutter/        # Main Cross-Platform Native Flutter Application
│   ├── android/              # Native Android runner, manifest, & Gradle config
│   ├── ios/                  # Native iOS runner & Xcode project
│   ├── windows/              # Native Windows C++ desktop runner & window configuration
│   ├── macos/                # Native macOS desktop runner
│   ├── linux/                # Native Linux desktop runner
│   ├── assets/               # High-resolution logos & icons (logo-2.png)
│   ├── lib/                  # Application source code
│   │   ├── constants/        # Design system palette, typography, & API credentials
│   │   ├── models/           # Domain models (Member, Chapter, Event, Report, GIG)
│   │   ├── providers/        # State management (Auth, Theme, Dashboard, Members)
│   │   ├── services/         # Supabase client, API, & local storage services
│   │   ├── widgets/          # Skeleton loaders, custom app drawer, stat cards
│   │   └── views/            # Adaptive screen views (Dashboard, Members, Events, etc.)
│   └── pubspec.yaml          # Flutter dependencies & launcher icon definitions
├── Backend/                  # Cloud Backend & Database Migrations
│   ├── api/                  # Backend endpoints & router
│   └── supabase/             # SQL schema migrations (001_initial_schema to 011_...)
├── docs/                     # Technical, architectural, & deployment documentation
├── NATIVE_SETUP.md           # Deep-dive native mobile and desktop packaging guide
├── CHANGELOG.md              # Version release history and migration notes
└── SECURITY.md               # Security policy & vulnerability reporting
```

---

## Installation & Build Instructions

### Prerequisites
* **Flutter SDK**: `3.x` or higher (Channel stable)
* **Dart SDK**: `3.x` or higher
* **Android SDK / Command-line Tools**: For Android compilation
* **Visual Studio 2022**: With **Desktop development with C++** workload (for Windows builds)
* **Xcode**: On macOS (for iOS/macOS builds)

---

### Android Installation & Packaging

#### 1. Pre-built Release APK
A production-ready release build is available at:
```text
mfc_youth_flutter/build/app/outputs/flutter-apk/app-release.apk
```

#### 2. Installing to a Physical Device via ADB
Connect your Android phone or tablet via USB (with USB Debugging enabled) and run:
```powershell
adb install -r "mfc_youth_flutter/build/app/outputs/flutter-apk/app-release.apk"
```
*Alternatively, transfer `app-release.apk` directly to the phone via USB cable, Google Drive, or local storage and tap **Install**.*

#### 3. Building from Source
```powershell
cd mfc_youth_flutter
flutter pub get

# Generate production release APK (R8-optimized, tree-shaken)
flutter build apk --release
```

---

### Windows Desktop & Laptop Packaging

The native Windows runner is configured in `mfc_youth_flutter/windows/` with a custom 1280×720 viewport, adaptive multi-column desktop layout, and native `.ico` application icons.

#### 1. Setup C++ Build Tools
Ensure **Visual Studio Community 2022** has the **Desktop development with C++** workload installed:
1. Open **Visual Studio Installer**.
2. Select **Modify** on Visual Studio 2022.
3. Check **Desktop development with C++** and install.

#### 2. Build Windows Executable
```powershell
cd mfc_youth_flutter
flutter build windows --release
```
The standalone executable and native dependencies will be output to:
```text
mfc_youth_flutter/build/windows/x64/runner/Release/mfc_youth_flutter.exe
```

---

### iOS & macOS Packaging

The native iOS runner is configured in `mfc_youth_flutter/ios/`:
* Display Name: `"MFC Youth AMS"`
* Native app icons generated from `logo-2.png`

#### Building on macOS:
```bash
cd mfc_youth_flutter
flutter pub get

# Build iOS archive:
flutter build ipa --release

# Build native macOS app:
flutter build macos --release
```

---

### Running in Development

To run the application on any connected physical device, emulator, or desktop runner with live hot reload:
```powershell
cd mfc_youth_flutter
flutter run
```

---

## Backend & Database Setup

The application communicates directly with Supabase Cloud.

1. Create a Supabase project at [supabase.com](https://supabase.com).
2. Execute the sequential SQL migrations located in [`Backend/supabase/`](file:///d:/data/Github%20Repositories/MFC-Youth-Area-Management-System/Backend/supabase) via the Supabase SQL Editor.
3. Update your API credentials in [`mfc_youth_flutter/lib/constants/app_constants.dart`](file:///d:/data/Github%20Repositories/MFC-Youth-Area-Management-System/mfc_youth_flutter/lib/constants/app_constants.dart):
   ```dart
   static const String supabaseUrl = 'https://your-project.supabase.co';
   static const String supabaseAnonKey = 'your-anon-key';
   ```

---

## Technical Guides & Documentation

* **Native Packaging Guide**: [`NATIVE_SETUP.md`](file:///d:/data/Github%20Repositories/MFC-Youth-Area-Management-System/NATIVE_SETUP.md)
* **Release History & Changelog**: [`CHANGELOG.md`](file:///d:/data/Github%20Repositories/MFC-Youth-Area-Management-System/CHANGELOG.md)
* **Security & Vulnerability Disclosure**: [`SECURITY.md`](file:///d:/data/Github%20Repositories/MFC-Youth-Area-Management-System/SECURITY.md)

---

## Community & Governance

This software is developed and maintained for the **Missionary Families for Christ (MFC) Youth** ministry. User data and member records must be handled in strict accordance with community pastoral standards and statutory data privacy compliance.
