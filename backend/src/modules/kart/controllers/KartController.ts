import { Request, Response } from 'express';
import { KartService } from '../services/KartService';

export class KartController {
  private service: KartService;

  constructor() {
    this.service = new KartService();
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const { raceId, status, teamId } = req.body;

      if (!raceId) {
        res.status(400).json({ success: false, error: 'raceId is required' });
        return;
      }

      const kart = await this.service.createKart({ raceId, status, teamId });
      res.status(201).json({ success: true, data: kart });
    } catch (error) {
      console.error('Error creating kart:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async createBulk(req: Request, res: Response): Promise<void> {
    try {
      const { raceId, count } = req.body;

      if (!raceId || !count) {
        res.status(400).json({ success: false, error: 'raceId and count are required' });
        return;
      }

      const karts = await this.service.createManyKarts(raceId, count);
      res.status(201).json({ success: true, count: karts.length, data: karts });
    } catch (error) {
      console.error('Error creating karts:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const raceId = req.query.raceId ? parseInt(req.query.raceId as string) : undefined;
      
      if (raceId !== undefined && isNaN(raceId)) {
        res.status(400).json({ success: false, error: 'Invalid raceId' });
        return;
      }

      const karts = raceId 
        ? await this.service.getKartsByRace(raceId)
        : [];
      
      res.json({ success: true, count: karts.length, data: karts });
    } catch (error) {
      console.error('Error getting karts:', error);
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

      const kart = await this.service.getKartById(id);
      if (!kart) {
        res.status(404).json({ success: false, error: 'Kart not found' });
        return;
      }

      res.json({ success: true, data: kart });
    } catch (error) {
      console.error('Error getting kart:', error);
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

      const { status, teamId } = req.body;
      const kart = await this.service.updateKart(id, { status, teamId });
      
      if (!kart) {
        res.status(404).json({ success: false, error: 'Kart not found' });
        return;
      }

      res.json({ success: true, data: kart });
    } catch (error) {
      console.error('Error updating kart:', error);
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

      await this.service.deleteKart(id);
      res.json({ success: true, message: 'Kart deleted' });
    } catch (error) {
      console.error('Error deleting kart:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}
