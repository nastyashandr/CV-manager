import { Router } from 'express';
import AttributeController from '../controllers/AttributeController.js';
import AuthMiddleware from '../middleware/auth.js';

const router = Router();

router.get('/', AttributeController.list);
router.get('/categories', AttributeController.categories);
router.get('/my', AuthMiddleware.authenticate, AuthMiddleware.allow('recruiter'), AttributeController.getMyAttributes);
router.post('/', AuthMiddleware.authenticate, AuthMiddleware.allow('recruiter'), AttributeController.create);
router.put('/:id', AuthMiddleware.authenticate, AuthMiddleware.allow('recruiter'), AttributeController.update);
router.delete('/:id', AuthMiddleware.authenticate, AuthMiddleware.allow('recruiter'), AttributeController.remove);

export default router;