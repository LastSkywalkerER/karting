import { Request, Response } from 'express';
import { IRaceResultRepository, QueryOptions } from '../../domain/repositories/IRaceResultRepository';
import { IScraperService } from '../../domain/services/IScraperService';
import { ILapTimesService } from '../../domain/services/ILapTimesService';
import { ITeamKartStatusRepository } from '../../domain/repositories/ITeamKartStatusRepository';
import { IPitlaneKartStatusRepository } from '../../domain/repositories/IPitlaneKartStatusRepository';
import { PitlaneKartStatusEntity } from '../../domain/entities/PitlaneKartStatus';

export class RaceResultController {
  constructor(
    private repository: IRaceResultRepository,
    private scraperService: IScraperService,
    private lapTimesService: ILapTimesService,
    private teamKartStatusRepository: ITeamKartStatusRepository,
    private pitlaneKartStatusRepository: IPitlaneKartStatusRepository
  ) {}

  getHealth(_req: Request, res: Response): void {
    const status = this.scraperService.getStatus();
    res.json({
      status: 'ok',
      scraper: status
    });
  }

  async getResults(req: Request, res: Response): Promise<void> {
    try {
      const { limit, offset, sessionId } = req.query;

      const options: QueryOptions = {};
      if (limit) options.limit = parseInt(limit as string);
      if (offset) options.offset = parseInt(offset as string);
      if (sessionId) options.sessionId = sessionId as string;

      const results = this.repository.findAll(options);
      res.json({
        success: true,
        count: results.length,
        data: results
      });
    } catch (error) {
      console.error('Error getting results:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getLatestResults(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.query;
      
      if (!sessionId) {
        res.status(400).json({
          success: false,
          error: 'sessionId query parameter is required'
        });
        return;
      }

      const results = this.repository.findLatestBySessionId(sessionId as string);
      res.json({
        success: true,
        count: results.length,
        data: results
      });
    } catch (error) {
      console.error('Error getting latest results:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getTimestamps(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.query;
      
      if (!sessionId) {
        res.status(400).json({
          success: false,
          error: 'sessionId query parameter is required'
        });
        return;
      }

      const timestamps = this.repository.findTimestampsBySessionId(sessionId as string);
      res.json({
        success: true,
        count: timestamps.length,
        data: timestamps
      });
    } catch (error) {
      console.error('Error getting timestamps:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getLapTimesTable(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.query;
      
      if (!sessionId) {
        res.status(400).json({
          success: false,
          error: 'sessionId query parameter is required'
        });
        return;
      }

      const results = this.repository.findAll({ sessionId: sessionId as string });
      const lapTimesTable = this.lapTimesService.buildLapTimesTable(results);
      
      res.json({
        success: true,
        ...lapTimesTable
      });
    } catch (error) {
      console.error('Error getting lap times table:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getTeamKartStatuses(_req: Request, res: Response): Promise<void> {
    try {
      const teams = this.teamKartStatusRepository.findAll();
      res.json({
        success: true,
        count: teams.length,
        data: teams.map(team => ({
          teamNumber: team.teamNumber,
          kartStatus: team.kartStatus
        }))
      });
    } catch (error) {
      console.error('Error getting team kart statuses:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async updateTeamKartStatuses(req: Request, res: Response): Promise<void> {
    try {
      const { updates } = req.body;

      if (!Array.isArray(updates)) {
        res.status(400).json({
          success: false,
          error: 'Updates must be an array'
        });
        return;
      }

      // Validate updates
      for (const update of updates) {
        if (!update.teamNumber || typeof update.teamNumber !== 'string') {
          res.status(400).json({
            success: false,
            error: 'Each update must have a teamNumber (string)'
          });
          return;
        }
        if (typeof update.kartStatus !== 'number' || update.kartStatus < 1 || update.kartStatus > 5) {
          res.status(400).json({
            success: false,
            error: 'Each update must have a kartStatus (number between 1 and 5)'
          });
          return;
        }
      }

      this.teamKartStatusRepository.updateMany(updates);

      res.json({
        success: true,
        message: `Updated ${updates.length} team kart status(es)`
      });
    } catch (error) {
      console.error('Error updating team kart statuses:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getPitlaneKartStatuses(_req: Request, res: Response): Promise<void> {
    try {
      const pitlanes = this.pitlaneKartStatusRepository.findAll();
      res.json({
        success: true,
        count: pitlanes.length,
        data: pitlanes.map(pitlane => ({
          pitlaneNumber: pitlane.pitlaneNumber,
          kartStatus: pitlane.kartStatus
        }))
      });
    } catch (error) {
      console.error('Error getting pitlane kart statuses:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async updatePitlaneKartStatuses(req: Request, res: Response): Promise<void> {
    try {
      const { updates } = req.body;

      if (!Array.isArray(updates)) {
        res.status(400).json({
          success: false,
          error: 'Updates must be an array'
        });
        return;
      }

      // Validate updates
      for (const update of updates) {
        if (typeof update.pitlaneNumber !== 'number' || update.pitlaneNumber < 1 || update.pitlaneNumber > 4) {
          res.status(400).json({
            success: false,
            error: 'Each update must have a pitlaneNumber (number between 1 and 4)'
          });
          return;
        }
        if (typeof update.kartStatus !== 'number' || update.kartStatus < 1 || update.kartStatus > 5) {
          res.status(400).json({
            success: false,
            error: 'Each update must have a kartStatus (number between 1 and 5)'
          });
          return;
        }
      }

      // Validate entities before updating
      updates.forEach(update => {
        PitlaneKartStatusEntity.create({
          pitlaneNumber: update.pitlaneNumber,
          kartStatus: update.kartStatus
        });
      });

      this.pitlaneKartStatusRepository.updateMany(updates);

      res.json({
        success: true,
        message: `Updated ${updates.length} pitlane kart status(es)`
      });
    } catch (error) {
      console.error('Error updating pitlane kart statuses:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}

