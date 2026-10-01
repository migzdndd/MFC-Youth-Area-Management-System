/**
 * MFC Youth Area Management System - Native Platform Bridge
 * Bridges Capacitor (Android/iOS), Tauri (Desktop), Electron (Desktop), and Web.
 */

import { syncManager } from './syncManager';

export const platform = {
  isCapacitor: typeof window !== 'undefined' && !!window.Capacitor?.isNativePlatform?.(),
  isTauri: typeof window !== 'undefined' && (!!window.__TAURI__ || !!window.__TAURI_INTERNALS__),
  isElectron: typeof window !== 'undefined' && (!!window.MFCDesktop?.isElectron || !!window.process?.versions?.electron),

  get isNative() {
    return this.isCapacitor || this.isTauri || this.isElectron;
  },

  get isMobile() {
    return this.isCapacitor;
  },

  get isDesktop() {
    return this.isTauri || this.isElectron;
  },

  get platformName() {
    if (this.isCapacitor) return window.Capacitor.getPlatform();
    if (this.isTauri) return 'tauri-desktop';
    if (this.isElectron) return 'electron-desktop';
    return 'web';
  },

  async init() {
    console.log(`[MFC Platform] Active platform: ${this.platformName}`);

    if (this.isCapacitor) {
      await this.initCapacitor();
    }
  },

  async initCapacitor() {
    const { Plugins } = window.Capacitor || {};
    const { StatusBar, SplashScreen, Network } = Plugins || {};

    // Configure native status bar
    if (StatusBar) {
      try {
        await StatusBar.setStyle({ style: 'DARK' });
        await StatusBar.setBackgroundColor({ color: '#002847' });
      } catch (e) {
        console.warn('[Platform] StatusBar styling skipped:', e);
      }
    }

    // Hide splash screen smoothly
    if (SplashScreen) {
      setTimeout(async () => {
        try {
          await SplashScreen.hide();
        } catch (e) {
          console.warn('[Platform] SplashScreen hide skipped:', e);
        }
      }, 1000);
    }

    // Network status listener
    if (Network) {
      try {
        Network.addListener('networkStatusChange', (status) => {
          console.log('[Platform] Native network status changed:', status.connected);
          if (status.connected) {
            window.dispatchEvent(new Event('online'));
            syncManager.scheduleSync(600);
          } else {
            window.dispatchEvent(new Event('offline'));
          }
        });
      } catch (e) {
        console.warn('[Platform] Network listener skipped:', e);
      }
    }
  }
};
