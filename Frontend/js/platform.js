/**
 * MFC Youth AMS - Native Platform Integration Adapter
 * Native capabilities for Capacitor (Android/iOS) and Tauri 2 (Desktop).
 */

(function () {
  const isCapacitor = window.Capacitor !== undefined && window.Capacitor.isNativePlatform();
  const isTauri = window.__TAURI__ !== undefined || window.__TAURI_INTERNALS__ !== undefined;

  window.MFCPlatform = {
    isNative: isCapacitor || isTauri,
    isCapacitor: isCapacitor,
    isTauri: isTauri,
    isMobile: isCapacitor,
    isDesktop: isTauri,
    platformName: isCapacitor ? window.Capacitor.getPlatform() : (isTauri ? 'desktop' : 'web'),

    async init() {
      console.log(`[MFC Platform] Initializing on platform: ${this.platformName}`);

      if (this.isCapacitor) {
        await this.initCapacitor();
      } else if (this.isTauri) {
        await this.initTauri();
      } else {
        this.initWebNetworkListener();
      }
    },

    async initCapacitor() {
      const { Plugins } = window.Capacitor;
      const { Network, SplashScreen, StatusBar, PushNotifications } = Plugins || {};

      // 1. Network status listener
      if (window.Capacitor.isPluginAvailable('Network')) {
        const status = await Network.getStatus();
        this.updateOfflineStatus(!status.connected);

        Network.addListener('networkStatusChange', (status) => {
          console.log('[MFC Platform] Network connection changed:', status);
          this.updateOfflineStatus(!status.connected);
          if (status.connected) {
            window.dispatchEvent(new Event('online'));
            if (window.syncManager && typeof window.syncManager.scheduleProcess === 'function') {
              window.syncManager.scheduleProcess(600);
            }
          } else {
            window.dispatchEvent(new Event('offline'));
          }
        });
      }

      // 2. Configure native status bar
      if (window.Capacitor.isPluginAvailable('StatusBar')) {
        try {
          await StatusBar.setStyle({ style: 'DARK' });
          await StatusBar.setBackgroundColor({ color: '#002847' });
        } catch (e) {
          console.warn('[MFC Platform] StatusBar config skipped:', e);
        }
      }

      // 3. Hide splash screen after delay
      if (window.Capacitor.isPluginAvailable('SplashScreen')) {
        setTimeout(async () => {
          try {
            await SplashScreen.hide();
          } catch (e) {
            console.warn('[MFC Platform] SplashScreen hide error:', e);
          }
        }, 1500);
      }

      // 4. Firebase Push Notifications
      if (window.Capacitor.isPluginAvailable('PushNotifications')) {
        try {
          let permStatus = await PushNotifications.checkPermissions();
          if (permStatus.receive === 'prompt') {
            permStatus = await PushNotifications.requestPermissions();
          }
          if (permStatus.receive === 'granted') {
            await PushNotifications.register();
          }

          PushNotifications.addListener('registration', (token) => {
            console.log('[MFC Platform] FCM Registration Token:', token.value);
            localStorage.setItem('mfc_fcm_token', token.value);
          });

          PushNotifications.addListener('pushNotificationReceived', (notification) => {
            console.log('[MFC Platform] Push notification received:', notification);
            if (window.showToast) {
              window.showToast(notification.title || 'Notification', notification.body || '');
            }
          });
        } catch (e) {
          console.warn('[MFC Platform] Push notification initialization skipped:', e);
        }
      }
    },

    async initTauri() {
      console.log('[MFC Platform] Desktop Tauri bindings active.');
      this.initWebNetworkListener();
    },

    initWebNetworkListener() {
      this.updateOfflineStatus(!navigator.onLine);
      window.addEventListener('online', () => {
        this.updateOfflineStatus(false);
        if (window.syncManager && typeof window.syncManager.scheduleProcess === 'function') {
          window.syncManager.scheduleProcess(600);
        }
      });
      window.addEventListener('offline', () => this.updateOfflineStatus(true));
    },

    updateOfflineStatus(isOffline) {
      if (isOffline) {
        document.body.classList.add('offline');
      } else {
        document.body.classList.remove('offline');
      }

      let pill = document.getElementById('mfc-offline-pill');
      if (isOffline) {
        if (!pill) {
          pill = document.createElement('div');
          pill.id = 'mfc-offline-pill';
          pill.className = 'mfc-offline-pill';
          pill.setAttribute('role', 'status');
          pill.setAttribute('aria-live', 'polite');
          pill.innerHTML = '<span class="mfc-offline-dot" aria-hidden="true"></span><span class="mfc-offline-pill-text">Offline Mode - Showing Cached Data</span>';
          document.body.appendChild(pill);
        }
      } else if (pill) {
        pill.remove();
      }
    }
  };

  document.addEventListener('DOMContentLoaded', () => {
    window.MFCPlatform.init();
  });
})();
