import { Router } from 'express';
import { getFieldConfigs, getAttributeValues } from '../controllers/articleConfigController';

const router = Router();

router.get('/fields', getFieldConfigs);
router.get('/values', getAttributeValues);

export default router;
