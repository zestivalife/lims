import { Router } from 'express';
import { allow } from '../../middleware/rbac.js';
import { asyncHandler } from '../../utils/http.js';
import { listInvoices, taxSummary } from './controller.js';

const router = Router();

router.get('/invoices', allow('billing:read'), asyncHandler(listInvoices));
router.get('/summary', allow('billing:read'), asyncHandler(taxSummary));

export default router;
