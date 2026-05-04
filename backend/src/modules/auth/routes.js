import { Router } from 'express';
import { asyncHandler } from '../../utils/http.js';
import { otpRateLimiter } from '../../middleware/rateLimiter.js';
import { login, refresh, register, sendOtp, verifyEmail, verifyOtp } from './controller.js';

const router = Router();

router.post('/register', asyncHandler(register));
router.post('/verify-email', asyncHandler(verifyEmail));
router.post('/login', asyncHandler(login));
router.post('/refresh', asyncHandler(refresh));
router.post('/otp/send', otpRateLimiter, asyncHandler(sendOtp));
router.post('/otp/verify', asyncHandler(verifyOtp));

export default router;
