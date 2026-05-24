import { Router } from 'express';
import auth from '../middleware/auth';
import { securityController } from '../controllers/security.controller';

const router = Router();
router.use(auth);

router.get('/alerts', securityController.alerts);
router.get('/incidents', securityController.incidents);
router.get('/threat-scoring', securityController.threatScoring);
router.get('/anomaly-history', securityController.anomalyHistory);
router.post('/log-access', securityController.logAccess);
router.patch('/resolve/:id', securityController.resolve);
router.get('/stats', securityController.stats);

export default router;
