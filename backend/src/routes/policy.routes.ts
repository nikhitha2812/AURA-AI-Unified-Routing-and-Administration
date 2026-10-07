import { Router } from 'express';
import { PolicyController, uploadMiddleware } from '../controllers/policy.controller';
import { authenticateToken, requirePermission } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticateToken);

router.get('/documents', requirePermission('policies.read'), PolicyController.getDocuments);
router.post(
  '/documents',
  requirePermission('policies.upload'),
  uploadMiddleware.single('file'),
  PolicyController.uploadDocument
);

router.get('/rules', requirePermission('policies.read'), PolicyController.getRules);
router.patch('/rules/:id/review', requirePermission('policies.approve'), PolicyController.reviewRule);
router.delete('/rules/:id', requirePermission('policies.manage'), PolicyController.deleteRule);

export default router;
