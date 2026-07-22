import { Router } from 'express';
import SearchController from '../controllers/SearchController.js';
import AuthMiddleware from '../middleware/auth.js';

const router = Router();
router.get('/', AuthMiddleware.optional(), SearchController.search);

export default router;
