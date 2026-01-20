import 'reflect-metadata';
import { DataSource } from 'typeorm';
import path from 'path';
import fs from 'fs';

// Import all entities
import { Team } from '../../modules/team/entities/Team';
import { Race } from '../../modules/race/entities/Race';
import { RaceTeam } from '../../modules/race/entities/RaceTeam';
import { Kart } from '../../modules/kart/entities/Kart';
import { PitlaneConfig } from '../../modules/pitlane/entities/PitlaneConfig';
import { PitlaneCurrent } from '../../modules/pitlane/entities/PitlaneCurrent';
import { PitlaneHistory } from '../../modules/pitlane/entities/PitlaneHistory';

// Database path configuration
const getDbPath = (): string => {
  const defaultPath = process.env.DB_PATH || path.join(process.cwd(), process.env.NODE_ENV === 'production' ? 'data' : '', 'race_data.db');
  
  // Ensure directory exists
  const dbDir = path.dirname(defaultPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  
  return defaultPath;
};

export const AppDataSource = new DataSource({
  type: 'better-sqlite3',
  database: getDbPath(),
  entities: [Team, Race, RaceTeam, Kart, PitlaneConfig, PitlaneCurrent, PitlaneHistory],
  synchronize: process.env.NODE_ENV !== 'production', // Auto-sync in development
  logging: process.env.NODE_ENV !== 'production',
});

export async function initializeDatabase(): Promise<DataSource> {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
    console.log('Database connection established');
  }
  return AppDataSource;
}

export async function closeDatabase(): Promise<void> {
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
    console.log('Database connection closed');
  }
}
