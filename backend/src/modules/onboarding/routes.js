import { Router } from 'express';
import { asyncHandler } from '../../utils/http.js';
import { authRequired } from '../../middleware/auth.js';
import { step1, step2, step3, step4, step5, step6, step7, status } from './controller.js';

const router = Router();

router.post('/step1', asyncHandler(step1));
router.post('/step2', authRequired, asyncHandler(step2));
router.post('/step3', authRequired, asyncHandler(step3));
router.post('/step4', authRequired, asyncHandler(step4));
router.post('/step5', authRequired, asyncHandler(step5));
router.post('/step6', authRequired, asyncHandler(step6));
router.post('/step7', authRequired, asyncHandler(step7));
router.get('/status', authRequired, asyncHandler(status));

export default router;
