import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useOffline } from '../../context/OfflineContext';
import { useTheme } from '../../context/ThemeContext';
import { SunIcon, MoonIcon, SyncIcon, WifiOffIcon, LogoutIcon } from '../icons/Icons';

export function Navbar({ title, onOpenAreaSelector, canSelectArea = false }) {
  const { areaName, logout } = useAuth();
  const { isOnline, pendingCount, isSyncing, setIsSyncModalOpen } = useOffline();
  const { isDark, toggleTheme } = useTheme();

  return (
    <header className="topbar">
      <div className="topbar-left">
        <h1 style={{ fontSize: '1.25rem', fontWeight: 600 }}>{title}</h1>

        {areaName && (
          <span
            className="badge badge-info"
            style={{ cursor: canSelectArea ? 'pointer' : 'default' }}
            onClick={canSelectArea ? onOpenAreaSelector : undefined}
            title={canSelectArea ? 'Click to switch active area' : 'Assigned Area'}
          >
            {areaName} {canSelectArea ? '▾' : ''}
          </span>
        )}
      </div>

      <div className="topbar-right">
        {/* Offline / Sync Center Status Pill */}
        <button
          type="button"
          onClick={() => setIsSyncModalOpen(true)}
          className="btn btn-secondary btn-sm"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.8rem',
            padding: '5px 10px',
            minHeight: '36px'
          }}
          title={isOnline ? 'Online - All records synced' : 'Offline - Using cached data'}
          aria-label="Open Sync and Outbox Center"
        >
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: isOnline ? 'var(--color-success)' : 'var(--color-warning)',
              display: 'inline-block'
            }}
          />
          <span style={{ display: 'none', minWidth: '40px' }} className="status-text">
            {isOnline ? 'Online' : 'Offline'}
          </span>
          {pendingCount > 0 ? (
            <span
              style={{
                backgroundColor: 'var(--color-warning)',
                color: '#ffffff',
                borderRadius: '10px',
                padding: '1px 6px',
                fontSize: '0.72rem',
                fontWeight: 700
              }}
            >
              {pendingCount}
            </span>
          ) : (
            <SyncIcon size={14} spinning={isSyncing} />
          )}
        </button>

        {/* Theme Toggle (Light / Dark) */}
        <button
          type="button"
          onClick={toggleTheme}
          className="btn btn-secondary btn-icon"
          style={{ width: '38px', height: '38px' }}
          aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDark ? <SunIcon size={18} /> : <MoonIcon size={18} />}
        </button>

        {/* Mobile Sign out button */}
        <button
          type="button"
          onClick={logout}
          className="btn btn-secondary btn-icon mobile-only-btn"
          style={{ width: '38px', height: '38px' }}
          aria-label="Sign Out"
          title="Sign Out"
        >
          <LogoutIcon size={18} />
        </button>
      </div>
    </header>
  );
}
