import { Router } from 'express';
import StatsController from '../controllers/StatsController.js';

const router = Router();
router.get('/summary', StatsController.summary);
router.get('/tag-cloud', StatsController.tagCloud);

export default router;
