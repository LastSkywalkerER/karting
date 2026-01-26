import {
  getDatabase,
  createSyncFields,
  updateSyncFields,
  deleteSyncFields,
  type TeamRecord,
} from '@/shared/db/database';

export class TeamRepository {
  async findAll(): Promise<TeamRecord[]> {
    const db = await getDatabase();
    const all = await db.getAll('teams');
    return all.filter((team) => !team.isDeleted);
  }

  async findById(id: number): Promise<TeamRecord | undefined> {
    const db = await getDatabase();
    const team = await db.get('teams', id);
    if (team && !team.isDeleted) {
      return team;
    }
    return undefined;
  }

  async create(data: { name: string }): Promise<TeamRecord> {
    const db = await getDatabase();
    const record: TeamRecord = {
      ...data,
      ...createSyncFields(),
    };
    const id = await db.add('teams', record);
    return { ...record, id };
  }

  async update(id: number, data: { name?: string }): Promise<TeamRecord | undefined> {
    const db = await getDatabase();
    const existing = await db.get('teams', id);
    if (!existing || existing.isDeleted) {
      return undefined;
    }

    const updated: TeamRecord = {
      ...existing,
      ...data,
      ...updateSyncFields(existing),
    };
    await db.put('teams', updated);
    return updated;
  }

  async delete(id: number): Promise<boolean> {
    const db = await getDatabase();
    const existing = await db.get('teams', id);
    if (!existing || existing.isDeleted) {
      return false;
    }

    const deleted: TeamRecord = {
      ...existing,
      ...deleteSyncFields(existing),
    };
    await db.put('teams', deleted);
    return true;
  }

  // Get all records including deleted (for sync)
  async findAllForSync(since?: number): Promise<TeamRecord[]> {
    const db = await getDatabase();
    if (since) {
      return db.getAllFromIndex('teams', 'updatedAt', IDBKeyRange.lowerBound(since, true));
    }
    return db.getAll('teams');
  }

  // Upsert record from sync (preserves server data)
  async upsertFromSync(record: TeamRecord): Promise<void> {
    const db = await getDatabase();
    if (record.id) {
      const existing = await db.get('teams', record.id);
      // Only update if incoming record is newer
      if (!existing || record.updatedAt > existing.updatedAt) {
        // If record is deleted, remove it from local DB
        if (record.isDeleted) {
          await db.delete('teams', record.id);
        } else {
          await db.put('teams', record);
        }
      }
    }
  }
}

export const teamRepository = new TeamRepository();
