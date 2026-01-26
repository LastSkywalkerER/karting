import {
  getDatabase,
  type PitlaneHistoryRecord,
} from '@/shared/db/database';
import type { PitlaneHistory } from '@/shared/types/pitlane';

export class PitlaneHistoryRepository {
  async findByConfig(configId: number): Promise<PitlaneHistory[]> {
    const db = await getDatabase();
    const entries = await db.getAllFromIndex('pitlane_history', 'pitlaneConfigId', configId);
    const activeEntries = entries
      .filter((e) => !e.isDeleted)
      .sort((a, b) => b.exitedAt - a.exitedAt); // Most recent first

    return Promise.all(activeEntries.map((e) => this.populateRelations(e)));
  }

  async findByLine(configId: number, lineNumber: number): Promise<PitlaneHistory[]> {
    const db = await getDatabase();
    const entries = await db.getAllFromIndex('pitlane_history', 'pitlaneConfigId', configId);
    const lineEntries = entries
      .filter((e) => !e.isDeleted && e.lineNumber === lineNumber)
      .sort((a, b) => b.exitedAt - a.exitedAt);

    return Promise.all(lineEntries.map((e) => this.populateRelations(e)));
  }

  private async populateRelations(record: PitlaneHistoryRecord): Promise<PitlaneHistory> {
    const db = await getDatabase();

    const result: PitlaneHistory = {
      id: record.id!,
      pitlaneConfigId: record.pitlaneConfigId,
      teamId: record.teamId,
      kartId: record.kartId,
      lineNumber: record.lineNumber,
      queuePosition: record.queuePosition,
      enteredAt: new Date(record.enteredAt).toISOString(),
      exitedAt: new Date(record.exitedAt).toISOString(),
    };

    // Populate team
    const team = await db.get('teams', record.teamId);
    if (team && !team.isDeleted) {
      result.team = { id: team.id!, name: team.name };
    }

    // Populate kart
    const kart = await db.get('karts', record.kartId);
    if (kart && !kart.isDeleted) {
      result.kart = {
        id: kart.id!,
        raceId: kart.raceId,
        status: kart.status,
        teamId: kart.teamId,
      };
    }

    return result;
  }

  // For sync
  async findAllForSync(since?: number): Promise<PitlaneHistoryRecord[]> {
    const db = await getDatabase();
    if (since) {
      return db.getAllFromIndex(
        'pitlane_history',
        'updatedAt',
        IDBKeyRange.lowerBound(since, true)
      );
    }
    return db.getAll('pitlane_history');
  }

  async upsertFromSync(record: PitlaneHistoryRecord): Promise<void> {
    const db = await getDatabase();
    if (record.id) {
      const existing = await db.get('pitlane_history', record.id);
      if (!existing || record.updatedAt > existing.updatedAt) {
        // If record is deleted, remove it from local DB
        if (record.isDeleted) {
          await db.delete('pitlane_history', record.id);
        } else {
          await db.put('pitlane_history', record);
        }
      }
    }
  }
}

export const pitlaneHistoryRepository = new PitlaneHistoryRepository();
