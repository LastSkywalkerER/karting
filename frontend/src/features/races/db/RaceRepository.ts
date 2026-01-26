import {
  getDatabase,
  createSyncFields,
  updateSyncFields,
  deleteSyncFields,
  type RaceRecord,
  type RaceTeamRecord,
} from '@/shared/db/database';
import type { Race, RaceTeam } from '@/shared/types/race';

export class RaceRepository {
  async findAll(): Promise<Race[]> {
    const db = await getDatabase();
    const races = await db.getAll('races');
    const activeRaces = races.filter((race) => !race.isDeleted);

    // Populate raceTeams for each race
    return Promise.all(activeRaces.map((race) => this.populateRaceTeams(race)));
  }

  async findById(id: number): Promise<Race | undefined> {
    const db = await getDatabase();
    const race = await db.get('races', id);
    if (!race || race.isDeleted) {
      return undefined;
    }
    return this.populateRaceTeams(race);
  }

  private async populateRaceTeams(race: RaceRecord): Promise<Race> {
    const db = await getDatabase();
    const allRaceTeams = await db.getAllFromIndex('race_teams', 'raceId', race.id!);
    const activeRaceTeams = allRaceTeams.filter((rt) => !rt.isDeleted);

    // Get team data for each race team
    const raceTeams: RaceTeam[] = await Promise.all(
      activeRaceTeams.map(async (rt) => {
        const team = await db.get('teams', rt.teamId);
        return {
          raceId: rt.raceId,
          teamId: rt.teamId,
          number: rt.number,
          team: team
            ? { id: team.id!, name: team.name }
            : { id: rt.teamId, name: 'Unknown' },
        };
      })
    );

    return {
      id: race.id!,
      name: race.name,
      date: race.date,
      raceTeams,
    };
  }

  async create(data: { name: string; date: string }): Promise<Race> {
    const db = await getDatabase();
    const record: RaceRecord = {
      ...data,
      ...createSyncFields(),
    };
    const id = await db.add('races', record);
    return {
      id,
      name: data.name,
      date: data.date,
      raceTeams: [],
    };
  }

  async update(id: number, data: { name?: string; date?: string }): Promise<Race | undefined> {
    const db = await getDatabase();
    const existing = await db.get('races', id);
    if (!existing || existing.isDeleted) {
      return undefined;
    }

    const updated: RaceRecord = {
      ...existing,
      ...data,
      ...updateSyncFields(existing),
    };
    await db.put('races', updated);
    return this.populateRaceTeams(updated);
  }

  async delete(id: number): Promise<boolean> {
    const db = await getDatabase();
    const existing = await db.get('races', id);
    if (!existing || existing.isDeleted) {
      return false;
    }

    // Soft delete the race
    const deleted: RaceRecord = {
      ...existing,
      ...deleteSyncFields(existing),
    };
    await db.put('races', deleted);

    // Also soft delete all race_teams
    const raceTeams = await db.getAllFromIndex('race_teams', 'raceId', id);
    for (const rt of raceTeams) {
      if (!rt.isDeleted) {
        const deletedRt: RaceTeamRecord = {
          ...rt,
          ...deleteSyncFields(rt),
        };
        await db.put('race_teams', deletedRt);
      }
    }

    return true;
  }

  async addTeam(raceId: number, teamId: number, number: string): Promise<boolean> {
    const db = await getDatabase();

    // Check if race exists
    const race = await db.get('races', raceId);
    if (!race || race.isDeleted) {
      return false;
    }

    // Check if team exists
    const team = await db.get('teams', teamId);
    if (!team || team.isDeleted) {
      return false;
    }

    // Check if already exists
    const existing = await db.get('race_teams', [raceId, teamId]);
    if (existing && !existing.isDeleted) {
      // Update the number
      const updated: RaceTeamRecord = {
        ...existing,
        number,
        ...updateSyncFields(existing),
      };
      await db.put('race_teams', updated);
      return true;
    }

    // Create new race_team
    const record: RaceTeamRecord = {
      raceId,
      teamId,
      number,
      ...createSyncFields(),
    };
    await db.put('race_teams', record);
    return true;
  }

  async removeTeam(raceId: number, teamId: number): Promise<boolean> {
    const db = await getDatabase();
    const existing = await db.get('race_teams', [raceId, teamId]);
    if (!existing || existing.isDeleted) {
      return false;
    }

    const deleted: RaceTeamRecord = {
      ...existing,
      ...deleteSyncFields(existing),
    };
    await db.put('race_teams', deleted);
    return true;
  }

  async getTeams(raceId: number): Promise<RaceTeam[]> {
    const db = await getDatabase();
    const raceTeams = await db.getAllFromIndex('race_teams', 'raceId', raceId);
    const activeRaceTeams = raceTeams.filter((rt) => !rt.isDeleted);

    return Promise.all(
      activeRaceTeams.map(async (rt) => {
        const team = await db.get('teams', rt.teamId);
        return {
          raceId: rt.raceId,
          teamId: rt.teamId,
          number: rt.number,
          team: team
            ? { id: team.id!, name: team.name }
            : { id: rt.teamId, name: 'Unknown' },
        };
      })
    );
  }

  // For sync
  async findAllForSync(since?: number): Promise<RaceRecord[]> {
    const db = await getDatabase();
    if (since) {
      return db.getAllFromIndex('races', 'updatedAt', IDBKeyRange.lowerBound(since, true));
    }
    return db.getAll('races');
  }

  async findAllRaceTeamsForSync(since?: number): Promise<RaceTeamRecord[]> {
    const db = await getDatabase();
    if (since) {
      return db.getAllFromIndex('race_teams', 'updatedAt', IDBKeyRange.lowerBound(since, true));
    }
    return db.getAll('race_teams');
  }

  async upsertFromSync(record: RaceRecord): Promise<void> {
    const db = await getDatabase();
    if (record.id) {
      const existing = await db.get('races', record.id);
      if (!existing || record.updatedAt > existing.updatedAt) {
        // If record is deleted, remove it from local DB
        if (record.isDeleted) {
          await db.delete('races', record.id);
        } else {
          await db.put('races', record);
        }
      }
    }
  }

  async upsertRaceTeamFromSync(record: RaceTeamRecord): Promise<void> {
    const db = await getDatabase();
    const existing = await db.get('race_teams', [record.raceId, record.teamId]);
    if (!existing || record.updatedAt > existing.updatedAt) {
      // If record is deleted, remove it from local DB
      if (record.isDeleted) {
        await db.delete('race_teams', [record.raceId, record.teamId]);
      } else {
        await db.put('race_teams', record);
      }
    }
  }
}

export const raceRepository = new RaceRepository();
