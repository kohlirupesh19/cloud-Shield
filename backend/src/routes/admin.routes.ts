import { Router } from 'express';
import auth from '../middleware/auth';
import rbac from '../middleware/rbac';
import { adminController } from '../controllers/admin.controller';

const router = Router();
router.use(auth);

router.get('/users', rbac('SUPER_ADMIN', 'ORG_ADMIN'), adminController.users);
router.get('/organizations', rbac('SUPER_ADMIN'), adminController.organizations);
router.get('/audit-logs', rbac('SUPER_ADMIN', 'ORG_ADMIN'), adminController.auditLogs);
router.get('/api-usage', rbac('SUPER_ADMIN', 'ORG_ADMIN'), adminController.apiUsage);
router.get('/system-health', rbac('SUPER_ADMIN', 'ORG_ADMIN'), adminController.systemHealth);

export default router;
