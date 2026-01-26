import { getDatabase, type SyncMetaRecord } from '@/shared/db/database';

export class SyncMetaRepository {
  private readonly LAST_SYNC_KEY = 'lastSyncTimestamp';

  async getLastSyncTimestamp(): Promise<number> {
    const db = await getDatabase();
    const record = await db.get('sync_meta', this.LAST_SYNC_KEY);
    return record ? Number(record.value) : 0;
  }

  async setLastSyncTimestamp(timestamp: number): Promise<void> {
    const db = await getDatabase();
    const record: SyncMetaRecord = {
      key: this.LAST_SYNC_KEY,
      value: timestamp,
    };
    await db.put('sync_meta', record);
  }

  async get(key: string): Promise<string | number | undefined> {
    const db = await getDatabase();
    const record = await db.get('sync_meta', key);
    return record?.value;
  }

  async set(key: string, value: string | number): Promise<void> {
    const db = await getDatabase();
    const record: SyncMetaRecord = { key, value };
    await db.put('sync_meta', record);
  }
}

export const syncMetaRepository = new SyncMetaRepository();
