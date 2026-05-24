import { Router } from 'express';
import auth from '../middleware/auth';
import rbac from '../middleware/rbac';
import { settingsController } from '../controllers/settings.controller';

const router = Router();
router.use(auth);

router.get('/', settingsController.get);
router.post('/', settingsController.update);
router.post('/reset-data', rbac('SUPER_ADMIN', 'ORG_ADMIN'), settingsController.resetData);

export default router;
