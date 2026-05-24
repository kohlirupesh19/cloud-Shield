import { Router } from 'express';
import auth from '../middleware/auth';
import { analysisController } from '../controllers/analysis.controller';

const router = Router();

router.use(auth);
router.post('/quality', analysisController.runQuality);
router.post('/security', analysisController.runSecurity);
router.post('/governance', analysisController.runGovernance);
router.post('/compliance', analysisController.runCompliance);
router.post('/workflow', analysisController.runCombined);
router.get('/history', analysisController.history);
router.get('/status/:id', analysisController.status);

export default router;
