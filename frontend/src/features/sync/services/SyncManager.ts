import { syncMetaRepository } from '../db/SyncMetaRepository';
import { teamRepository } from '../../teams/db/TeamRepository';
import { raceRepository } from '../../races/db/RaceRepository';
import { kartRepository } from '../../karts/db/KartRepository';
import { pitlaneConfigRepository } from '../../pitlane/db/PitlaneConfigRepository';
import { pitlaneCurrentRepository } from '../../pitlane/db/PitlaneCurrentRepository';
import { pitlaneHistoryRepository } from '../../pitlane/db/PitlaneHistoryRepository';
import type {
  TeamRecord,
  RaceRecord,
  RaceTeamRecord,
  KartRecord,
  PitlaneConfigRecord,
  PitlaneCurrentRecord,
  PitlaneHistoryRecord,
} from '@/shared/db/database';

export type SyncStatus = 'online' | 'offline' | 'syncing';

export interface SyncChanges {
  teams: TeamRecord[];
  races: RaceRecord[];
  race_teams: RaceTeamRecord[];
  karts: KartRecord[];
  pitlane_configs: PitlaneConfigRecord[];
  pitlane_current: PitlaneCurrentRecord[];
  pitlane_history: PitlaneHistoryRecord[];
}

export interface SyncRequest {
  lastSyncTimestamp: number;
  changes: SyncChanges;
}

export interface SyncResponse {
  serverTimestamp: number;
  changes: SyncChanges;
}

type StatusChangeCallback = (status: SyncStatus) => void;

const SYNC_INTERVAL = 30000; // 30 seconds retry interval when offline
const API_BASE = '/api/sync';

export class SyncManager {
  private status: SyncStatus = 'offline';
  private statusListeners: Set<StatusChangeCallback> = new Set();
  private syncIntervalId: ReturnType<typeof setInterval> | null = null;
  private isSyncing = false;

  getStatus(): SyncStatus {
    return this.status;
  }

  onStatusChange(callback: StatusChangeCallback): () => void {
    this.statusListeners.add(callback);
    return () => this.statusListeners.delete(callback);
  }

  private setStatus(status: SyncStatus): void {
    if (this.status !== status) {
      this.status = status;
      this.statusListeners.forEach((cb) => cb(status));
    }
  }

  /**
   * Start the sync manager - performs initial sync and sets up retry interval
   */
  async start(): Promise<void> {
    // Perform initial sync
    await this.sync();

    // Set up retry interval for when offline
    this.syncIntervalId = setInterval(() => {
      if (this.status === 'offline' && !this.isSyncing) {
        this.sync();
      }
    }, SYNC_INTERVAL);
  }

  /**
   * Stop the sync manager
   */
  stop(): void {
    if (this.syncIntervalId) {
      clearInterval(this.syncIntervalId);
      this.syncIntervalId = null;
    }
  }

  /**
   * Trigger a sync - called after local operations when online
   */
  async triggerSync(): Promise<boolean> {
    if (this.status === 'offline') {
      return false;
    }
    return this.sync();
  }

  /**
   * Perform bi-directional sync with the server
   */
  private async sync(): Promise<boolean> {
    if (this.isSyncing) {
      return false;
    }

    this.isSyncing = true;
    this.setStatus('syncing');

    try {
      const lastSync = await syncMetaRepository.getLastSyncTimestamp();

      // Gather local changes since last sync
      const localChanges = await this.getLocalChanges(lastSync);

      // Send to server
      const response = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lastSyncTimestamp: lastSync,
          changes: localChanges,
        } as SyncRequest),
      });

      if (!response.ok) {
        throw new Error(`Sync failed: ${response.status}`);
      }

      const data: SyncResponse = await response.json();

      // Apply server changes locally
      await this.applyServerChanges(data.changes);

      // Update last sync timestamp
      await syncMetaRepository.setLastSyncTimestamp(data.serverTimestamp);

      this.setStatus('online');
      this.isSyncing = false;
      return true;
    } catch (error) {
      console.error('Sync error:', error);
      this.setStatus('offline');
      this.isSyncing = false;
      return false;
    }
  }

  /**
   * Get all local changes since last sync
   */
  private async getLocalChanges(since: number): Promise<SyncChanges> {
    const [
      teams,
      races,
      race_teams,
      karts,
      pitlane_configs,
      pitlane_current,
      pitlane_history,
    ] = await Promise.all([
      teamRepository.findAllForSync(since),
      raceRepository.findAllForSync(since),
      raceRepository.findAllRaceTeamsForSync(since),
      kartRepository.findAllForSync(since),
      pitlaneConfigRepository.findAllForSync(since),
      pitlaneCurrentRepository.findAllForSync(since),
      pitlaneHistoryRepository.findAllForSync(since),
    ]);

    return {
      teams,
      races,
      race_teams,
      karts,
      pitlane_configs,
      pitlane_current,
      pitlane_history,
    };
  }

  /**
   * Apply changes from server to local database
   */
  private async applyServerChanges(changes: SyncChanges): Promise<void> {
    // Apply in order to respect foreign key relationships
    for (const record of changes.teams) {
      await teamRepository.upsertFromSync(record);
    }

    for (const record of changes.races) {
      await raceRepository.upsertFromSync(record);
    }

    for (const record of changes.race_teams) {
      await raceRepository.upsertRaceTeamFromSync(record);
    }

    for (const record of changes.karts) {
      await kartRepository.upsertFromSync(record);
    }

    for (const record of changes.pitlane_configs) {
      await pitlaneConfigRepository.upsertFromSync(record);
    }

    for (const record of changes.pitlane_current) {
      await pitlaneCurrentRepository.upsertFromSync(record);
    }

    for (const record of changes.pitlane_history) {
      await pitlaneHistoryRepository.upsertFromSync(record);
    }
  }
}

// Singleton instance
export const syncManager = new SyncManager();
