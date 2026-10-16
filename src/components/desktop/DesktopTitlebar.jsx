import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { usePlatform } from '../../context/PlatformContext';
import { useOffline } from '../../context/OfflineContext';
import { 
  Minus, 
  Square, 
  X, 
  Maximize2, 
  Search, 
  MapPin, 
  Wifi, 
  WifiOff, 
  RefreshCw,
  Monitor
} from 'lucide-react';

export function DesktopTitlebar({ onOpenSearch, onOpenAreaSelector, canSelectArea }) {
  const { areaName } = useAuth();
  const { windowControls, platformName } = usePlatform();
  const { isOnline, isSyncing, pendingCount } = useOffline();

  const isNativeDesktop = platformName === 'electron-desktop' || platformName === 'tauri-desktop';

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <header className="desktop-titlebar" aria-label="Desktop Titlebar">
      {/* Left: Window Branding & Drag Handle */}
      <div className="titlebar-section titlebar-left">
        <div className="titlebar-brand">
          <img src="/logo.png" alt="MFC Youth" className="titlebar-logo" />
          <span className="titlebar-title">MFC Youth AMS</span>
          <span className="titlebar-badge">
            <Monitor size={11} style={{ marginRight: 4 }} /> Desktop
          </span>
        </div>
      </div>

      {/* Center: Command Palette / Global Search & Quick Area Switcher */}
      <div className="titlebar-section titlebar-center">
        <button
          type="button"
          className="titlebar-search-trigger"
          onClick={onOpenSearch}
          title="Search or jump to route (Ctrl+K)"
        >
          <Search size={14} className="search-icon" />
          <span>Quick search or jump to...</span>
          <kbd className="titlebar-kbd">Ctrl K</kbd>
        </button>

        {areaName && (
          <button
            type="button"
            className="titlebar-area-chip"
            onClick={canSelectArea ? onOpenAreaSelector : undefined}
            disabled={!canSelectArea}
            title={canSelectArea ? "Click to switch active area" : `Active Area: ${areaName}`}
          >
            <MapPin size={13} className="area-icon" />
            <span className="area-name">{areaName}</span>
          </button>
        )}
      </div>

      {/* Right: Sync Status & Native Window Buttons */}
      <div className="titlebar-section titlebar-right">
        {/* Sync Status Badge */}
        <div 
          className={`titlebar-status ${isOnline ? 'online' : 'offline'}`}
          title={isOnline ? (isSyncing ? 'Syncing with Supabase...' : 'Connected to Supabase') : `${pendingCount || 0} changes waiting to sync`}
        >
          {isSyncing ? (
            <RefreshCw size={12} className="spin-icon" />
          ) : isOnline ? (
            <Wifi size={12} />
          ) : (
            <WifiOff size={12} />
          )}
          <span>{isSyncing ? 'Syncing' : isOnline ? 'Online' : 'Offline Cache'}</span>
        </div>

        {/* Fullscreen Toggle */}
        <button
          type="button"
          className="titlebar-action-btn"
          onClick={handleToggleFullscreen}
          title="Toggle Fullscreen"
        >
          <Maximize2 size={13} />
        </button>

        {/* Native Window Controls (for Electron & Tauri) */}
        {isNativeDesktop && (
          <div className="window-controls">
            <button
              type="button"
              className="window-control-btn btn-minimize"
              onClick={windowControls.minimize}
              title="Minimize"
              aria-label="Minimize Window"
            >
              <Minus size={13} />
            </button>
            <button
              type="button"
              className="window-control-btn btn-maximize"
              onClick={windowControls.maximize}
              title="Maximize"
              aria-label="Maximize Window"
            >
              <Square size={11} />
            </button>
            <button
              type="button"
              className="window-control-btn btn-close"
              onClick={windowControls.close}
              title="Close"
              aria-label="Close Window"
            >
              <X size={13} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
