import { Router } from 'express';
import auth from '../middleware/auth';
import { governanceController } from '../controllers/governance.controller';

const router = Router();
router.use(auth);

router.get('/policies', governanceController.policies);
router.get('/violations', governanceController.violations);
router.get('/lineage', governanceController.lineage);
router.get('/compliance-status', governanceController.complianceStatus);
router.post('/policies', governanceController.createPolicy);

export default router;
