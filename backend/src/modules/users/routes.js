import { Router } from 'express';
import { allow } from '../../middleware/rbac.js';
import { asyncHandler } from '../../utils/http.js';
import { createUser, deactivateUser, listUsers, updateUser } from './controller.js';

const router = Router();

router.get('/', allow('dashboard:read'), asyncHandler(listUsers));
router.post('/', allow('dashboard:read'), asyncHandler(createUser));
router.put('/:id', allow('dashboard:read'), asyncHandler(updateUser));
router.delete('/:id', allow('dashboard:read'), asyncHandler(deactivateUser));

export default router;
