import { ITeamKartStatusRepository } from '../../domain/repositories/ITeamKartStatusRepository';
import { TeamKartStatus, TeamKartStatusEntity } from '../../domain/entities/TeamKartStatus';
import { DatabaseConnection } from './Database';

export class TeamKartStatusRepository implements ITeamKartStatusRepository {
  private db: ReturnType<DatabaseConnection['getDatabase']>;

  constructor(databaseConnection: DatabaseConnection) {
    this.db = databaseConnection.getDatabase();
  }

  findAll(): TeamKartStatus[] {
    const stmt = this.db.prepare('SELECT * FROM team_kart_status ORDER BY team_number ASC');
    const rows = stmt.all() as Array<{
      id?: number;
      team_number: string;
      kart_status: number;
      last_pit_lap?: number | null;
    }>;

    return rows.map(row => ({
      id: row.id,
      teamNumber: row.team_number,
      kartStatus: row.kart_status,
      lastPitLap: row.last_pit_lap ?? undefined
    }));
  }

  findByTeamNumber(teamNumber: string): TeamKartStatus | null {
    const stmt = this.db.prepare('SELECT * FROM team_kart_status WHERE team_number = ?');
    const row = stmt.get(teamNumber) as {
      id?: number;
      team_number: string;
      kart_status: number;
      last_pit_lap?: number | null;
    } | undefined;

    if (!row) {
      return null;
    }

    return {
      id: row.id,
      teamNumber: row.team_number,
      kartStatus: row.kart_status,
      lastPitLap: row.last_pit_lap ?? undefined
    };
  }

  save(teamKartStatus: TeamKartStatusEntity): void {
    const existing = this.findByTeamNumber(teamKartStatus.teamNumber);
    
    if (existing) {
      // Update existing record
      const stmt = this.db.prepare(`
        UPDATE team_kart_status 
        SET kart_status = ?, last_pit_lap = ? 
        WHERE team_number = ?
      `);
      stmt.run(teamKartStatus.kartStatus, teamKartStatus.lastPitLap ?? null, teamKartStatus.teamNumber);
    } else {
      // Insert new record
      const stmt = this.db.prepare(`
        INSERT INTO team_kart_status (team_number, kart_status, last_pit_lap)
        VALUES (?, ?, ?)
      `);
      stmt.run(teamKartStatus.teamNumber, teamKartStatus.kartStatus, teamKartStatus.lastPitLap ?? null);
    }
  }

  updateMany(updates: Array<{ teamNumber: string; kartStatus: number; lastPitLap?: number }>): void {
    const updateStmt = this.db.prepare(`
      UPDATE team_kart_status 
      SET kart_status = ?, last_pit_lap = ? 
      WHERE team_number = ?
    `);

    const insertStmt = this.db.prepare(`
      INSERT INTO team_kart_status (team_number, kart_status, last_pit_lap)
      VALUES (?, ?, ?)
    `);

    const updateMany = this.db.transaction((updatesList: Array<{ teamNumber: string; kartStatus: number; lastPitLap?: number }>) => {
      for (const update of updatesList) {
        const existing = this.findByTeamNumber(update.teamNumber);
        
        if (existing) {
          updateStmt.run(update.kartStatus, update.lastPitLap ?? null, update.teamNumber);
        } else {
          insertStmt.run(update.teamNumber, update.kartStatus, update.lastPitLap ?? null);
        }
      }
    });

    updateMany(updates);
  }
}

