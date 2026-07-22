import { Router } from 'express';
import DiscussionController from '../controllers/DiscussionController.js';
import AuthMiddleware from '../middleware/auth.js';

const router = Router();

router.get('/:positionId', AuthMiddleware.optional(), DiscussionController.list);
router.post('/:positionId', AuthMiddleware.authenticate, DiscussionController.create);

export default router;
