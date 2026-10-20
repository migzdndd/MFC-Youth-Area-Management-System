import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useOffline } from '../../context/OfflineContext';
import { MapPin, Wifi, WifiOff, RefreshCw, QrCode, Menu } from 'lucide-react';

export function MobileHeader({ onOpenAreaSelector, canSelectArea, onOpenScanner, onOpenDrawer }) {
  const { areaName } = useAuth();
  const { isOnline, isSyncing, pendingCount } = useOffline();

  return (
    <header className="mobile-native-header" aria-label="Mobile Navigation Header">
      <div className="mobile-header-content">
        {/* Left: App Identity & Navigation Drawer Trigger */}
        <div className="mobile-header-brand">
          {onOpenDrawer && (
            <button
              type="button"
              className="mobile-header-menu-btn"
              onClick={onOpenDrawer}
              aria-label="Open Navigation Menu"
              title="Open Navigation Menu"
            >
              <Menu size={20} />
            </button>
          )}
          <img src="/logo.png" alt="MFC Youth" className="mobile-header-logo" />
          <div className="mobile-brand-meta">
            <span className="mobile-brand-name">MFC Youth</span>
            {areaName && (
              <button
                type="button"
                className="mobile-area-chip"
                onClick={canSelectArea ? onOpenAreaSelector : undefined}
                disabled={!canSelectArea}
              >
                <MapPin size={11} />
                <span>{areaName}</span>
              </button>
            )}
          </div>
        </div>

        {/* Right: Quick QR Scanner & Sync Status */}
        <div className="mobile-header-actions">
          {onOpenScanner && (
            <button
              type="button"
              className="mobile-header-btn"
              onClick={onOpenScanner}
              title="Fast Attendance Scanner"
              aria-label="Open QR Scanner"
            >
              <QrCode size={18} />
            </button>
          )}

          <div
            className={`mobile-sync-chip ${isOnline ? 'online' : 'offline'}`}
            title={isOnline ? (isSyncing ? 'Syncing...' : 'Connected') : `${pendingCount || 0} pending changes`}
          >
            {isSyncing ? (
              <RefreshCw size={12} className="spin-icon" />
            ) : isOnline ? (
              <Wifi size={12} />
            ) : (
              <WifiOff size={12} />
            )}
            {!isOnline && pendingCount > 0 && (
              <span className="mobile-queue-count">{pendingCount}</span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
