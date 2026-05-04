import { Router } from 'express';
import { allow } from '../../middleware/rbac.js';
import { asyncHandler } from '../../utils/http.js';
import { createPatient, getPatient, listPatients, mergeDuplicates, patientHistory, updatePatient } from './controller.js';

const router = Router();

router.get('/', allow('patients:read'), asyncHandler(listPatients));
router.post('/', allow('patients:write'), asyncHandler(createPatient));
router.get('/:id', allow('patients:read'), asyncHandler(getPatient));
router.put('/:id', allow('patients:write'), asyncHandler(updatePatient));
router.get('/:id/history', allow('patients:read'), asyncHandler(patientHistory));
router.post('/merge', allow('patients:write'), asyncHandler(mergeDuplicates));

export default router;
