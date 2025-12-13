import { Request, Response } from 'express';
import { IRaceResultRepository, QueryOptions } from '../../domain/repositories/IRaceResultRepository';
import { IScraperService } from '../../domain/services/IScraperService';
import { ILapTimesService } from '../../domain/services/ILapTimesService';

export class RaceResultController {
  constructor(
    private repository: IRaceResultRepository,
    private scraperService: IScraperService,
    private lapTimesService: ILapTimesService
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
}

