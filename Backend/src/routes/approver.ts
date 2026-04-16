import { Router } from 'express';
import { ApproverController } from '../controllers/ApproverController';
import { authenticate, requireApprover } from '../middleware/auth';

const router = Router();

// Apply middleware to all routes
router.use(authenticate);
router.use(requireApprover);

// Get attributes for dropdowns
router.get('/attributes', ApproverController.getAttributes);

// Get items for dashboard
router.get('/items', ApproverController.getItems);

// Export ALL items matching current filters (no pagination)
router.get('/items/export-all', ApproverController.exportAll);

// Update specific item (edit extracted data)
router.put('/items/:id', ApproverController.updateItem);

// Approve selected items
router.post('/approve', ApproverController.approveItems);

// Reject selected items
router.post('/reject', ApproverController.rejectItems);

// Refresh image URL (fixes expired signed URLs)
router.get('/image/:id', ApproverController.getImageUrl);

// Variant routes
router.get('/items/:id/variants', ApproverController.getVariants);
router.post('/items/:id/add-color', ApproverController.addColor);
router.post('/items/:id/sync-color', ApproverController.syncColorToVariants);

// Admin: backfill article descriptions for a date range
// POST /api/approver/backfill-descriptions?fromDate=2026-04-10&toDate=2026-04-16
router.post('/backfill-descriptions', ApproverController.backfillDescriptions);

export default router;
