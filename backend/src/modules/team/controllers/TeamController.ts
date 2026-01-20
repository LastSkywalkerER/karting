import { Request, Response } from 'express';
import { TeamService } from '../services/TeamService';

export class TeamController {
  private service: TeamService;

  constructor() {
    this.service = new TeamService();
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const { name } = req.body;

      if (!name) {
        res.status(400).json({ success: false, error: 'Name is required' });
        return;
      }

      const team = await this.service.createTeam({ name });
      res.status(201).json({ success: true, data: team });
    } catch (error) {
      console.error('Error creating team:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getAll(_req: Request, res: Response): Promise<void> {
    try {
      const teams = await this.service.getAllTeams();
      res.json({ success: true, count: teams.length, data: teams });
    } catch (error) {
      console.error('Error getting teams:', error);
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

      const team = await this.service.getTeamById(id);
      if (!team) {
        res.status(404).json({ success: false, error: 'Team not found' });
        return;
      }

      res.json({ success: true, data: team });
    } catch (error) {
      console.error('Error getting team:', error);
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

      const { name } = req.body;
      const team = await this.service.updateTeam(id, { name });
      
      if (!team) {
        res.status(404).json({ success: false, error: 'Team not found' });
        return;
      }

      res.json({ success: true, data: team });
    } catch (error) {
      console.error('Error updating team:', error);
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

      await this.service.deleteTeam(id);
      res.json({ success: true, message: 'Team deleted' });
    } catch (error) {
      console.error('Error deleting team:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}
