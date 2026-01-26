import { Request, Response } from 'express';
import { syncService, type SyncRequest } from '../services/SyncService';

export class SyncController {
  async sync(req: Request, res: Response): Promise<void> {
    try {
      const syncRequest: SyncRequest = req.body;

      // Validate request
      if (typeof syncRequest.lastSyncTimestamp !== 'number') {
        res.status(400).json({ error: 'lastSyncTimestamp is required and must be a number' });
        return;
      }

      if (!syncRequest.changes) {
        res.status(400).json({ error: 'changes object is required' });
        return;
      }

      const response = await syncService.sync(syncRequest);
      res.json(response);
    } catch (error) {
      console.error('Sync error:', error);
      res.status(500).json({ error: 'Internal server error during sync' });
    }
  }
}

export const syncController = new SyncController();
