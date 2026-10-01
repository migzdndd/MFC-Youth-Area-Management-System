# Offline Desktop and Mobile Application Guide

This guide details the prerequisites, architecture, build procedures, and operational workflows for the **MFC Youth Area Management System** across Web, Android, iOS, Windows, and macOS.

---

## 1. Prerequisites and Environment Setup

### 1.1 Mobile Environments (Capacitor)
- **Node.js**: Version 20.x or higher (Node 24 LTS verified).
- **Android**:
  - Android Studio Ladybug (or newer) with Android SDK Platform 34 or 35.
  - JDK 21 (Temurin or OpenJDK).
  - Android SDK Command-line Tools and Build-Tools 34.0.0+.
  - An Android device with USB debugging enabled or an Android Virtual Device (AVD).
- **iOS**:
  - macOS Sonoma or Sequoia with Xcode 15 or 16.
  - CocoaPods or Swift Package Manager (Capacitor 7+ uses native Swift Packages).
  - Apple Developer Account (for device provisioning and App Store distribution).

### 1.2 Desktop Environments (Tauri 2)
- **Rust Toolchain**:
  - Install Rust via [rustup.rs](https://rustup.rs):
    ```bash
    rustup default stable
    rustup target add x86_64-pc-windows-msvc # Windows
    rustup target add x86_64-apple-darwin aarch64-apple-darwin # macOS
    ```
- **Windows**:
  - Visual Studio 2022 with the "Desktop development with C++" workload.
  - WebView2 Runtime (pre-installed on Windows 10 and 11).
  - WiX Toolset v3.14 (optional, for `.msi` installers) or NSIS (for lightweight `.exe` installers).
- **macOS**:
  - Xcode Command Line Tools (`xcode-select --install`).
  - macOS 10.13 High Sierra or newer.

---

## 2. Quick Command Reference

All build, synchronization, and packaging workflows run through standardized npm scripts at the repository root:

```bash
# Web Development Server
npm run dev:web

# Mobile Synchronization (Copies /Frontend assets into Android and iOS native projects)
npm run mobile:sync

# Mobile Android Run / Studio Launch
npm run mobile:android

# Mobile iOS Run / Xcode Launch
npm run mobile:ios

# Desktop Live Development (Tauri 2 wrapper with hot reload)
npm run desktop:dev

# Desktop Production Packaging (.exe / .msi on Windows, .dmg on macOS)
npm run desktop:build
```

---

## 3. Core Offline Architecture and Data Flow

The system achieves 100% network isolation and offline durability through a three-layer client architecture:

```
+--------------------------------------------------------------------------+
|                            User Interface View                           |
|  (Static HTML5 + Zero-CDN Local Assets + Alpine.js + Offline Status Pill) |
+--------------------------------------------------------------------------+
                                    |
          +-------------------------+-------------------------+
          |                                                   |
          v                                                   v
+-----------------------+                           +---------------------+
|   Read Operations     |                           | Mutation Operations |
| (Members, Chapters,   |                           | (Attendance, Notes, |
|  Gatherings, Reports) |                           |  Payments, Records) |
+-----------------------+                           +---------------------+
          |                                                   |
          v                                                   v
+-----------------------+                           +---------------------+
|   Cache Read Engine   |                           | FIFO Outbox Queue   |
| (IndexedDB / memory)  |                           | (IndexedDB Outbox)  |
+-----------------------+                           +---------------------+
          |                                                   |
          | (Online)                                          | (Replay on Connect)
          v                                                   v
+-----------------------+                           +---------------------+
| Backend API Server    | <======================== | Sync Manager Engine |
| (/api/sync, /api/...) |     Exponential Backoff   | (Status broadcast)  |
+-----------------------+                           +---------------------+
```

### 3.1 Zero-CDN Asset Isolation
- All scripts (Alpine.js, jsPDF, jsPDF-autotable) are vendored locally in `/Frontend/js/vendor/`.
- Typography relies on local operating system font stacks with seamless system fallbacks (`/Frontend/css/fonts.css`), removing all blocking network calls to remote font servers.
- The service worker (`/Frontend/sw.js`) pre-caches the complete application shell and all local vendor scripts on first launch.

### 3.2 Master Read Data Caching
- When online, calls to `/api/sync` and `/api/members` automatically populate IndexedDB stores (`read_cache` and master collections: `master_chapters`, `master_members`, `master_events`, `master_reports`).
- When network connectivity is absent, the system detects offline status instantly and serves the cached datasets into the view layer.
- An amber status pill (`Offline Mode - Showing Cached Data`) renders at the top of the interface with hardware safe-area accommodation.

### 3.3 Outbox Queue and Resilient Replay
- When offline, mutation requests (`POST`, `PATCH`, `DELETE` to `/api/participants`, `/api/reports`, etc.) are captured before dispatch.
- Mutations receive a collision-resistant UUID and are stored in the IndexedDB `mutation_queue` with status `pending`.
- Optimistic updates immediately update local state and tables so the user experience remains responsive.
- Once connectivity is restored (via browser events or Capacitor hardware Network change listeners), the `sync-manager.js` processes the queue sequentially (FIFO order).
- Requests include `X-Idempotency-Key` headers to guarantee deduplication on the server.

### 3.4 Conflict Resolution Protocol
1. **HTTP 409 Conflicts**: If a server conflict occurs (for instance, duplicate attendance marked by another leader concurrently), the mutation is tagged as `status: conflict` without blocking subsequent queue items.
2. **Exponential Backoff**: If network requests fail due to timeouts or temporary 5xx errors, retries are scheduled with exponential backoff:
   - Initial delay: 1500ms
   - Subsequent retries: 3000ms, 6000ms, 12000ms, up to a maximum cap of 30000ms with random jitter.
3. **Entity ID Reconciliation**: Temporary client-side identifiers are automatically reconciled with canonical server database IDs once the server acknowledges receipt.

---

## 4. Manual Resynchronization and Testing

Leaders can trigger an immediate outbox flush and dataset refresh at any point:
- **Automatic Trigger**: Reconnecting to Wi-Fi or cellular networks automatically starts processing within 600ms.
- **Manual Web Console Trigger**:
  ```javascript
  // Trigger outbox replay immediately
  window.syncManager.processOutbox({ manual: true });

  // Check queue depth
  window.offlineStore.countPendingMutations().then(count => console.log('Pending mutations:', count));

  // Pull fresh cloud data
  window.refreshAllCloudData({ render: true });
  ```

---

## 5. Native Platform Packaging Steps

### 5.1 Android Package Generation
```bash
# 1. Synchronize web assets
npm run mobile:sync

# 2. Build release APK or Android App Bundle (.aab)
cd android
./gradlew assembleRelease
# Output: android/app/build/outputs/apk/release/app-release-unsigned.apk
```

### 5.2 iOS Package Generation
```bash
# 1. Synchronize web assets
npm run mobile:sync

# 2. Open project in Xcode
npm run mobile:ios
# In Xcode: Select "Any iOS Device" -> Product -> Archive -> Distribute App
```

### 5.3 Desktop Installer Generation
```bash
# Build production installers (Windows .exe and .msi, macOS .dmg)
npm run desktop:build
# Output: src-tauri/target/release/bundle/
```
