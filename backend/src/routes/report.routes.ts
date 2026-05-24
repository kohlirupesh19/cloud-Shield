import { Router } from 'express';
import auth from '../middleware/auth';
import { reportController } from '../controllers/report.controller';

const router = Router();
router.use(auth);

router.post('/generate', reportController.generate);
router.get('/summary', reportController.summary);
router.get('/download/:id', reportController.download);
router.get('/export/csv/:id', reportController.exportCsv);

export default router;
