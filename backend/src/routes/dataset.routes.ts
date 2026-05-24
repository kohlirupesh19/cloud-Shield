import { Router } from 'express';
import auth from '../middleware/auth';
import upload from '../middleware/upload';
import { datasetController } from '../controllers/dataset.controller';

const router = Router();
router.use(auth);

router.post('/upload', upload.single('file'), datasetController.upload);
router.get('/', datasetController.list);
router.get('/:id/validate', datasetController.validate);
router.delete('/:id', datasetController.remove);

export default router;
