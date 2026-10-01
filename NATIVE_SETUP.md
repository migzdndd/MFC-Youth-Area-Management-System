# MFC Youth Area Management System - Native Cross-Platform Setup & Maintenance Guide

This document provides complete, step-by-step instructions for wrapping the **MFC Youth Area Management System** web application into native mobile apps (Android & iOS via **Capacitor 6**) and native desktop apps (Windows, macOS, & Linux via **Tauri 2**) without modifying or rewriting the underlying web frontend and backend logic.

---

## 1. Prerequisites & Environment Setup

Ensure all required tools and runtime environments are installed on your system before proceeding.

### Required Software & Version Matrix

| Tool / Runtime | Minimum Version | Required For | Verification Command |
| :--- | :--- | :--- | :--- |
| **Node.js** | `18.x` or higher (`20.x` LTS recommended) | Web build & CLI tools | `node -v` |
| **npm** | `9.x` or higher (`10.x` recommended) | Package management | `npm -v` |
| **Rust** | `1.75.0` or higher | Tauri 2 Desktop Compiler | `rustc --version` & `cargo --version` |
| **MSVC C++ Build Tools** | Visual Studio 2022 Build Tools | Windows Desktop Packaging | Installed via Visual Studio Installer |
| **WebView2** | System default on Win 10/11 | Desktop Web Execution | Automatic on Windows 10/11 |
| **Android Studio** | Jellyfish / Koala (2024+) | Android Mobile Target | `adb --version` |
| **Java JDK** | OpenJDK / Temurin JDK 17 | Android Gradle Build | `java -version` |
| **Xcode** *(macOS only)* | `15.0` or higher | iOS Mobile Target | `xcode-select -v` |
| **CocoaPods** *(macOS only)* | `1.13.0` or higher | iOS Dependencies | `pod --version` |
| **serve** | `14.0.0` or higher | Local Web Development | `serve --version` |

---

### Step 1 — Verify Node.js and npm
Open Windows PowerShell and check your current Node.js and npm versions:

```powershell
node -v
npm -v
```

