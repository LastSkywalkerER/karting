import { Router } from 'express';
import { syncController } from '../controllers/SyncController';

const router = Router();

// POST /api/sync - Bi-directional sync endpoint
router.post('/', (req, res) => syncController.sync(req, res));

export const syncRoutes = router;
