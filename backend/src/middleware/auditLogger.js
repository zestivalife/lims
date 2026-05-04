import { prisma } from '../config/prisma.js';

const auditableMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];

export function auditLogger() {
  return async (req, res, next) => {
    if (!auditableMethods.includes(req.method)) {
      return next();
    }

    const oldJson = res.json.bind(res);
    let responseBody;

    res.json = (body) => {
      responseBody = body;
      return oldJson(body);
    };

    res.on('finish', async () => {
      if (res.statusCode >= 400) return;
      try {
        const tenantId = req.user?.tenantId || req.body?.tenantId;
        if (!tenantId) return;

        const entityType = req.baseUrl.replace('/api/', '').split('/')[0] || 'unknown';
        const entityId = req.params.id || responseBody?.id || responseBody?.data?.id || null;

        await prisma.auditLog.create({
          data: {
            tenantId,
            userId: req.user?.id || null,
            action: `${req.method} ${req.originalUrl}`,
            entityType,
            entityId,
            oldValue: req.auditOldValue || null,
            newValue: req.body || null,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'] || null
          }
        });
      } catch (error) {
        console.error('Audit logging failed:', error.message);
      }
    });

    next();
  };
}
