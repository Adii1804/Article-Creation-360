/**
 * Simplified Extraction Routes
 * 
 * Handles the simplified workflow:
 * - Department → Major Category selection
 * - Fixed 27 attributes
 * - 65% confidence threshold
 * - No metadata form
 */

import { Router } from 'express';
import multer from 'multer';
import { SimplifiedExtractionController } from '../controllers/simplifiedExtractionController';
import { authenticate } from '../middleware/auth';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

const controller = new SimplifiedExtractionController();

/**
 * POST /api/user/simplified/extract-upload
 * Extract attributes from uploaded image using simplified workflow
 */
router.post(
  '/extract-upload',
  authenticate,
  upload.single('image'),
  controller.extractSimplified
);

/**
 * POST /api/user/simplified/extract-base64
 * Extract attributes from base64 image using simplified workflow
 */
router.post(
  '/extract-base64',
  authenticate,
  controller.extractSimplifiedBase64
);

export default router;
