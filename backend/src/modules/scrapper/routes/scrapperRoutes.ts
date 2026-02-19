import { Router, Request, Response } from 'express';
import { scrapperProxyService } from '../services/ScrapperProxyService';

const router = Router();

router.get('/races/:id/lap-times', async (req: Request, res: Response) => {
  try {
    const raceId = parseInt(req.params.id, 10);
    if (isNaN(raceId)) {
      res.status(400).json({ success: false, error: 'Invalid race id' });
      return;
    }
    const data = await scrapperProxyService.fetchLapTimes(raceId);
    if (data === null) {
      res.status(404).json({
        success: false,
        error: 'Race not found or has no SpeedHive URL',
      });
      return;
    }
    res.json(data);
  } catch (error) {
    console.error('Error fetching lap times:', error);
    res.status(502).json({
      success: false,
      error: error instanceof Error ? error.message : 'Proxy error',
    });
  }
});

router.get('/races/:id/pitlane-events', async (req: Request, res: Response) => {
  try {
    const raceId = parseInt(req.params.id, 10);
    if (isNaN(raceId)) {
      res.status(400).json({ success: false, error: 'Invalid race id' });
      return;
    }
    const acknowledged = req.query.acknowledged === 'true';
    const data = await scrapperProxyService.fetchPitlaneEvents(
      raceId,
      acknowledged
    );
    if (data === null) {
      res.status(404).json({
        success: false,
        error: 'Race not found or has no SpeedHive URL',
      });
      return;
    }
    res.json(data);
  } catch (error) {
    console.error('Error fetching pitlane events:', error);
    res.status(502).json({
      success: false,
      error: error instanceof Error ? error.message : 'Proxy error',
    });
  }
});

router.post(
  '/races/:raceId/pitlane-events/:eventId/acknowledge',
  async (req: Request, res: Response) => {
    try {
      const eventId = parseInt(req.params.eventId, 10);
      if (isNaN(eventId)) {
        res.status(400).json({ success: false, error: 'Invalid event id' });
        return;
      }
      await scrapperProxyService.acknowledgePitlaneEvent(eventId);
      res.json({ success: true, message: 'Event acknowledged' });
    } catch (error) {
      console.error('Error acknowledging event:', error);
      res.status(502).json({
        success: false,
        error: error instanceof Error ? error.message : 'Proxy error',
      });
    }
  }
);

export const scrapperRoutes = Router().use('/api', router);
