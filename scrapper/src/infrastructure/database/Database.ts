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

    // Create team_kart_status table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS team_kart_status (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        team_number TEXT NOT NULL UNIQUE,
        kart_status INTEGER NOT NULL CHECK(kart_status >= 1 AND kart_status <= 5)
      )
    `);

    // Add last_pit_lap column if it doesn't exist (for backward compatibility)
    try {
      this.db.exec(`ALTER TABLE team_kart_status ADD COLUMN last_pit_lap INTEGER`);
    } catch (error) {
      // Column already exists, ignore error
    }

    // Create index for team_number
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_team_number ON team_kart_status(team_number);
    `);

    // Create pitlane_kart_status table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS pitlane_kart_status (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        pitlane_number INTEGER NOT NULL UNIQUE CHECK(pitlane_number >= 1 AND pitlane_number <= 4),
        kart_status INTEGER NOT NULL CHECK(kart_status >= 1 AND kart_status <= 5)
      )
    `);

    // Create index for pitlane_number
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_pitlane_number ON pitlane_kart_status(pitlane_number);
    `);
  }

  getDatabase(): Database.Database {
    return this.db;
  }

  close(): void {
    this.db.close();
  }
}

