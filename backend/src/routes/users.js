import { Router } from 'express';
import UserController from '../controllers/UserController.js';
import AuthMiddleware from '../middleware/auth.js';

const router = Router();
const auth = AuthMiddleware.authenticate;

router.get('/tags', UserController.projectTags);
router.get('/', auth, AuthMiddleware.allow('admin'), UserController.listUsers);
router.put('/:id/role', auth, AuthMiddleware.allow('admin'), UserController.setRole);
router.put('/:id/blocked', auth, AuthMiddleware.allow('admin'), UserController.setBlocked);
router.delete('/:id', auth, AuthMiddleware.allow('admin'), UserController.deleteUser);

router.get('/:id', AuthMiddleware.optional(), UserController.getProfile);
router.put('/:id', auth, UserController.updateMe);

router.post('/:id/attributes', auth, UserController.addAttribute);
router.delete('/:id/attributes/:attributeId', auth, UserController.removeAttribute);
router.put('/:id/attributes/:attributeId', auth, UserController.setAttributeValue);

router.get('/:id/projects', UserController.listProjects);
router.post('/:id/projects', auth, UserController.createProject);
router.put('/:id/projects/:projectId', auth, UserController.updateProject);
router.delete('/:id/projects/:projectId', auth, UserController.deleteProject);

export default router;