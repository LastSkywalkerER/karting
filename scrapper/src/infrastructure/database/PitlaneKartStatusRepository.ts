import { IPitlaneKartStatusRepository } from '../../domain/repositories/IPitlaneKartStatusRepository';
import { PitlaneKartStatus, PitlaneKartStatusEntity } from '../../domain/entities/PitlaneKartStatus';
import { DatabaseConnection } from './Database';

export class PitlaneKartStatusRepository implements IPitlaneKartStatusRepository {
  private db: ReturnType<DatabaseConnection['getDatabase']>;

  constructor(databaseConnection: DatabaseConnection) {
    this.db = databaseConnection.getDatabase();
  }

  findAll(): PitlaneKartStatus[] {
    const stmt = this.db.prepare('SELECT * FROM pitlane_kart_status ORDER BY pitlane_number ASC');
    const rows = stmt.all() as Array<{
      id?: number;
      pitlane_number: number;
      kart_status: number;
    }>;

    return rows.map(row => ({
      id: row.id,
      pitlaneNumber: row.pitlane_number,
      kartStatus: row.kart_status
    }));
  }

  findByPitlaneNumber(pitlaneNumber: number): PitlaneKartStatus | null {
    const stmt = this.db.prepare('SELECT * FROM pitlane_kart_status WHERE pitlane_number = ?');
    const row = stmt.get(pitlaneNumber) as {
      id?: number;
      pitlane_number: number;
      kart_status: number;
    } | undefined;

    if (!row) {
      return null;
    }

    return {
      id: row.id,
      pitlaneNumber: row.pitlane_number,
      kartStatus: row.kart_status
    };
  }

  save(pitlaneKartStatus: PitlaneKartStatusEntity): void {
    const existing = this.findByPitlaneNumber(pitlaneKartStatus.pitlaneNumber);
    
    if (existing) {
      // Update existing record
      const stmt = this.db.prepare(`
        UPDATE pitlane_kart_status 
        SET kart_status = ? 
        WHERE pitlane_number = ?
      `);
      stmt.run(pitlaneKartStatus.kartStatus, pitlaneKartStatus.pitlaneNumber);
    } else {
      // Insert new record
      const stmt = this.db.prepare(`
        INSERT INTO pitlane_kart_status (pitlane_number, kart_status)
        VALUES (?, ?)
      `);
      stmt.run(pitlaneKartStatus.pitlaneNumber, pitlaneKartStatus.kartStatus);
    }
  }

  updateMany(updates: Array<{ pitlaneNumber: number; kartStatus: number }>): void {
    const updateStmt = this.db.prepare(`
      UPDATE pitlane_kart_status 
      SET kart_status = ? 
      WHERE pitlane_number = ?
    `);

    const insertStmt = this.db.prepare(`
      INSERT INTO pitlane_kart_status (pitlane_number, kart_status)
      VALUES (?, ?)
    `);

    const updateMany = this.db.transaction((updatesList: Array<{ pitlaneNumber: number; kartStatus: number }>) => {
      for (const update of updatesList) {
        const existing = this.findByPitlaneNumber(update.pitlaneNumber);
        
        if (existing) {
          updateStmt.run(update.kartStatus, update.pitlaneNumber);
        } else {
          insertStmt.run(update.pitlaneNumber, update.kartStatus);
        }
      }
    });

    updateMany(updates);
  }
}

