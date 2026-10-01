import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { offlineStore } from '../services/offlineStore';
import { syncManager } from '../services/syncManager';

const OfflineContext = createContext();

export function OfflineProvider({ children }) {
  const [isOnline, setIsOnline] = useState(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState(null);

  const refreshPendingCount = useCallback(async () => {
    try {
      const count = await offlineStore.getQueueCount();
      setPendingCount(count);
    } catch {
      setPendingCount(0);
    }
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      refreshPendingCount();
    };

    const handleOffline = () => {
      setIsOnline(false);
      refreshPendingCount();
    };

    const handleMutationQueued = () => {
      refreshPendingCount();
    };

    const handleMutationSynced = () => {
      refreshPendingCount();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('mfc:mutation-queued', handleMutationQueued);
    window.addEventListener('mfc:mutation-synced', handleMutationSynced);

    const unsubscribe = syncManager.subscribe((state) => {
      setIsSyncing(state.isSyncing);
      refreshPendingCount();
    });

    refreshPendingCount();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('mfc:mutation-queued', handleMutationQueued);
      window.removeEventListener('mfc:mutation-synced', handleMutationSynced);
      unsubscribe();
    };
  }, [refreshPendingCount]);

  const triggerSync = async () => {
    const res = await syncManager.syncNow();
    setLastSyncResult(res);
    await refreshPendingCount();
    return res;
  };

  return (
    <OfflineContext.Provider
      value={{
        isOnline,
        pendingCount,
        isSyncing,
        isSyncModalOpen,
        setIsSyncModalOpen,
        triggerSync,
        lastSyncResult,
        refreshPendingCount
      }}
    >
      {children}
    </OfflineContext.Provider>
  );
}

export function useOffline() {
  const context = useContext(OfflineContext);
  if (!context) throw new Error('useOffline must be used within OfflineProvider');
  return context;
}
