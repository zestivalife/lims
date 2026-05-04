import { Router } from 'express';
import { allow } from '../../middleware/rbac.js';
import { asyncHandler } from '../../utils/http.js';
import { deliverReport, downloadReport, generateReport, myPortalReports, signReport } from './controller.js';

const router = Router();

router.post('/generate', allow('reports:read'), asyncHandler(generateReport));
router.post('/:id/sign', allow('reports:sign'), asyncHandler(signReport));
router.get('/:id/download', allow('reports:read'), asyncHandler(downloadReport));
router.post('/:id/deliver', allow('reports:deliver'), asyncHandler(deliverReport));
router.get('/portal/my', allow('portal:self:read'), asyncHandler(myPortalReports));

export default router;
