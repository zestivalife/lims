import { Router } from 'express';
import { allow } from '../../middleware/rbac.js';
import { asyncHandler } from '../../utils/http.js';
import {
  createOrder,
  getCatalog,
  getOrder,
  getResultsByOrder,
  internalResults,
  manualResultEntry,
  updateOrderStatus
} from './controller.js';

const router = Router();

router.get('/catalog', allow('tests:read'), asyncHandler(getCatalog));
router.post('/orders', allow('orders:write'), asyncHandler(createOrder));
router.get('/orders/:id', allow('tests:read'), asyncHandler(getOrder));
router.put('/orders/:id/status', allow('orders:write'), asyncHandler(updateOrderStatus));
router.post('/results/manual', allow('tests:results:manual'), asyncHandler(manualResultEntry));
router.get('/results/:orderId', allow('tests:read'), asyncHandler(getResultsByOrder));

export const internalRouter = Router();
internalRouter.post('/results', asyncHandler(internalResults));

export default router;