- **If Node.js is not installed or version is below 18.x**:
  1. Download the official Node.js LTS installer from [https://nodejs.org/](https://nodejs.org/).
  2. Run the `.msi` installer, accept default settings, and ensure **"Add to PATH"** is selected.
  3. Close and reopen PowerShell, then re-run `node -v` and `npm -v` to confirm.

---

### Step 2 — Install Rust (Required for Tauri 2)
Tauri's core runtime and native bindings are written in Rust.

1. Download `rustup-init.exe` from [https://rustup.rs/](https://rustup.rs/).
2. Open PowerShell and execute the installer:
   ```powershell
   .\rustup-init.exe -y
   ```
3. Restart your PowerShell terminal and verify installation:
   ```powershell
   rustc --version
   cargo --version
   ```
4. *Path Troubleshooting*: If `cargo` is not recognized, manually append `$env:USERPROFILE\.cargo\bin` to your system Environment Variables.

---

### Step 3 — Install Tauri Prerequisites on Windows
Tauri requires Microsoft C++ Build Tools and the Tauri CLI.

1. **Install MSVC C++ Build Tools**:
   - Download Visual Studio Build Tools from [https://visualstudio.microsoft.com/visual-cpp-build-tools/](https://visualstudio.microsoft.com/visual-cpp-build-tools/).
   - In the Visual Studio Installer, select **"Desktop development with C++"** (includes MSVC v143, Windows 10/11 SDK, and C++ CMake tools).
   - Click **Install** and reboot your system if requested.

2. **Verify WebView2 Runtime**:
   - WebView2 ships out-of-the-box on Windows 10 and 11.
   - Verify registry key presence in PowerShell:
     ```powershell
     Get-ItemProperty -Path 'HKLM:\SOFTWARE\WOW6432Node\Microsoft\EdgeUpdate\Clients\{F3017226-6E5D-4A2E-A720-302E96191D50}' -ErrorAction SilentlyContinue
     ```

3. **Install Tauri CLI**:
   ```powershell
   cargo install tauri-cli --version "^2.0.0"
   ```
   Verify installation:
   ```powershell
   cargo tauri --version
   ```

---

### Step 4 — Install Android Studio & Android SDK
Required for compiling and debugging the Android mobile app.

1. Download Android Studio from [https://developer.android.com/studio](https://developer.android.com/studio).
2. Run the installer and ensure the following components are selected:
   - **Android Studio**
   - **Android SDK**
   - **Android SDK Platform**
   - **Android Virtual Device (AVD)**
3. **Configure Environment Variables**:
   - Open Windows Settings -> System -> About -> Advanced system settings -> Environment Variables.
   - Under **System variables**, click **New**:
     - Variable Name: `ANDROID_HOME`
     - Variable Value: `C:\Users\<YourUsername>\AppData\Local\Android\Sdk`
   - Select the `Path` variable under System variables, click **Edit**, click **New**, and add:
     `%ANDROID_HOME%\platform-tools`
4. Open a new PowerShell terminal and verify `adb`:
   ```powershell
   adb --version
   ```

---

### Step 5 — Install Java JDK 17
Android Studio Gradle builds require Java Development Kit 17.

1. Download Eclipse Adoptium Temurin JDK 17 `.msi` from [https://adoptium.net/](https://adoptium.net/).
2. Install with default options, making sure **"Set JAVA_HOME variable"** is checked.
3. Verify in PowerShell:
   ```powershell
   java -version
   ```
   *Expected Output*: `openjdk version "17.0.x"`

---

### Step 6 — Install Xcode (iOS — macOS Only)
*Note: iOS builds require macOS. Skip this step if operating strictly on Windows.*

1. Install Xcode from the Mac App Store.
2. Install command line tools:
   ```bash
   xcode-select --install
   ```
3. Install CocoaPods:
   ```bash
   sudo gem install cocoapods
   pod --version
   ```

---

### Step 7 — Install Local Static Server (`serve`)
Used for serving the `Frontend/` static assets during local development and testing.

```powershell
npm install -g serve
serve --version
```

---

## 2. First-Time Project Setup Sequence

Follow these exact steps sequentially on a fresh machine checkout:

```powershell
# 1. Clone repository & navigate to root directory
cd "D:\data\Github Repositories\MFC-Youth-AMS-App"

# 2. Install Node dependencies
npm install

# 3. Sync mobile platform assets
npm run sync:mobile

# 4. Launch web dev server (Terminal 1)
npm run dev:web

# 5. Launch Tauri desktop dev app (Terminal 2)
npm run dev:desktop
```

---

## 3. How to Run Each Target Locally

### Running Web Application
```powershell
npm run dev:web
```
- Opens local server at `http://localhost:5500`.

### Running Android App in Emulator
```powershell
# Sync latest frontend changes to Android assets
npx cap sync android

# Open project in Android Studio
npx cap open android
```
- In Android Studio: Select target virtual device (e.g. Pixel 7 API 34) and click **Run (Shift + F10)**.

### Running Desktop App (Tauri 2)
```powershell
# Ensure serve dev server is active on port 5500, then run:
npm run dev:desktop
```

### Running iOS App (macOS Only)
```bash
npx cap sync ios
npx cap open ios
```
- Select Simulator in Xcode and press **Cmd + R**.

---

## 4. Building Release Binaries

### Building Windows Desktop Binary (`.exe` / `.msi`)
```powershell
npm run build:desktop
```
- **Output Artifacts**:
  - `src-tauri/target/release/bundle/nsis/MFC Youth AMS_1.0.1_x64-setup.exe`
  - `src-tauri/target/release/bundle/msi/MFC Youth AMS_1.0.1_x64_en-US.msi`

### Building Android Release APK / AAB
```powershell
# Sync frontend assets
npx cap sync android

# Build release bundle
npx cap build android
```
- **APK Output Location**:
  `android/app/build/outputs/apk/release/app-release-unsigned.apk`

---

## 5. Synchronizing Frontend Changes to Mobile & Desktop

Whenever you update HTML, CSS, or JS files in `Frontend/`:

1. **Desktop App**: Automatically reflects changes when running `npm run dev:desktop` or rebuilding via `npm run build:desktop`.
2. **Mobile Apps (Capacitor)**: Must run `sync` command to copy updated web assets into native platform assets:

```powershell
npm run sync:mobile
```

---

## 6. Updating Version Numbers Across All Platforms

When releasing a new version (e.g., `1.0.2`):

1. **Update `package.json`**:
   ```json
   "version": "1.0.2"
   ```
2. **Update `capacitor.config.ts`**: Keep synchronized with package version.
3. **Update `android/app/build.gradle`**:
   ```groovy
   defaultConfig {
       versionCode 2
       versionName "1.0.2"
   }
   ```
4. **Update `src-tauri/tauri.conf.json`**:
   ```json
   "version": "1.0.2"
   ```
5. **Update `src-tauri/Cargo.toml`**:
   ```toml
   version = "1.0.2"
   ```

---

## 7. Troubleshooting Common Errors

### Error 1: Port 5500 Already in Use
*Symptom*: `Error: listen EADDRINUSE: already in use :::5500`
*Fix*: Kill process occupying port 5500 in PowerShell:
```powershell
Stop-Process -Id (Get-NetTCPConnection -LocalPort 5500).OwningProcess -Force
```

### Error 2: `ANDROID_HOME` Environment Variable Not Found
*Symptom*: `[error] ANDROID_HOME environment variable is not set.`
*Fix*: Set environment variable for current session or permanently in System Properties:
```powershell
$env:ANDROID_HOME = "C:\Users\$env:USERNAME\AppData\Local\Android\Sdk"
```

### Error 3: WebView2 Runtime Missing
*Symptom*: Tauri window fails to launch or displays a blank frame on older Windows machines.
*Fix*: Download and run WebView2 Evergreen Standalone Installer from [Microsoft Edge Developer Portal](https://developer.microsoft.com/en-us/microsoft-edge/webview2/).

### Error 4: Rust MSVC Linker `link.exe` Not Found
*Symptom*: `error: linker link.exe not found` during `cargo build`.
*Fix*: Install **Desktop development with C++** in Visual Studio Build Tools installer.

### Error 5: Java Version Mismatch in Gradle Build
*Symptom*: `Unsupported class file major version` or Java execution failure in Android Studio.
*Fix*: Go to Android Studio -> Settings -> Build, Execution, Deployment -> Build Tools -> Gradle -> Set **Gradle JDK** to JDK 17.

### Error 6: CocoaPods `pod` Command Not Found (macOS)
*Symptom*: `[error] CocoaPods is not installed.`
*Fix*: Install CocoaPods via Gem: `sudo gem install cocoapods`.

### Error 7: Push Notifications Permission Denied
*Symptom*: Push token registration fails silently.
*Fix*: Ensure `google-services.json` is placed in `android/app/google-services.json` and push notification permissions are explicitly granted in OS device settings.

### Error 8: Deep Link Navigation Fails
*Symptom*: Clicking `com.mfcyouth.ams://` links does not open app.
*Fix*: Ensure `<intent-filter>` is correctly placed inside `.MainActivity` block in `android/app/src/main/AndroidManifest.xml`.

### Error 9: `npx cap sync` Fails due to Missing `Frontend/` Directory
*Symptom*: `[error] webDir does not exist: Frontend`
*Fix*: Ensure directory structure maintains `Frontend/` folder at project root.

### Error 10: Tauri Tray Icon Missing or Crashes Startup
*Symptom*: Native tray initialization error in `main.rs`.
*Fix*: Verify icon paths in `src-tauri/tauri.conf.json` match generated icon assets under `src-tauri/icons/`.
