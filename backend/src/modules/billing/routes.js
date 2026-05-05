import { Router } from 'express';
import { allow } from '../../middleware/rbac.js';
import { asyncHandler } from '../../utils/http.js';
import { listInvoices, recordPayment, taxSummary } from './controller.js';

const router = Router();

router.get('/invoices', allow('billing:read'), asyncHandler(listInvoices));
router.get('/summary', allow('billing:read'), asyncHandler(taxSummary));
router.post('/payments', allow('billing:write'), asyncHandler(recordPayment));

export default router;
