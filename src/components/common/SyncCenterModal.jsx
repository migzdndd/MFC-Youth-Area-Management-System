import React, { useState, useEffect } from 'react';
import { useOffline } from '../../context/OfflineContext';
import { offlineStore } from '../../services/offlineStore';
import { SyncIcon, CheckIcon, XIcon, WifiOffIcon, TrashIcon } from '../icons/Icons';

export function SyncCenterModal() {
  const {
    isSyncModalOpen,
    setIsSyncModalOpen,
    isOnline,
    isSyncing,
    triggerSync,
    pendingCount,
    refreshPendingCount
  } = useOffline();

  const [queue, setQueue] = useState([]);
  const [syncStatusMsg, setSyncStatusMsg] = useState('');

  useEffect(() => {
    if (isSyncModalOpen) {
      loadQueue();
    }
  }, [isSyncModalOpen]);

  const loadQueue = async () => {
    const items = await offlineStore.getPendingMutations();
    setQueue(items);
  };

  const handleSyncNow = async () => {
    setSyncStatusMsg('Starting outbox synchronization...');
    const res = await triggerSync();
    if (res.success) {
      setSyncStatusMsg(`Successfully synchronized ${res.syncedCount || 0} change(s).`);
    } else {
      setSyncStatusMsg(res.reason === 'offline' ? 'Device is offline. Connect to internet first.' : 'Some items could not be synced.');
    }
    await loadQueue();
  };

  const handleRemove = async (id) => {
    await offlineStore.removeMutation(id);
    await loadQueue();
    await refreshPendingCount();
  };

  if (!isSyncModalOpen) return null;

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sync-center-title"
      onClick={() => setIsSyncModalOpen(false)}
    >
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <SyncIcon size={22} spinning={isSyncing} />
            <h2 id="sync-center-title" style={{ fontSize: '1.15rem' }}>Offline & Sync Center</h2>
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-icon"
            onClick={() => setIsSyncModalOpen(false)}
            aria-label="Close dialog"
          >
            <XIcon size={18} />
          </button>
        </div>

        <div className="modal-body">
          {/* Status summary */}
          <div
            style={{
              padding: '14px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: isOnline ? 'var(--color-success-bg)' : 'var(--color-warning-bg)',
              color: isOnline ? 'var(--color-success)' : 'var(--color-warning)',
              border: `1px solid ${isOnline ? 'var(--color-success-border)' : 'var(--color-warning-border)'}`,
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {isOnline ? <CheckIcon size={18} /> : <WifiOffIcon size={18} />}
              <span style={{ fontWeight: 600 }}>
                {isOnline ? 'Network Connected' : 'Offline Mode Active'}
              </span>
            </div>
            <span style={{ fontSize: '0.85rem' }}>
              {queue.length} item{queue.length === 1 ? '' : 's'} in outbox
            </span>
          </div>

          {syncStatusMsg && (
            <p style={{ fontSize: '0.85rem', marginBottom: '12px', color: 'var(--text-main)' }}>
              {syncStatusMsg}
            </p>
          )}

          <h3 style={{ fontSize: '0.95rem', marginBottom: '10px', color: 'var(--text-main)' }}>
            Pending Offline Mutations
          </h3>

          {queue.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
              All changes are fully synced with the cloud database.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '280px', overflowY: 'auto' }}>
              {queue.map((item) => (
                <div
                  key={item.id}
                  style={{
                    padding: '10px 14px',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--bg-surface-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.85rem'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                      {item.method} {item.endpoint}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {new Date(item.timestamp).toLocaleTimeString()} - Status: {item.status}
                      {item.error ? ` (${item.error})` : ''}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemove(item.id)}
                    className="btn btn-secondary btn-icon"
                    style={{ width: '32px', height: '32px', padding: '4px' }}
                    title="Remove from queue"
                    aria-label={`Remove mutation for ${item.endpoint}`}
                  >
                    <TrashIcon size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setIsSyncModalOpen(false)}
          >
            Close
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSyncNow}
            disabled={!isOnline || isSyncing || queue.length === 0}
          >
            <SyncIcon size={16} spinning={isSyncing} />
            {isSyncing ? 'Syncing...' : 'Sync Now'}
          </button>
        </div>
      </div>
    </div>
  );
}
