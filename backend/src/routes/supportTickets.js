import { Router } from 'express';
import SupportTicketController from '../controllers/SupportTicketController.js';
import AuthMiddleware from '../middleware/auth.js';

const router = Router();

router.post('/', AuthMiddleware.authenticate, SupportTicketController.create);

export default router;