import { Router } from 'express';
import multer from 'multer';
import { allow } from '../../middleware/rbac.js';
import { asyncHandler } from '../../utils/http.js';
import {
  createDicomStudy,
  createCatalogTest,
  createImagingOrder,
  createOrder,
  getCatalog,
  listDicomStudies,
  listImagingOrders,
  listOrderAttachments,
  getOrder,
  listOrders,
  getResultsByOrder,
  internalResults,
  manualResultEntry,
  uploadOrderAttachment,
  updateOrderStatus
} from './controller.js';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }
});

router.get('/catalog', allow('tests:read'), asyncHandler(getCatalog));
router.post('/catalog', allow('tests:write'), asyncHandler(createCatalogTest));
router.get('/orders', allow('tests:read'), asyncHandler(listOrders));
router.post('/orders', allow('orders:write'), asyncHandler(createOrder));
router.get('/orders/:id', allow('tests:read'), asyncHandler(getOrder));
router.post('/orders/:id/imaging-orders', allow('orders:write'), asyncHandler(createImagingOrder));
router.get('/orders/:id/imaging-orders', allow('tests:read'), asyncHandler(listImagingOrders));
router.post('/orders/:id/attachments', allow('orders:write'), upload.single('file'), asyncHandler(uploadOrderAttachment));
router.get('/orders/:id/attachments', allow('tests:read'), asyncHandler(listOrderAttachments));
router.post('/orders/:id/dicom-studies', allow('orders:write'), asyncHandler(createDicomStudy));
router.get('/orders/:id/dicom-studies', allow('tests:read'), asyncHandler(listDicomStudies));
router.put('/orders/:id/status', allow('orders:write'), asyncHandler(updateOrderStatus));
router.post('/results/manual', allow('tests:results:manual'), asyncHandler(manualResultEntry));
router.get('/results/:orderId', allow('tests:read'), asyncHandler(getResultsByOrder));

export const internalRouter = Router();
internalRouter.post('/results', asyncHandler(internalResults));

export default router;
