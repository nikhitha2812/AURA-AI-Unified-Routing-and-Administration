import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { authenticateToken, requirePermission } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticateToken);

router.get('/overview', requirePermission('analytics.read'), AdminController.getOverview);
router.get('/users', requirePermission('users.read'), AdminController.listMembers);
router.post('/users/invite', requirePermission('users.create'), AdminController.inviteMember);
router.patch('/users/:memberId/role', requirePermission('users.update'), AdminController.updateMemberRole);

router.get('/models', requirePermission('models.read'), AdminController.listModels);
router.patch('/models/:id', requirePermission('models.manage'), AdminController.updateModel);
router.post('/models/:id/test', requirePermission('models.manage'), AdminController.testModelConnection);

router.get('/security/events', requirePermission('security.read'), AdminController.getSecurityEvents);
router.get('/audit-logs', requirePermission('audit.read'), AdminController.getAuditTrail);

export default router;
