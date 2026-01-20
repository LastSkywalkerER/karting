import { Router } from 'express';
import { PitlaneController } from '../controllers/PitlaneController';

const router = Router();
const controller = new PitlaneController();

// Config routes
// POST /api/pitlanes/configs - create config
router.post('/configs', (req, res) => controller.createConfig(req, res));

// GET /api/pitlanes/configs?raceId=:raceId - get config by race
router.get('/configs', (req, res) => controller.getConfig(req, res));

// PUT /api/pitlanes/configs/:id - update config
router.put('/configs/:id', (req, res) => controller.updateConfig(req, res));

// Current state routes
// GET /api/pitlanes/current?configId=:configId&lineNumber=:lineNumber - get current state
router.get('/current', (req, res) => controller.getCurrentState(req, res));

// POST /api/pitlanes/current/add - add kart to pitlane
router.post('/current/add', (req, res) => controller.addKart(req, res));

// DELETE /api/pitlanes/current/:id - remove kart from pitlane
router.delete('/current/:id', (req, res) => controller.removeKart(req, res));

// DELETE /api/pitlanes/current/line?configId=:configId&lineNumber=:lineNumber - clear line
router.delete('/current/line', (req, res) => controller.clearLine(req, res));

// History routes
// GET /api/pitlanes/history?configId=:configId&lineNumber=:lineNumber - get history
router.get('/history', (req, res) => controller.getHistory(req, res));

export { router as pitlaneRoutes };
