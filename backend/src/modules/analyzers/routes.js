import { Router } from 'express';
import { allow } from '../../middleware/rbac.js';
import { asyncHandler } from '../../utils/http.js';
import {
  createAnalyzer,
  createMapping,
  dispatchOrderToAnalyzer,
  getAnalyzerLogs,
  getMachineMessageLogs,
  listMappings,
  ingestAstmPayload,
  ingestCsvPayload,
  ingestHl7Payload,
  listAnalyzers,
  testConnection,
  updateAnalyzer
} from './controller.js';

const router = Router();

router.get('/', allow('dashboard:read'), asyncHandler(listAnalyzers));
router.post('/', allow('dashboard:read'), asyncHandler(createAnalyzer));
router.put('/:id', allow('dashboard:read'), asyncHandler(updateAnalyzer));
router.post('/:id/test-connection', allow('dashboard:read'), asyncHandler(testConnection));
router.get('/:id/logs', allow('dashboard:read'), asyncHandler(getAnalyzerLogs));
router.post('/mapping', allow('dashboard:read'), asyncHandler(createMapping));
router.get('/mappings', allow('dashboard:read'), asyncHandler(listMappings));
router.get('/message-logs', allow('dashboard:read'), asyncHandler(getMachineMessageLogs));
router.post('/dispatch-order', allow('dashboard:read'), asyncHandler(dispatchOrderToAnalyzer));
router.post('/ingest/hl7', allow('dashboard:read'), asyncHandler(ingestHl7Payload));
router.post('/ingest/astm', allow('dashboard:read'), asyncHandler(ingestAstmPayload));
router.post('/ingest/csv', allow('dashboard:read'), asyncHandler(ingestCsvPayload));

export default router;
