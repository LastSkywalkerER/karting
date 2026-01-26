import {
  getDatabase,
  createSyncFields,
  updateSyncFields,
  deleteSyncFields,
  type PitlaneConfigRecord,
} from '@/shared/db/database';
import type { PitlaneConfig } from '@/shared/types/pitlane';

export class PitlaneConfigRepository {
  async findById(id: number): Promise<PitlaneConfig | undefined> {
    const db = await getDatabase();
    const config = await db.get('pitlane_configs', id);
    if (!config || config.isDeleted) {
      return undefined;
    }
    return this.toConfig(config);
  }

  async findByRaceId(raceId: number): Promise<PitlaneConfig | undefined> {
    const db = await getDatabase();
    const configs = await db.getAllFromIndex('pitlane_configs', 'raceId', raceId);
    const config = configs.find((c) => !c.isDeleted);
    if (!config) {
      return undefined;
    }
    return this.toConfig(config);
  }

  private toConfig(record: PitlaneConfigRecord): PitlaneConfig {
    return {
      id: record.id!,
      raceId: record.raceId,
      linesCount: record.linesCount,
      queueSize: record.queueSize,
    };
  }

  async create(data: {
    raceId: number;
    linesCount: number;
    queueSize: number;
  }): Promise<PitlaneConfig> {
    const db = await getDatabase();
    const record: PitlaneConfigRecord = {
      ...data,
      ...createSyncFields(),
    };
    const id = await db.add('pitlane_configs', record);
    return { ...this.toConfig(record), id };
  }

  async update(
    id: number,
    data: { linesCount?: number; queueSize?: number }
  ): Promise<PitlaneConfig | undefined> {
    const db = await getDatabase();
    const existing = await db.get('pitlane_configs', id);
    if (!existing || existing.isDeleted) {
      return undefined;
    }

    const updated: PitlaneConfigRecord = {
      ...existing,
      ...data,
      ...updateSyncFields(existing),
    };
    await db.put('pitlane_configs', updated);
    return this.toConfig(updated);
  }

  async delete(id: number): Promise<boolean> {
    const db = await getDatabase();
    const existing = await db.get('pitlane_configs', id);
    if (!existing || existing.isDeleted) {
      return false;
    }

    const deleted: PitlaneConfigRecord = {
      ...existing,
      ...deleteSyncFields(existing),
    };
    await db.put('pitlane_configs', deleted);
    return true;
  }

  // For sync
  async findAllForSync(since?: number): Promise<PitlaneConfigRecord[]> {
    const db = await getDatabase();
    if (since) {
      return db.getAllFromIndex(
        'pitlane_configs',
        'updatedAt',
        IDBKeyRange.lowerBound(since, true)
      );
    }
    return db.getAll('pitlane_configs');
  }

  async upsertFromSync(record: PitlaneConfigRecord): Promise<void> {
    const db = await getDatabase();
    if (record.id) {
      const existing = await db.get('pitlane_configs', record.id);
      if (!existing || record.updatedAt > existing.updatedAt) {
        // If record is deleted, remove it from local DB
        if (record.isDeleted) {
          await db.delete('pitlane_configs', record.id);
        } else {
          await db.put('pitlane_configs', record);
        }
      }
    }
  }
}

export const pitlaneConfigRepository = new PitlaneConfigRepository();
