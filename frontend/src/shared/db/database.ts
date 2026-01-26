import { openDB, DBSchema, IDBPDatabase } from 'idb';

// Sync fields that all entities have
export interface SyncFields {
  updatedAt: number;
  isDeleted: boolean;
  deletedAt: number | null;
}

// Entity interfaces with sync fields
export interface TeamRecord extends SyncFields {
  id?: number;
  name: string;
}

export interface RaceRecord extends SyncFields {
  id?: number;
  name: string;
  date: string;
}

export interface RaceTeamRecord extends SyncFields {
  raceId: number;
  teamId: number;
  number: string | null;
}

export interface KartRecord extends SyncFields {
  id?: number;
  raceId: number;
  status: number;
  teamId: number | null;
}

export interface PitlaneConfigRecord extends SyncFields {
  id?: number;
  raceId: number;
  linesCount: number;
  queueSize: number;
}

export interface PitlaneCurrentRecord extends SyncFields {
  id?: number;
  pitlaneConfigId: number;
  teamId: number;
  kartId: number;
  lineNumber: number;
  queuePosition: number;
  enteredAt: number;
}

export interface PitlaneHistoryRecord extends SyncFields {
  id?: number;
  pitlaneConfigId: number;
  teamId: number;
  kartId: number;
  lineNumber: number;
  queuePosition: number;
  enteredAt: number;
  exitedAt: number;
}

export interface SyncMetaRecord {
  key: string;
  value: string | number;
}

// Database schema definition
export interface RaceStatsDB extends DBSchema {
  teams: {
    key: number;
    value: TeamRecord;
    indexes: { updatedAt: number };
  };
  races: {
    key: number;
    value: RaceRecord;
    indexes: { updatedAt: number };
  };
  race_teams: {
    key: [number, number];
    value: RaceTeamRecord;
    indexes: { updatedAt: number; raceId: number };
  };
  karts: {
    key: number;
    value: KartRecord;
    indexes: { raceId: number; teamId: number; updatedAt: number };
  };
  pitlane_configs: {
    key: number;
    value: PitlaneConfigRecord;
    indexes: { raceId: number; updatedAt: number };
  };
  pitlane_current: {
    key: number;
    value: PitlaneCurrentRecord;
    indexes: { pitlaneConfigId: number; updatedAt: number };
  };
  pitlane_history: {
    key: number;
    value: PitlaneHistoryRecord;
    indexes: { pitlaneConfigId: number; updatedAt: number };
  };
  sync_meta: {
    key: string;
    value: SyncMetaRecord;
  };
}

const DB_NAME = 'race-stats';
const DB_VERSION = 2;

let dbInstance: IDBPDatabase<RaceStatsDB> | null = null;

export async function getDatabase(): Promise<IDBPDatabase<RaceStatsDB>> {
  if (dbInstance) {
    return dbInstance;
  }

  dbInstance = await openDB<RaceStatsDB>(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion) {
      // Version 2: Initial schema with all stores
      if (oldVersion < 2) {
        // Teams store
        const teams = db.createObjectStore('teams', {
          keyPath: 'id',
          autoIncrement: true,
        });
        teams.createIndex('updatedAt', 'updatedAt');

        // Races store
        const races = db.createObjectStore('races', {
          keyPath: 'id',
          autoIncrement: true,
        });
        races.createIndex('updatedAt', 'updatedAt');

        // Race teams store (many-to-many)
        const raceTeams = db.createObjectStore('race_teams', {
          keyPath: ['raceId', 'teamId'],
        });
        raceTeams.createIndex('updatedAt', 'updatedAt');
        raceTeams.createIndex('raceId', 'raceId');

        // Karts store
        const karts = db.createObjectStore('karts', {
          keyPath: 'id',
          autoIncrement: true,
        });
        karts.createIndex('raceId', 'raceId');
        karts.createIndex('teamId', 'teamId');
        karts.createIndex('updatedAt', 'updatedAt');

        // Pitlane configs store
        const pitlaneConfigs = db.createObjectStore('pitlane_configs', {
          keyPath: 'id',
          autoIncrement: true,
        });
        pitlaneConfigs.createIndex('raceId', 'raceId');
        pitlaneConfigs.createIndex('updatedAt', 'updatedAt');

        // Pitlane current store
        const pitlaneCurrent = db.createObjectStore('pitlane_current', {
          keyPath: 'id',
          autoIncrement: true,
        });
        pitlaneCurrent.createIndex('pitlaneConfigId', 'pitlaneConfigId');
        pitlaneCurrent.createIndex('updatedAt', 'updatedAt');

        // Pitlane history store
        const pitlaneHistory = db.createObjectStore('pitlane_history', {
          keyPath: 'id',
          autoIncrement: true,
        });
        pitlaneHistory.createIndex('pitlaneConfigId', 'pitlaneConfigId');
        pitlaneHistory.createIndex('updatedAt', 'updatedAt');

        // Sync meta store
        db.createObjectStore('sync_meta', { keyPath: 'key' });
      }
    },
  });

  return dbInstance;
}

// Helper to get current timestamp
export function now(): number {
  return Date.now();
}

// Helper to create sync fields for new records
export function createSyncFields(): SyncFields {
  return {
    updatedAt: now(),
    isDeleted: false,
    deletedAt: null,
  };
}

// Helper to update sync fields
export function updateSyncFields(existing: SyncFields): SyncFields {
  return {
    ...existing,
    updatedAt: now(),
  };
}

// Helper to mark as deleted (soft delete)
export function deleteSyncFields(existing: SyncFields): SyncFields {
  return {
    ...existing,
    updatedAt: now(),
    isDeleted: true,
    deletedAt: now(),
  };
}
