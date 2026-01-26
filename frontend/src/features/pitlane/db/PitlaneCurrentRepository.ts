import {
  getDatabase,
  createSyncFields,
  updateSyncFields,
  deleteSyncFields,
  now,
  type PitlaneCurrentRecord,
  type PitlaneHistoryRecord,
  type KartRecord,
} from '@/shared/db/database';
import type { PitlaneCurrent } from '@/shared/types/pitlane';

export class PitlaneCurrentRepository {
  async findByConfig(configId: number): Promise<PitlaneCurrent[]> {
    const db = await getDatabase();
    const entries = await db.getAllFromIndex('pitlane_current', 'pitlaneConfigId', configId);
    const activeEntries = entries
      .filter((e) => !e.isDeleted)
      .sort((a, b) => {
        if (a.lineNumber !== b.lineNumber) return a.lineNumber - b.lineNumber;
        return a.queuePosition - b.queuePosition;
      });

    return Promise.all(activeEntries.map((e) => this.populateRelations(e)));
  }

  async findByLine(configId: number, lineNumber: number): Promise<PitlaneCurrent[]> {
    const db = await getDatabase();
    const entries = await db.getAllFromIndex('pitlane_current', 'pitlaneConfigId', configId);
    const lineEntries = entries
      .filter((e) => !e.isDeleted && e.lineNumber === lineNumber)
      .sort((a, b) => a.queuePosition - b.queuePosition);

    return Promise.all(lineEntries.map((e) => this.populateRelations(e)));
  }

  async findByKart(configId: number, kartId: number): Promise<PitlaneCurrentRecord | undefined> {
    const db = await getDatabase();
    const entries = await db.getAllFromIndex('pitlane_current', 'pitlaneConfigId', configId);
    return entries.find((e) => !e.isDeleted && e.kartId === kartId);
  }

