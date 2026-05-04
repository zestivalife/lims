import rateLimit from 'express-rate-limit';
import { prisma } from '../config/prisma.js';
import { hashValue } from '../utils/encryption.js';

export const generalRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests. Please retry in one minute.' }
});

export async function otpRateLimiter(req, res, next) {
  try {
    const phone = req.body.phone;
    if (!phone) {
      return res.status(400).json({ message: 'Phone is required for OTP.' });
    }
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const count = await prisma.otpLog.count({
      where: {
        phone: hashValue(phone),
        createdAt: { gte: oneHourAgo }
      }
    });
    if (count >= 5) {
      return res.status(429).json({ message: 'OTP request limit reached (5/hour).' });
    }
    next();
  } catch (error) {
    next(error);
  }
}
