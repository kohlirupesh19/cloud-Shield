import { Router } from 'express';
import authRoutes from './auth.routes';
import dashboardRoutes from './dashboard.routes';
import analysisRoutes from './analysis.routes';
import reportRoutes from './report.routes';
import adminRoutes from './admin.routes';
import healthRoutes from './health.routes';
import datasetRoutes from './dataset.routes';
import governanceRoutes from './governance.routes';
import securityRoutes from './security.routes';
import settingsRoutes from './settings.routes';

const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/analysis', analysisRoutes);
router.use('/datasets', datasetRoutes);
router.use('/governance', governanceRoutes);
router.use('/security', securityRoutes);
router.use('/reports', reportRoutes);
router.use('/admin', adminRoutes);
router.use('/settings', settingsRoutes);

export default router;
