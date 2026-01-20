import { Request, Response } from 'express';
import { PitlaneService } from '../services/PitlaneService';

export class PitlaneController {
  private service: PitlaneService;

  constructor() {
    this.service = new PitlaneService();
  }

  // Config endpoints
  async createConfig(req: Request, res: Response): Promise<void> {
    try {
      const { raceId, linesCount, queueSize } = req.body;

      if (!raceId || !linesCount || !queueSize) {
        res.status(400).json({ success: false, error: 'raceId, linesCount, and queueSize are required' });
        return;
      }

      const config = await this.service.createConfig({ raceId, linesCount, queueSize });
      res.status(201).json({ success: true, data: config });
    } catch (error) {
      console.error('Error creating pitlane config:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getConfig(req: Request, res: Response): Promise<void> {
    try {
      const raceId = req.query.raceId ? parseInt(req.query.raceId as string) : undefined;
      
      if (raceId === undefined || isNaN(raceId)) {
        res.status(400).json({ success: false, error: 'raceId is required' });
        return;
      }

      const config = await this.service.getConfigByRaceId(raceId);
      if (!config) {
        res.status(404).json({ success: false, error: 'Pitlane config not found' });
        return;
      }

      res.json({ success: true, data: config });
    } catch (error) {
      console.error('Error getting pitlane config:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async updateConfig(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({ success: false, error: 'Invalid ID' });
        return;
      }

      const { linesCount, queueSize } = req.body;
      const config = await this.service.updateConfig(id, { linesCount, queueSize });
      
      if (!config) {
        res.status(404).json({ success: false, error: 'Pitlane config not found' });
        return;
      }

      res.json({ success: true, data: config });
    } catch (error) {
      console.error('Error updating pitlane config:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Current state endpoints
  async getCurrentState(req: Request, res: Response): Promise<void> {
    try {
      const configId = req.query.configId ? parseInt(req.query.configId as string) : undefined;
      const lineNumber = req.query.lineNumber ? parseInt(req.query.lineNumber as string) : undefined;

      if (configId === undefined || isNaN(configId)) {
        res.status(400).json({ success: false, error: 'configId is required' });
        return;
      }

      const entries = lineNumber !== undefined && !isNaN(lineNumber)
        ? await this.service.getCurrentByLine(configId, lineNumber)
        : await this.service.getCurrentByConfig(configId);

      res.json({ success: true, count: entries.length, data: entries });
    } catch (error) {
      console.error('Error getting pitlane current state:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async addKart(req: Request, res: Response): Promise<void> {
    try {
      const { pitlaneConfigId, teamId, kartId, lineNumber, assignTeamIdToOldKart } = req.body;

      if (!pitlaneConfigId || !teamId || !kartId || !lineNumber) {
        res.status(400).json({ 
          success: false, 
          error: 'pitlaneConfigId, teamId, kartId, and lineNumber are required' 
        });
        return;
      }

      await this.service.addKartToPitlane(pitlaneConfigId, teamId, kartId, lineNumber, assignTeamIdToOldKart);
      res.json({ success: true, message: 'Kart added to pitlane' });
    } catch (error) {
      console.error('Error adding kart to pitlane:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async removeKart(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({ success: false, error: 'Invalid ID' });
        return;
      }

      const { teamId } = req.body || {};
      await this.service.removeKartFromPitlane(id, teamId);
      res.json({ success: true, message: 'Kart removed from pitlane' });
    } catch (error) {
      console.error('Error removing kart from pitlane:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async clearLine(req: Request, res: Response): Promise<void> {
    try {
      const configId = req.query.configId ? parseInt(req.query.configId as string) : undefined;
      const lineNumber = req.query.lineNumber ? parseInt(req.query.lineNumber as string) : undefined;

      if (configId === undefined || isNaN(configId) || lineNumber === undefined || isNaN(lineNumber)) {
        res.status(400).json({ success: false, error: 'configId and lineNumber are required' });
        return;
      }

      await this.service.clearPitlaneLine(configId, lineNumber);
      res.json({ success: true, message: 'Pitlane line cleared' });
    } catch (error) {
      console.error('Error clearing pitlane line:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // History endpoints
  async getHistory(req: Request, res: Response): Promise<void> {
    try {
      const configId = req.query.configId ? parseInt(req.query.configId as string) : undefined;
      const lineNumber = req.query.lineNumber ? parseInt(req.query.lineNumber as string) : undefined;

      if (configId === undefined || isNaN(configId)) {
        res.status(400).json({ success: false, error: 'configId is required' });
        return;
      }

      const entries = lineNumber !== undefined && !isNaN(lineNumber)
        ? await this.service.getHistoryByLine(configId, lineNumber)
        : await this.service.getHistoryByConfig(configId);

      res.json({ success: true, count: entries.length, data: entries });
    } catch (error) {
      console.error('Error getting pitlane history:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}
