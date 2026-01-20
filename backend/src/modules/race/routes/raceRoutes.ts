import { Router } from 'express';
import { RaceController } from '../controllers/RaceController';

const router = Router();
const controller = new RaceController();

// POST /api/races - create race
router.post('/', (req, res) => controller.create(req, res));

// GET /api/races - get all races
router.get('/', (req, res) => controller.getAll(req, res));

// GET /api/races/:id - get race by id
router.get('/:id', (req, res) => controller.getById(req, res));

// PUT /api/races/:id - update race
router.put('/:id', (req, res) => controller.update(req, res));

// DELETE /api/races/:id - delete race
router.delete('/:id', (req, res) => controller.delete(req, res));

// POST /api/races/:id/teams - add team to race
router.post('/:id/teams', (req, res) => controller.addTeam(req, res));

// DELETE /api/races/:id/teams/:teamId - remove team from race
router.delete('/:id/teams/:teamId', (req, res) => controller.removeTeam(req, res));

export { router as raceRoutes };
