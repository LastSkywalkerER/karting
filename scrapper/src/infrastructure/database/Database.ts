import Database from 'better-sqlite3';
import path from 'path';

export class DatabaseConnection {
  private db: Database.Database;

  constructor(dbPath?: string) {
    // Use process.cwd() for CommonJS compatibility
    const finalPath = dbPath || path.join(process.cwd(), 'race_data.db');
    this.db = new Database(finalPath);
    this.initializeSchema();
  }

  private initializeSchema(): void {
    // Create table if not exists
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS race_results (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT NOT NULL,
        session_id TEXT NOT NULL,
        position INTEGER,
        competitor_number TEXT,
        competitor_name TEXT,
        laps INTEGER,
        last_lap_time TEXT,
        best_lap_time TEXT,
        gap TEXT,
        diff TEXT,
        raw_data TEXT
      )
    `);

    // Create indexes for faster queries
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_timestamp ON race_results(timestamp);
      CREATE INDEX IF NOT EXISTS idx_session_id ON race_results(session_id);
    `);
  }

  getDatabase(): Database.Database {
    return this.db;
  }

  close(): void {
    this.db.close();
  }
}

