import multer from 'multer';
import path from 'path';
import fs from 'fs';
import ApiError from '../utils/ApiError';
import { env } from '../config/env';

if (!fs.existsSync(env.UPLOAD_DIR)) {
  fs.mkdirSync(env.UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, env.UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: Math.max(env.MAX_UPLOAD_MB, 1024) * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedExtensions = ['.pdf', '.csv', '.json', '.log'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      return cb(new ApiError(400, 'Invalid file type. Allowed: PDF, CSV, JSON, LOG'));
    }
    cb(null, true);
  },
});

export default upload;
