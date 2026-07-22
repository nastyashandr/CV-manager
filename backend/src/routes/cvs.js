import { Router } from 'express';
import CvController from '../controllers/CvController.js';
import AuthMiddleware from '../middleware/auth.js';

const router = Router();
const auth = AuthMiddleware.authenticate;

router.get('/', auth, AuthMiddleware.allow('candidate'), CvController.myList);
router.post('/', auth, AuthMiddleware.allow('candidate'), CvController.create);
router.get('/:id', auth, CvController.getOne);
router.put('/:id/attributes/:attributeId', auth, CvController.updateAttribute);
router.post('/:id/attributes', auth, CvController.addAttribute);
router.delete('/:id/attributes/:attributeId', auth, CvController.removeAttribute);
router.put('/:id/projects', auth, CvController.updateProjects);
router.post('/:id/publish', auth, CvController.publish);
router.delete('/:id', auth, CvController.remove);
router.post('/:id/like', auth, AuthMiddleware.allow('recruiter'), CvController.like);
router.delete('/:id/like', auth, AuthMiddleware.allow('recruiter'), CvController.unlike);

export default router;