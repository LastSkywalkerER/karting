import { Request, Response } from 'express';
import { RaceService } from '../services/RaceService';

export class RaceController {
  private service: RaceService;

  constructor() {
    this.service = new RaceService();
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const { name, date } = req.body;

      if (!name || !date) {
        res.status(400).json({ success: false, error: 'Name and date are required' });
        return;
      }

      const race = await this.service.createRace({ name, date });
      res.status(201).json({ success: true, data: race });
    } catch (error) {
      console.error('Error creating race:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getAll(_req: Request, res: Response): Promise<void> {
    try {
      const races = await this.service.getAllRaces();
      res.json({ success: true, count: races.length, data: races });
    } catch (error) {
      console.error('Error getting races:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({ success: false, error: 'Invalid ID' });
        return;
      }

      const race = await this.service.getRaceById(id);
      if (!race) {
        res.status(404).json({ success: false, error: 'Race not found' });
        return;
      }

      res.json({ success: true, data: race });
    } catch (error) {
      console.error('Error getting race:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({ success: false, error: 'Invalid ID' });
        return;
      }

      const { name, date } = req.body;
      const race = await this.service.updateRace(id, { name, date });
      
      if (!race) {
        res.status(404).json({ success: false, error: 'Race not found' });
        return;
      }

      res.json({ success: true, data: race });
    } catch (error) {
      console.error('Error updating race:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({ success: false, error: 'Invalid ID' });
        return;
      }

      await this.service.deleteRace(id);
      res.json({ success: true, message: 'Race deleted' });
    } catch (error) {
      console.error('Error deleting race:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async addTeam(req: Request, res: Response): Promise<void> {
    try {
      const raceId = parseInt(req.params.id);
      if (isNaN(raceId)) {
        res.status(400).json({ success: false, error: 'Invalid race ID' });
        return;
      }

      const { teamId, number } = req.body;
      const numberValue = String(number || '').trim();
      if (!teamId || !numberValue) {
        res.status(400).json({ success: false, error: 'teamId and number are required' });
        return;
      }

      await this.service.addTeamToRace(raceId, teamId, numberValue);
      res.json({ success: true, message: 'Team added to race' });
    } catch (error) {
      console.error('Error adding team to race:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async removeTeam(req: Request, res: Response): Promise<void> {
    try {
      const raceId = parseInt(req.params.id);
      const teamId = parseInt(req.params.teamId);
      
      if (isNaN(raceId) || isNaN(teamId)) {
        res.status(400).json({ success: false, error: 'Invalid race ID or team ID' });
        return;
      }

      await this.service.removeTeamFromRace(raceId, teamId);
      res.json({ success: true, message: 'Team removed from race' });
    } catch (error) {
      console.error('Error removing team from race:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}
