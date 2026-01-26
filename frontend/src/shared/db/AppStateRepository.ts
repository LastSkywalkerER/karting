import { getDatabase } from './database';

export interface AppStateRecord {
  key: string;
  value: string | number | null;
}

export class AppStateRepository {
  private readonly CURRENT_RACE_KEY = 'currentRaceId';

  async getCurrentRaceId(): Promise<number | null> {
    const db = await getDatabase();
    const record = await db.get('current_app_state', this.CURRENT_RACE_KEY);
    if (!record) {
      return null;
    }
    return typeof record.value === 'number' ? record.value : null;
  }

  async setCurrentRaceId(raceId: number | null): Promise<void> {
    const db = await getDatabase();
    const record: AppStateRecord = {
      key: this.CURRENT_RACE_KEY,
      value: raceId,
    };
    await db.put('current_app_state', record);
  }

  async get(key: string): Promise<string | number | null | undefined> {
    const db = await getDatabase();
    const record = await db.get('current_app_state', key);
    return record?.value;
  }

  async set(key: string, value: string | number | null): Promise<void> {
    const db = await getDatabase();
    const record: AppStateRecord = { key, value };
    await db.put('current_app_state', record);
  }
}

export const appStateRepository = new AppStateRepository();
