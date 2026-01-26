import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { syncManager, type SyncStatus } from '../services/SyncManager';

interface SyncContextValue {
  status: SyncStatus;
  triggerSync: () => Promise<boolean>;
}

const SyncContext = createContext<SyncContextValue | null>(null);

export function SyncProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<SyncStatus>(syncManager.getStatus());

  useEffect(() => {
    // Subscribe to status changes
    const unsubscribe = syncManager.onStatusChange(setStatus);

    // Start the sync manager
    syncManager.start();

    return () => {
      unsubscribe();
      syncManager.stop();
    };
  }, []);

  const triggerSync = useCallback(async () => {
    return syncManager.triggerSync();
  }, []);

  return (
    <SyncContext.Provider value={{ status, triggerSync }}>
      {children}
    </SyncContext.Provider>
  );
}

export function useSyncContext(): SyncContextValue {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error('useSyncContext must be used within a SyncProvider');
  }
  return context;
}
