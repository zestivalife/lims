import http from 'http';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { Server as SocketIOServer } from 'socket.io';

import { env } from './src/config/env.js';
import { prisma } from './src/config/prisma.js';
import { setIo } from './src/config/socket.js';
import { authRequired } from './src/middleware/auth.js';
import { auditLogger } from './src/middleware/auditLogger.js';
import { generalRateLimiter } from './src/middleware/rateLimiter.js';
import { errorHandler, notFound } from './src/utils/http.js';

import authRoutes from './src/modules/auth/routes.js';
import onboardingRoutes from './src/modules/onboarding/routes.js';
import patientRoutes from './src/modules/patients/routes.js';
import testRoutes, { internalRouter as internalTestRoutes } from './src/modules/tests/routes.js';
import reportRoutes from './src/modules/reports/routes.js';
import analyzerRoutes from './src/modules/analyzers/routes.js';
import complianceRoutes from './src/modules/compliance/routes.js';
import regionRoutes from './src/modules/regions/routes.js';
import userRoutes from './src/modules/users/routes.js';
import billingRoutes from './src/modules/billing/routes.js';

const app = express();
const server = http.createServer(app);

const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});
setIo(io);

io.on('connection', (socket) => {
  socket.on('join-tenant', (tenantId) => {
    socket.join(tenantId);
  });
});

app.use(helmet());
app.use(cors({ origin: '*', credentials: true }));
app.use(cookieParser());
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use(generalRateLimiter);
app.use(auditLogger());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'backend', timestamp: new Date().toISOString() });
});

app.get('/api/dashboard/kpis', authRequired, async (req, res, next) => {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [
      todayRegistrations,
      pendingCollections,
      samplesInProcessing,
      reportsPendingAuth,
      reportsDelivered,
      criticalAlerts,
      revenueRows,
      recentPatients,
      analyzers
    ] = await Promise.all([
      prisma.patient.count({
        where: {
          tenantId: req.user.tenantId,
          createdAt: { gte: startOfToday }
        }
      }),
      prisma.testOrder.count({
        where: {
          tenantId: req.user.tenantId,
          sampleCollectedAt: null,
          status: { not: 'CANCELLED' }
        }
      }),
      prisma.testOrder.count({
        where: {
          tenantId: req.user.tenantId,
          status: 'IN_PROGRESS'
        }
      }),
      prisma.report.count({
        where: {
          tenantId: req.user.tenantId,
          signedAt: null
        }
      }),
      prisma.report.count({
        where: {
          tenantId: req.user.tenantId,
          deliveredAt: { not: null }
        }
      }),
      prisma.testResult.count({
        where: {
          order: { tenantId: req.user.tenantId },
          status: 'CRITICAL'
        }
      }),
      prisma.invoice.findMany({
        where: {
          tenantId: req.user.tenantId,
          createdAt: { gte: startOfToday },
          status: 'PAID'
        },
        select: {
          total: true,
          paidAmount: true,
          paymentMode: true
        }
      }),
      prisma.patient.findMany({
        where: { tenantId: req.user.tenantId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: { id: true, mrn: true, createdAt: true, gender: true }
      }),
      prisma.analyzer.findMany({
        where: { tenantId: req.user.tenantId },
        select: { id: true, name: true, isActive: true, lastConnectedAt: true }
      })
    ]);

    const revenueTodayBreakdown = revenueRows.reduce(
      (acc, invoice) => {
        const amount = Number(invoice.paidAmount ?? invoice.total ?? 0);
        acc.total += amount;
        const mode = invoice.paymentMode || 'CREDIT';
        if (mode === 'CASH') acc.cash += amount;
        if (mode === 'UPI') acc.upi += amount;
        if (mode === 'CARD') acc.card += amount;
        if (mode === 'CREDIT') acc.credit += amount;
        return acc;
      },
      { cash: 0, upi: 0, card: 0, credit: 0, total: 0 }
    );

    res.json({
      criticalAlerts,
      todayRegistrations,
      pendingCollections,
      samplesInProcessing,
      reportsPendingAuth,
      reportsDelivered,
      revenueToday: revenueTodayBreakdown.total,
      revenueTodayBreakdown,
      recentPatients,
      analyzers
    });
  } catch (error) {
    next(error);
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/onboarding', onboardingRoutes);
app.use('/api/regions', regionRoutes);
app.use('/api/internal', internalTestRoutes);
app.use('/api/patients', authRequired, patientRoutes);
app.use('/api/tests', authRequired, testRoutes);
app.use('/api/reports', authRequired, reportRoutes);
app.use('/api/analyzers', authRequired, analyzerRoutes);
app.use('/api/compliance', authRequired, complianceRoutes);
app.use('/api/users', authRequired, userRoutes);
app.use('/api/billing', authRequired, billingRoutes);

app.use(notFound);
app.use(errorHandler);

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

server.listen(env.port, '0.0.0.0', () => {
  console.log(`Backend running on port ${env.port}`);
});
