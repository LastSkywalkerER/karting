import { useSyncStatus } from '../hooks/useSyncStatus';

export function SyncStatusIndicator() {
  const { status, isOnline, isOffline, isSyncing } = useSyncStatus();

  const getStatusColor = () => {
    if (isOnline) return 'bg-emerald-500';
    if (isSyncing) return 'bg-amber-500 animate-pulse';
    return 'bg-red-500';
  };

  const getStatusText = () => {
    if (isOnline) return 'Online';
    if (isSyncing) return 'Syncing...';
    return 'Offline';
  };

  const getStatusIcon = () => {
    if (isOnline) {
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      );
    }
    if (isSyncing) {
      return (
        <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      );
    }
    // Offline
    return (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" />
      </svg>
    );
  };

  return (
    <div
      className={`
        fixed bottom-4 right-4 z-50
        flex items-center gap-2 px-3 py-2
        rounded-full shadow-lg
        text-white text-sm font-medium
        transition-all duration-300
        ${getStatusColor()}
        ${isOffline ? 'ring-2 ring-red-300 ring-opacity-50' : ''}
      `}
      title={`Connection status: ${status}`}
    >
      {getStatusIcon()}
      <span>{getStatusText()}</span>
    </div>
  );
}
