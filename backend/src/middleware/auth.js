import { verifyAccessToken } from '../utils/jwt.js';

export function authRequired(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token) {
      return res.status(401).json({ message: 'Authorization token missing' });
    }
    const payload = verifyAccessToken(token);
    req.user = {
      id: payload.userId,
      tenantId: payload.tenantId,
      role: payload.role,
      email: payload.email,
      phone: payload.phone
    };
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired. Please refresh token.' });
    }
    return res.status(401).json({ message: 'Invalid token' });
  }
}

export function optionalAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme === 'Bearer' && token) {
    try {
      const payload = verifyAccessToken(token);
      req.user = {
        id: payload.userId,
        tenantId: payload.tenantId,
        role: payload.role,
        email: payload.email,
        phone: payload.phone
      };
    } catch {
      req.user = null;
    }
  }
  next();
}
