import {
  getDatabase,
  createSyncFields,
  updateSyncFields,
  deleteSyncFields,
  type KartRecord,
} from '@/shared/db/database';
import type { Kart } from '@/shared/types/kart';

export class KartRepository {
  async findAll(): Promise<Kart[]> {
    const db = await getDatabase();
    const karts = await db.getAll('karts');
    return karts.filter((k) => !k.isDeleted).map((k) => this.toKart(k));
  }

  async findById(id: number): Promise<Kart | undefined> {
    const db = await getDatabase();
    const kart = await db.get('karts', id);
    if (!kart || kart.isDeleted) {
      return undefined;
    }
    return this.populateRelations(kart);
  }

  async findByRace(raceId: number): Promise<Kart[]> {
    const db = await getDatabase();
    const karts = await db.getAllFromIndex('karts', 'raceId', raceId);
    const activeKarts = karts.filter((k) => !k.isDeleted);
    return Promise.all(activeKarts.map((k) => this.populateRelations(k)));
  }

  async findByTeam(teamId: number): Promise<Kart[]> {
    const db = await getDatabase();
    const karts = await db.getAllFromIndex('karts', 'teamId', teamId);
    return karts.filter((k) => !k.isDeleted).map((k) => this.toKart(k));
  }

  async findByTeamAndRace(teamId: number, raceId: number): Promise<Kart[]> {
    const db = await getDatabase();
    const karts = await db.getAllFromIndex('karts', 'raceId', raceId);
    return karts
      .filter((k) => !k.isDeleted && k.teamId === teamId)
      .map((k) => this.toKart(k));
  }

  private toKart(record: KartRecord): Kart {
    return {
      id: record.id!,
      raceId: record.raceId,
      status: record.status,
      teamId: record.teamId,
    };
  }

  private async populateRelations(record: KartRecord): Promise<Kart> {
    const db = await getDatabase();
    const kart = this.toKart(record);

    // Populate team
    if (record.teamId) {
      const team = await db.get('teams', record.teamId);
      if (team && !team.isDeleted) {
        kart.team = { id: team.id!, name: team.name };
      }
    }

    return kart;
  }

  async create(data: {
    raceId: number;
    status?: number;
    teamId?: number | null;
  }): Promise<Kart> {
    const db = await getDatabase();
    const record: KartRecord = {
      raceId: data.raceId,
      status: data.status ?? 1,
      teamId: data.teamId ?? null,
      ...createSyncFields(),
    };
    const id = await db.add('karts', record);
    return { ...this.toKart(record), id };
  }

  async createMany(raceId: number, count: number): Promise<Kart[]> {
    const db = await getDatabase();
    const karts: Kart[] = [];

    for (let i = 0; i < count; i++) {
      const record: KartRecord = {
        raceId,
        status: 1,
        teamId: null,
        ...createSyncFields(),
      };
      const id = await db.add('karts', record);
      karts.push({ ...this.toKart(record), id });
    }

    return karts;
  }

  async update(
    id: number,
    data: { status?: number; teamId?: number | null }
  ): Promise<Kart | undefined> {
    const db = await getDatabase();
    const existing = await db.get('karts', id);
    if (!existing || existing.isDeleted) {
      return undefined;
    }

    const updated: KartRecord = {
      ...existing,
      ...data,
      ...updateSyncFields(existing),
    };
    await db.put('karts', updated);
    return this.populateRelations(updated);
  }

  async delete(id: number): Promise<boolean> {
    const db = await getDatabase();
    const existing = await db.get('karts', id);
    if (!existing || existing.isDeleted) {
      return false;
    }

    const deleted: KartRecord = {
      ...existing,
      ...deleteSyncFields(existing),
    };
    await db.put('karts', deleted);
    return true;
  }

  async assignTeam(kartId: number, teamId: number | null): Promise<boolean> {
    const db = await getDatabase();
    const existing = await db.get('karts', kartId);
    if (!existing || existing.isDeleted) {
      return false;
    }

    const updated: KartRecord = {
      ...existing,
      teamId,
      ...updateSyncFields(existing),
    };
    await db.put('karts', updated);
    return true;
  }

  async updateStatus(kartId: number, status: number): Promise<boolean> {
    const db = await getDatabase();
    const existing = await db.get('karts', kartId);
    if (!existing || existing.isDeleted) {
      return false;
    }

    const updated: KartRecord = {
      ...existing,
      status,
      ...updateSyncFields(existing),
    };
    await db.put('karts', updated);
    return true;
  }

  // For sync
  async findAllForSync(since?: number): Promise<KartRecord[]> {
    const db = await getDatabase();
    if (since) {
      return db.getAllFromIndex('karts', 'updatedAt', IDBKeyRange.lowerBound(since, true));
    }
    return db.getAll('karts');
  }

  async upsertFromSync(record: KartRecord): Promise<void> {
    const db = await getDatabase();
    if (record.id) {
      const existing = await db.get('karts', record.id);
      if (!existing || record.updatedAt > existing.updatedAt) {
        await db.put('karts', record);
      }
    }
  }
}

export const kartRepository = new KartRepository();
