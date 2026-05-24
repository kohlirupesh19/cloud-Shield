import { Router } from 'express';
import auth from '../middleware/auth';
import { dashboardController } from '../controllers/dashboard.controller';

const router = Router();

router.use(auth);
router.get('/metrics', dashboardController.metrics);
router.get('/trends', dashboardController.trends);
router.get('/recent-analyses', dashboardController.recentAnalyses);
router.get('/risk-summary', dashboardController.riskSummary);
router.get('/anomaly-counts', dashboardController.anomalyCounts);

export default router;
