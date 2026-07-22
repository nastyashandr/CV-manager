import { Router } from 'express';
import PositionController from '../controllers/PositionController.js';
import AuthMiddleware from '../middleware/auth.js';

const router = Router();

router.get('/', AuthMiddleware.optional(), PositionController.list);
router.get('/latest', PositionController.latest);
router.get('/popular', PositionController.popular);
router.get('/:id', AuthMiddleware.optional(), PositionController.getOne);
router.get('/:id/cvs', AuthMiddleware.authenticate, AuthMiddleware.allow('recruiter'), PositionController.cvs);
router.post('/', AuthMiddleware.authenticate, AuthMiddleware.allow('recruiter'), PositionController.create);
router.post('/:id/duplicate', AuthMiddleware.authenticate, AuthMiddleware.allow('recruiter'), PositionController.duplicate);
router.put('/:id', AuthMiddleware.authenticate, AuthMiddleware.allow('recruiter'), PositionController.update);
router.delete('/:id', AuthMiddleware.authenticate, AuthMiddleware.allow('recruiter'), PositionController.remove);

export default router;
