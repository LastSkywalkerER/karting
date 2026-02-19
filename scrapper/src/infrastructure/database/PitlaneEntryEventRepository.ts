import { IPitlaneEntryEventRepository } from '../../domain/repositories/IPitlaneEntryEventRepository';
import { PitlaneEntryEvent } from '../../domain/entities/PitlaneEntryEvent';
import { DatabaseConnection } from './Database';

export class PitlaneEntryEventRepository implements IPitlaneEntryEventRepository {
  private db: ReturnType<DatabaseConnection['getDatabase']>;

  constructor(databaseConnection: DatabaseConnection) {
    this.db = databaseConnection.getDatabase();
  }

  create(event: Omit<PitlaneEntryEvent, 'id'>): number {
    const stmt = this.db.prepare(`
      INSERT INTO pitlane_entry_events (session_id, competitor_number, lap_number, timestamp, acknowledged)
      VALUES (?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      event.sessionId,
      event.competitorNumber,
      event.lapNumber,
      event.timestamp,
      event.acknowledged ? 1 : 0
    );
    return result.lastInsertRowid as number;
  }

  private static readonly MAX_EVENT_AGE_MS = 5 * 60 * 1000;

  findBySession(sessionId: string, acknowledged?: boolean): PitlaneEntryEvent[] {
    let query = 'SELECT * FROM pitlane_entry_events WHERE session_id = ?';
    const params: (string | number)[] = [sessionId];
    if (acknowledged !== undefined) {
      query += ' AND acknowledged = ?';
      params.push(acknowledged ? 1 : 0);
    }
    query += ' ORDER BY id ASC';

    const stmt = this.db.prepare(query);
    const rows = stmt.all(...params) as Array<{
      id: number;
      session_id: string;
      competitor_number: string;
      lap_number: number;
      timestamp: string;
      acknowledged: number;
    }>;

    const now = Date.now();
    return rows
      .map((row) => ({
        id: row.id,
        sessionId: row.session_id,
        competitorNumber: row.competitor_number,
        lapNumber: row.lap_number,
        timestamp: row.timestamp,
        acknowledged: row.acknowledged === 1,
      }))
      .filter((event) => {
        const eventTime = new Date(event.timestamp).getTime();
        return now - eventTime <= PitlaneEntryEventRepository.MAX_EVENT_AGE_MS;
      });
  }

  acknowledge(id: number): void {
    const stmt = this.db.prepare(
      'UPDATE pitlane_entry_events SET acknowledged = 1 WHERE id = ?'
    );
    stmt.run(id);
  }
}
