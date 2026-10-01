# MFC Youth Area Management System - React Native (Expo) Mobile App

This plan outlines the architecture and phased approach for replacing the previous Capacitor wrappers with a production-grade **React Native (Expo)** mobile application. This new mobile application will live in the `mobile/` directory, while the web and Tauri desktop apps remain powered by the `Frontend/` codebase.

## Goal Description
Build a robust, offline-capable mobile app for iOS and Android using Expo (React Native), TypeScript, and Expo Router. The app will interface with the existing Supabase backend, handle offline-first mutation queuing for camp/retreat environments, provide role-based access, and feature a native UI strictly adhering to the MFC Youth design system.

## Proposed Changes

### Phase 0: Capacitor Teardown & Expo Initialization
- **[DELETE]** `android/` and `ios/` folders (Capacitor generated native projects).
- **[DELETE]** `capacitor.config.ts`.
- **[MODIFY]** Root `package.json` to remove Capacitor dependencies and CLI scripts.
- **[NEW]** `mobile/` directory containing a fresh Expo TypeScript project (`npx create-expo-app`).

### Phase 1: Architecture, Sync Setup, & Theming
- **[NEW]** `mobile/src/constants/Colors.ts`: Exact MFC color tokens (Primary Navy `#002847`, Accent Blue `#0878bd`, etc.).
- **[NEW]** `mobile/src/lib/supabase.ts`: Supabase client initialized with `expo-secure-store` for encrypted offline JWT persistence.
- **[NEW]** `mobile/src/lib/syncQueue.ts`: Background mutation queue utilizing `@react-native-async-storage/async-storage` and `@tanstack/react-query` to handle offline mode for check-ins and GIG contributions.
- **[NEW]** `mobile/src/components/SyncIndicator.tsx`: Floating UI pill showing "Online", "Syncing...", or "Offline (X pending)".

### Phase 2: Authentication & Role Guard
- **[NEW]** `mobile/src/app/(auth)/login.tsx`: Supabase JWT login with FaceID/Fingerprint integration (`expo-local-authentication`).
- **[NEW]** `mobile/src/providers/AuthProvider.tsx`: React context for managing user session, resolving role claims from Supabase, and routing to the appropriate dashboard (Area vs Chapter vs Member).
- **[NEW]** `mobile/src/app/_layout.tsx`: Root layout with Expo Router protecting `(app)` routes from unauthenticated access.

### Phase 3: Directory & Event QR Check-In
- **[NEW]** `mobile/src/app/(app)/(tabs)/directory.tsx`: Searchable pastoral directory (MFC Kids, Youth, Campus, LIT) with quick-action dialer/SMS links.
- **[NEW]** `mobile/src/app/(app)/(tabs)/events.tsx`: Upcoming events feed.
- **[NEW]** `mobile/src/app/(app)/events/[id]/scan.tsx`: Camera-based QR code scanner (`expo-camera`) for Servant Leaders to quickly check-in participants and resolve fee payments offline.

### Phase 4: Reports, GIG, & Daily Resources
- **[NEW]** `mobile/src/app/(app)/(tabs)/gig.tsx`: Log God Is Generous stewardship and community service hours.
- **[NEW]** `mobile/src/app/(app)/(tabs)/reports.tsx`: Submit chapter activity reports, utilizing `expo-image-picker` for attaching receipts or photos.
- **[NEW]** `mobile/src/app/(app)/(tabs)/readings.tsx`: Daily spiritual readings cached for offline viewing.

## User Review Required
> [!IMPORTANT]
> **Data synchronization model:** We will use `@tanstack/react-query` for downstream caching and a custom Async Storage queue for upstream mutations. Is this acceptable, or would you prefer a local database like SQLite / WatermelonDB for more complex offline querying?

## Verification Plan

### Automated Tests
- Run `tsc` to verify TypeScript typings and interfaces match Supabase schema expectations.
- Run `npx expo export` to verify the Expo app builds successfully for production distribution.

### Manual Verification
- **Auth:** Log in with a test account. Force close and reopen app to verify biometric unlock prompt and session persistence.
- **Offline Sync:** Turn off Wi-Fi/Cellular on the emulator/device, perform an event check-in via QR scan. Verify the "Syncing..." banner shows queued items. Turn Wi-Fi back on and verify the mutation flushes to Supabase.
- **UI/UX:** Ensure bottom tab navigation works seamlessly, safe areas are respected on notched devices, and skeleton loaders display smoothly during async fetches.
