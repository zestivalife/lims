import { Router } from 'express';
import { allow } from '../../middleware/rbac.js';
import { asyncHandler } from '../../utils/http.js';
import { auditLog, complianceReport, consent, policies } from './controller.js';

const router = Router();

router.get('/audit-log', allow('compliance:read'), asyncHandler(auditLog));
router.get('/policies/:region', allow('compliance:read'), asyncHandler(policies));
router.post('/consent', allow('compliance:read'), asyncHandler(consent));
router.get('/report', allow('compliance:read'), asyncHandler(complianceReport));

export default router;
