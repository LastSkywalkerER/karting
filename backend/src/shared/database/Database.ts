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

// Determine migrations path based on whether we're running from dist or src
const isCompiled = __dirname.includes('dist');
const migrationsPath = isCompiled
  ? path.join(__dirname, '../../migrations/*.js')
  : path.join(process.cwd(), 'src/migrations/*.ts');

const dataSourceOptions = {
  type: 'better-sqlite3' as const,
  database: getDbPath(),
  entities: [Team, Race, RaceTeam, Kart, PitlaneConfig, PitlaneCurrent, PitlaneHistory],
  migrations: [migrationsPath],
  migrationsTableName: 'migrations',
  synchronize: false,
  logging: process.env.NODE_ENV !== 'production',
};

// Create DataSource instance
const AppDataSource = new DataSource(dataSourceOptions);

// Default export for TypeORM CLI (required - must be only one DataSource export)
export default AppDataSource;

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
