import { Router } from 'express';
import { asyncHandler } from '../../utils/http.js';
import { listRegions } from './controller.js';

const router = Router();
router.get('/', asyncHandler(listRegions));

export default router;
