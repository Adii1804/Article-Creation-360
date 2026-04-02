/**
 * Watcher Routes
 * Called by the external file-watcher service (not human users).
 * Requires X-Watcher-Key header instead of JWT.
 */

import { Router } from 'express';
import multer from 'multer';
import { EnhancedExtractionController } from '../controllers/enhancedExtractionController';

const router = Router();
const enhancedController = new EnhancedExtractionController();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '15728640'), // 15MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Supported: JPEG, PNG, WebP'));
    }
  }
});

/**
 * POST /api/watcher/extract/upload
 *
 * Accepts multipart/form-data with:
 *   - image             (file)
 *   - schema            (JSON string)
 *   - categoryName      (string)
 *   - source            → always "WATCHER"
 *   - image_unc_path    → full UNC path for duplicate detection
 *   - watcher_division  → e.g. "MENS"
 *   - watcher_vendor_name
 *   - watcher_vendor_code
 *   - watcher_major_category
 *   - watcher_sub_division
 *   - watcher_mc_code
 */
router.post('/extract/upload',
  upload.single('image'),
  enhancedController.extractFromUploadVLM
);

export default router;
