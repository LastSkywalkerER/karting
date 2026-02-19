import { Router } from 'express';
import { RaceResultController } from '../controllers/RaceResultController';

export function createRaceResultRoutes(controller: RaceResultController): Router {
  const router = Router();

  // Scrape routes
  router.get('/scrape/status', (req, res) => controller.getScrapeStatus(req, res));
  router.post('/scrape/start', (req, res) => controller.startScrape(req, res));

  // More specific routes first - register before general /results route
  router.get('/results/latest', (req, res) => controller.getLatestResults(req, res));
  router.get('/results/lap-times', (req, res) => controller.getLapTimesTable(req, res));
  router.get('/results', (req, res) => controller.getResults(req, res));
  router.get('/timestamps', (req, res) => controller.getTimestamps(req, res));

  // Pitlane entry events
  router.get('/events/pitlane-entries', (req, res) =>
    controller.getPitlaneEntryEvents(req, res)
  );
  router.post('/events/pitlane-entries/:id/acknowledge', (req, res) =>
    controller.acknowledgePitlaneEvent(req, res)
  );

  // Team kart status routes
  router.get('/teams/kart-status', (req, res) => controller.getTeamKartStatuses(req, res));
  router.put('/teams/kart-status', (req, res) => controller.updateTeamKartStatuses(req, res));

  // Pitlane kart status routes
  router.get('/pitlanes/kart-status', (req, res) => controller.getPitlaneKartStatuses(req, res));
  router.put('/pitlanes/kart-status', (req, res) => controller.updatePitlaneKartStatuses(req, res));

  return router;
}

