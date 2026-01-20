import { Router } from 'express';
import { TeamController } from '../controllers/TeamController';

const router = Router();
const controller = new TeamController();

// POST /api/teams - create team
router.post('/', (req, res) => controller.create(req, res));

// GET /api/teams - get all teams
router.get('/', (req, res) => controller.getAll(req, res));

// GET /api/teams/:id - get team by id
router.get('/:id', (req, res) => controller.getById(req, res));

// PUT /api/teams/:id - update team
router.put('/:id', (req, res) => controller.update(req, res));

// DELETE /api/teams/:id - delete team
router.delete('/:id', (req, res) => controller.delete(req, res));

export { router as teamRoutes };
