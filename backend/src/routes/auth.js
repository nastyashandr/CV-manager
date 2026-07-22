import { Router } from 'express';
import AuthController from '../controllers/AuthController.js';
import AuthMiddleware from '../middleware/auth.js';

const router = Router();

router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.get('/me', AuthMiddleware.authenticate, AuthController.me);

export default router;