import { useSyncContext } from '../context/SyncContext';
import type { SyncStatus } from '../services/SyncManager';

export interface UseSyncStatusResult {
  status: SyncStatus;
  isOnline: boolean;
  isOffline: boolean;
  isSyncing: boolean;
  triggerSync: () => Promise<boolean>;
}

export function useSyncStatus(): UseSyncStatusResult {
  const { status, triggerSync } = useSyncContext();

  return {
    status,
    isOnline: status === 'online',
    isOffline: status === 'offline',
    isSyncing: status === 'syncing',
    triggerSync,
  };
}
