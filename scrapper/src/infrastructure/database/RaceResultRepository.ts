import { IRaceResultRepository, QueryOptions } from '../../domain/repositories/IRaceResultRepository';
import { RaceResult, RaceResultEntity } from '../../domain/entities/RaceResult';
import { DatabaseConnection } from './Database';

export class RaceResultRepository implements IRaceResultRepository {
  private db: ReturnType<DatabaseConnection['getDatabase']>;

  constructor(databaseConnection: DatabaseConnection) {
    this.db = databaseConnection.getDatabase();
  }

  save(result: RaceResultEntity): void {
    const stmt = this.db.prepare(`
      INSERT INTO race_results (
        timestamp,
        session_id,
        position,
        competitor_number,
        competitor_name,
        laps,
        last_lap_time,
        best_lap_time,
        gap,
        diff,
        raw_data
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const plainResult = result.toPlainObject();
    const rawDataJson = plainResult.rawData ? JSON.stringify(plainResult.rawData) : null;

    stmt.run(
      plainResult.timestamp,
      plainResult.sessionId,
      plainResult.position,
      plainResult.competitorNumber,
      plainResult.competitorName,
      plainResult.laps,
      plainResult.lastLapTime,
      plainResult.bestLapTime,
      plainResult.gap,
      plainResult.diff,
      rawDataJson
    );
  }

  saveMany(results: RaceResultEntity[]): void {
    const insert = this.db.prepare(`
      INSERT INTO race_results (
        timestamp,
        session_id,
        position,
        competitor_number,
        competitor_name,
        laps,
        last_lap_time,
        best_lap_time,
        gap,
        diff,
        raw_data
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertMany = this.db.transaction((entities: RaceResultEntity[]) => {
      for (const entity of entities) {
        const plainResult = entity.toPlainObject();
        const rawDataJson = plainResult.rawData ? JSON.stringify(plainResult.rawData) : null;
        insert.run(
          plainResult.timestamp,
          plainResult.sessionId,
          plainResult.position,
          plainResult.competitorNumber,
          plainResult.competitorName,
          plainResult.laps,
          plainResult.lastLapTime,
          plainResult.bestLapTime,
          plainResult.gap,
          plainResult.diff,
          rawDataJson
        );
      }
    });

    insertMany(results);
  }

  findAll(options: QueryOptions = {}): RaceResult[] {
    let query = 'SELECT * FROM race_results';
    const params: unknown[] = [];

    if (options.sessionId) {
      query += ' WHERE session_id = ?';
      params.push(options.sessionId);
    }

    query += ' ORDER BY timestamp DESC';

    if (options.limit) {
      query += ' LIMIT ?';
      params.push(options.limit);
    }

    if (options.offset) {
      query += ' OFFSET ?';
      params.push(options.offset);
    }

    const stmt = this.db.prepare(query);
    const rows = stmt.all(...params) as Array<{
      id?: number;
      timestamp: string;
      session_id: string;
      position: number | null;
      competitor_number: string | null;
      competitor_name: string | null;
      laps: number | null;
      last_lap_time: string | null;
      best_lap_time: string | null;
      gap: string | null;
      diff: string | null;
      raw_data: string | null;
    }>;

    return rows.map(row => ({
      id: row.id,
      timestamp: row.timestamp,
      sessionId: row.session_id,
      position: row.position,
      competitorNumber: row.competitor_number,
      competitorName: row.competitor_name,
      laps: row.laps,
      lastLapTime: row.last_lap_time,
      bestLapTime: row.best_lap_time,
      gap: row.gap,
      diff: row.diff,
      rawData: row.raw_data ? JSON.parse(row.raw_data) : undefined
    }));
  }

  findLatestBySessionId(sessionId: string): RaceResult[] {
    const stmt = this.db.prepare(`
      SELECT * FROM race_results
      WHERE session_id = ?
      AND timestamp = (
        SELECT MAX(timestamp) FROM race_results WHERE session_id = ?
      )
      ORDER BY position ASC
    `);

    const rows = stmt.all(sessionId, sessionId) as Array<{
      id?: number;
      timestamp: string;
      session_id: string;
      position: number | null;
      competitor_number: string | null;
      competitor_name: string | null;
      laps: number | null;
      last_lap_time: string | null;
      best_lap_time: string | null;
      gap: string | null;
      diff: string | null;
      raw_data: string | null;
    }>;

    return rows.map(row => ({
      id: row.id,
      timestamp: row.timestamp,
      sessionId: row.session_id,
      position: row.position,
      competitorNumber: row.competitor_number,
      competitorName: row.competitor_name,
      laps: row.laps,
      lastLapTime: row.last_lap_time,
      bestLapTime: row.best_lap_time,
      gap: row.gap,
      diff: row.diff,
      rawData: row.raw_data ? JSON.parse(row.raw_data) : undefined
    }));
  }

  findTimestampsBySessionId(sessionId: string): string[] {
    const stmt = this.db.prepare(`
      SELECT DISTINCT timestamp
      FROM race_results
      WHERE session_id = ?
      ORDER BY timestamp DESC
    `);

    const rows = stmt.all(sessionId) as Array<{ timestamp: string }>;
    return rows.map(row => row.timestamp);
  }
}

