import { Router } from 'express';
import { allow } from '../../middleware/rbac.js';
import { asyncHandler } from '../../utils/http.js';
import {
  createAnalyzer,
  createMapping,
  getAnalyzerLogs,
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

export default router;
