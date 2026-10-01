import React from 'react';
import { useOffline } from '../../context/OfflineContext';
import { WifiOffIcon, SyncIcon } from '../icons/Icons';

export function OfflineBanner() {
  const { isOnline, pendingCount, isSyncing, setIsSyncModalOpen } = useOffline();

  if (isOnline && pendingCount === 0) return null;

  return (
    <div className="offline-banner" role="status" aria-live="polite">
      <div style={{ display: 'flex', alignContent: 'center', alignItems: 'center', gap: '8px' }}>
        {!isOnline ? <WifiOffIcon size={18} /> : <SyncIcon size={18} spinning={isSyncing} />}
        <span>
          {!isOnline
            ? 'Offline Mode. You are viewing cached area data.'
            : isSyncing
            ? 'Syncing offline changes with the server...'
            : `${pendingCount} offline change${pendingCount > 1 ? 's' : ''} ready to sync.`}
        </span>
      </div>

      <button
        type="button"
        onClick={() => setIsSyncModalOpen(true)}
        className="btn btn-secondary btn-sm"
        style={{ padding: '4px 10px', fontSize: '0.8rem', minHeight: '32px' }}
      >
        {pendingCount > 0 ? `Outbox (${pendingCount})` : 'Sync Details'}
      </button>
    </div>
  );
}
