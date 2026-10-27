import React, { createContext, useContext, useState, useEffect } from 'react';
import { platform } from '../services/platform';

const PlatformContext = createContext({
  isDesktop: true,
  isMobile: false,
  isNative: false,
  platformName: 'web',
  deviceType: 'desktop',
  windowControls: null
});

export function PlatformProvider({ children }) {
  const [deviceType, setDeviceType] = useState(() => {
    if (typeof window === 'undefined') return 'desktop';
    if (platform.isCapacitor) return 'mobile';
    if (platform.isDesktop) return 'desktop';
    return window.innerWidth <= 768 ? 'mobile' : 'desktop';
  });

  useEffect(() => {
    const updateDeviceType = () => {
      let currentType;
      if (platform.isCapacitor) {
        currentType = 'mobile';
      } else if (platform.isDesktop) {
        currentType = 'desktop';
      } else {
        currentType = window.innerWidth <= 768 ? 'mobile' : 'desktop';
      }

      setDeviceType(currentType);

      // Reflect on root element for high-performance CSS attribute selectors
      document.documentElement.setAttribute('data-device', currentType);
      document.documentElement.setAttribute('data-platform', platform.platformName);
    };

    updateDeviceType();
    window.addEventListener('resize', updateDeviceType);
    return () => window.removeEventListener('resize', updateDeviceType);
  }, []);

  const windowControls = {
    minimize: () => {
      if (window.MFCDesktop?.minimize) {
        window.MFCDesktop.minimize();
      }
    },
    maximize: () => {
      if (window.MFCDesktop?.maximize) {
        window.MFCDesktop.maximize();
      }
    },
    close: () => {
      if (window.MFCDesktop?.close) {
        window.MFCDesktop.close();
      }
    }
  };

  const isDesktop = deviceType === 'desktop';
  const isMobile = deviceType === 'mobile';

  return (
    <PlatformContext.Provider
      value={{
        isDesktop,
        isMobile,
        isNative: platform.isNative,
        platformName: platform.platformName,
        deviceType,
        windowControls
      }}
    >
      {children}
    </PlatformContext.Provider>
  );
}

export function usePlatform() {
  return useContext(PlatformContext);
}