  private async populateRelations(record: PitlaneCurrentRecord): Promise<PitlaneCurrent> {
    const db = await getDatabase();

    const result: PitlaneCurrent = {
      id: record.id!,
      pitlaneConfigId: record.pitlaneConfigId,
      teamId: record.teamId,
      kartId: record.kartId,
      lineNumber: record.lineNumber,
      queuePosition: record.queuePosition,
      enteredAt: new Date(record.enteredAt).toISOString(),
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

  /**
   * Add a kart to the pitlane with full queue logic:
   * - Removes team assignment from the new kart (kart.teamId = null)
   * - If queue is full: removes first kart, shifts positions, adds new at end
   * - If queue not full: adds at first available position
   */
  async addKart(
    configId: number,
    teamId: number,
    kartId: number,
    lineNumber: number,
    queueSize: number
  ): Promise<void> {
    const db = await getDatabase();

    // Check if kart is already in pitlane
    const existingEntry = await this.findByKart(configId, kartId);
    if (existingEntry) {
      throw new Error('Kart is already in pitlane');
    }

    // Remove team assignment from the new kart
    const kart = await db.get('karts', kartId);
    if (kart && !kart.isDeleted) {
      const updatedKart: KartRecord = {
        ...kart,
        teamId: null,
        ...updateSyncFields(kart),
      };
      await db.put('karts', updatedKart);
    }

    // Get current queue for this line
    const entries = await db.getAllFromIndex('pitlane_current', 'pitlaneConfigId', configId);
    const currentQueue = entries
      .filter((e) => !e.isDeleted && e.lineNumber === lineNumber)
      .sort((a, b) => a.queuePosition - b.queuePosition);

    const timestamp = now();

    // Check if queue is full
    if (currentQueue.length >= queueSize) {
      // Remove the first kart (queue_position = 0) and move to history
      const firstEntry = currentQueue[0];

      // Create history entry
      const historyRecord: PitlaneHistoryRecord = {
        pitlaneConfigId: firstEntry.pitlaneConfigId,
        teamId: firstEntry.teamId,
        kartId: firstEntry.kartId,
        lineNumber: firstEntry.lineNumber,
        queuePosition: firstEntry.queuePosition,
        enteredAt: firstEntry.enteredAt,
        exitedAt: timestamp,
        ...createSyncFields(),
      };
      await db.add('pitlane_history', historyRecord);

      // Assign old kart back to the same team
      const oldKart = await db.get('karts', firstEntry.kartId);
      if (oldKart && !oldKart.isDeleted) {
        const updatedOldKart: KartRecord = {
          ...oldKart,
          teamId: firstEntry.teamId,
          ...updateSyncFields(oldKart),
        };
        await db.put('karts', updatedOldKart);
      }

      // Soft delete the first entry
      const deletedFirst: PitlaneCurrentRecord = {
        ...firstEntry,
        ...deleteSyncFields(firstEntry),
      };
      await db.put('pitlane_current', deletedFirst);

      // Shift all positions up (decrease queue_position by 1)
      for (let i = 1; i < currentQueue.length; i++) {
        const entry = currentQueue[i];
        const shifted: PitlaneCurrentRecord = {
          ...entry,
          queuePosition: entry.queuePosition - 1,
          ...updateSyncFields(entry),
        };
        await db.put('pitlane_current', shifted);
      }

      // Add new kart at the last position
      const newEntry: PitlaneCurrentRecord = {
        pitlaneConfigId: configId,
        teamId,
        kartId,
        lineNumber,
        queuePosition: queueSize - 1,
        enteredAt: timestamp,
        ...createSyncFields(),
      };
      await db.add('pitlane_current', newEntry);
    } else {
      // Queue is not full, find the first available position
      const occupiedPositions = new Set(currentQueue.map((e) => e.queuePosition));
      let newPosition = 0;
      while (occupiedPositions.has(newPosition)) {
        newPosition++;
      }

      // Add new kart at the available position
      const newEntry: PitlaneCurrentRecord = {
        pitlaneConfigId: configId,
        teamId,
        kartId,
        lineNumber,
        queuePosition: newPosition,
        enteredAt: timestamp,
        ...createSyncFields(),
      };
      await db.add('pitlane_current', newEntry);
    }
  }

  /**
   * Remove a kart from pitlane by entry ID
   * - Moves entry to history with exitedAt timestamp
   * - If teamId provided, assigns kart to that team
   * - Shifts remaining entries in queue
   */
  async deleteById(id: number, teamId?: number, raceId?: number): Promise<void> {
    const db = await getDatabase();
    const entry = await db.get('pitlane_current', id);

    if (!entry || entry.isDeleted) {
      throw new Error('Pitlane entry not found');
    }

    const timestamp = now();

    // Create history entry
    const historyRecord: PitlaneHistoryRecord = {
      pitlaneConfigId: entry.pitlaneConfigId,
      teamId: entry.teamId,
      kartId: entry.kartId,
      lineNumber: entry.lineNumber,
      queuePosition: entry.queuePosition,
      enteredAt: entry.enteredAt,
      exitedAt: timestamp,
      ...createSyncFields(),
    };
    await db.add('pitlane_history', historyRecord);

    // Assign team to kart if specified
    if (teamId !== undefined && raceId !== undefined) {
      // First unassign any existing kart from this team in this race
      const existingTeamKarts = await db.getAllFromIndex('karts', 'teamId', teamId);
      for (const existingKart of existingTeamKarts) {
        if (!existingKart.isDeleted && existingKart.raceId === raceId && existingKart.id !== entry.kartId) {
          const unassigned: KartRecord = {
            ...existingKart,
            teamId: null,
            ...updateSyncFields(existingKart),
          };
          await db.put('karts', unassigned);
        }
      }

      // Assign kart to team
      const kart = await db.get('karts', entry.kartId);
      if (kart && !kart.isDeleted) {
        const updatedKart: KartRecord = {
          ...kart,
          teamId,
          ...updateSyncFields(kart),
        };
        await db.put('karts', updatedKart);
      }
    }

    // Soft delete the entry
    const deleted: PitlaneCurrentRecord = {
      ...entry,
      ...deleteSyncFields(entry),
    };
    await db.put('pitlane_current', deleted);

    // Shift remaining entries with higher queue_position down
    const entries = await db.getAllFromIndex('pitlane_current', 'pitlaneConfigId', entry.pitlaneConfigId);
    const remainingEntries = entries.filter(
      (e) => !e.isDeleted && e.lineNumber === entry.lineNumber && e.queuePosition > entry.queuePosition
    );

    for (const remaining of remainingEntries) {
      const shifted: PitlaneCurrentRecord = {
        ...remaining,
        queuePosition: remaining.queuePosition - 1,
        ...updateSyncFields(remaining),
      };
      await db.put('pitlane_current', shifted);
    }
  }

  /**
   * Clear all entries from a pitlane line
   */
  async clearLine(configId: number, lineNumber: number): Promise<void> {
    const db = await getDatabase();
    const entries = await db.getAllFromIndex('pitlane_current', 'pitlaneConfigId', configId);
    const lineEntries = entries.filter((e) => !e.isDeleted && e.lineNumber === lineNumber);

    const timestamp = now();

    for (const entry of lineEntries) {
      // Create history entry for each
      const historyRecord: PitlaneHistoryRecord = {
        pitlaneConfigId: entry.pitlaneConfigId,
        teamId: entry.teamId,
        kartId: entry.kartId,
        lineNumber: entry.lineNumber,
        queuePosition: entry.queuePosition,
        enteredAt: entry.enteredAt,
        exitedAt: timestamp,
        ...createSyncFields(),
      };
      await db.add('pitlane_history', historyRecord);

      // Soft delete entry
      const deleted: PitlaneCurrentRecord = {
        ...entry,
        ...deleteSyncFields(entry),
      };
      await db.put('pitlane_current', deleted);
    }
  }

  // For sync
  async findAllForSync(since?: number): Promise<PitlaneCurrentRecord[]> {
    const db = await getDatabase();
    if (since) {
      return db.getAllFromIndex(
        'pitlane_current',
        'updatedAt',
        IDBKeyRange.lowerBound(since, true)
      );
    }
    return db.getAll('pitlane_current');
  }

  async upsertFromSync(record: PitlaneCurrentRecord): Promise<void> {
    const db = await getDatabase();
    if (record.id) {
      const existing = await db.get('pitlane_current', record.id);
      if (!existing || record.updatedAt > existing.updatedAt) {
        await db.put('pitlane_current', record);
      }
    }
  }
}

export const pitlaneCurrentRepository = new PitlaneCurrentRepository();
