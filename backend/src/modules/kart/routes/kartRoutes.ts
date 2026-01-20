import { Router } from 'express';
import { KartController } from '../controllers/KartController';

const router = Router();
const controller = new KartController();

// POST /api/karts - create kart
router.post('/', (req, res) => controller.create(req, res));

// POST /api/karts/bulk - create multiple karts
router.post('/bulk', (req, res) => controller.createBulk(req, res));

// GET /api/karts - get karts (requires raceId query param)
router.get('/', (req, res) => controller.getAll(req, res));

// GET /api/karts/:id - get kart by id
router.get('/:id', (req, res) => controller.getById(req, res));

// PUT /api/karts/:id - update kart
router.put('/:id', (req, res) => controller.update(req, res));

// DELETE /api/karts/:id - delete kart
router.delete('/:id', (req, res) => controller.delete(req, res));

export { router as kartRoutes };
