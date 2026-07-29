import { Router } from 'express';
import SalesforceController from '../controllers/SalesforceController.js';
import AuthMiddleware from '../middleware/auth.js';

const router = Router();

router.use(AuthMiddleware.authenticate);

router.get('/status', SalesforceController.getStatus);

router.post('/sync', SalesforceController.sync);

router.delete('/sync', SalesforceController.deactivate);

export default router;