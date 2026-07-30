import { Router } from 'express';
import ExternalApiController from '../controllers/ExternalApiController.js';

const router = Router();

router.get('/positions/aggregate', ExternalApiController.positionAggregate);

export default router;