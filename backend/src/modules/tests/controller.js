import { prisma } from '../../config/prisma.js';
import { getIo } from '../../config/socket.js';
import { env } from '../../config/env.js';
import { parsePagination, requireFields } from '../../utils/validators.js';

function evaluateStatus(value, referenceRange) {
  const n = Number(value);
  if (Number.isNaN(n)) return 'NORMAL';
  const parts = String(referenceRange || '').split('-').map((v) => Number(v.trim()));
  if (parts.length === 2 && !Number.isNaN(parts[0]) && !Number.isNaN(parts[1])) {
    if (n < parts[0] || n > parts[1]) return 'ABNORMAL';
  }
  return 'NORMAL';
}

export async function getCatalog(req, res) {
  const { skip, take, page, pageSize } = parsePagination(req.query);
  const q = req.query.q?.trim();

  const where = {
    tenantId: req.user.tenantId,
    isActive: true,
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { code: { contains: q, mode: 'insensitive' } },
            { category: { contains: q, mode: 'insensitive' } }
          ]
        }
      : {})
  };

  const [data, total] = await Promise.all([
    prisma.testCatalog.findMany({ where, skip, take, orderBy: { name: 'asc' } }),
    prisma.testCatalog.count({ where })
  ]);

  res.json({ page, pageSize, total, data });
}

export async function createOrder(req, res) {
  requireFields(req.body, ['patientId', 'testCatalogIds', 'orderedBy']);

  const order = await prisma.testOrder.create({
    data: {
      tenantId: req.user.tenantId,
      patientId: req.body.patientId,
      orderedBy: req.body.orderedBy,
      status: req.body.status || 'PENDING',
      priority: req.body.priority || 'ROUTINE',
      sampleCollectedAt: req.body.sampleCollectedAt ? new Date(req.body.sampleCollectedAt) : null
    }
  });

  const tests = await prisma.testCatalog.findMany({
    where: {
      id: { in: req.body.testCatalogIds },
      tenantId: req.user.tenantId
    }
  });

  const invoiceSubtotal = tests.reduce((sum, item) => sum + Number(item.price), 0);
  const tenant = await prisma.tenant.findUnique({
    where: { id: req.user.tenantId },
    include: { region: true }
  });
  const taxRate = Number(tenant.region.taxRate) || 0;
  const taxAmount = (invoiceSubtotal * taxRate) / 100;

  await prisma.invoice.create({
    data: {
      tenantId: req.user.tenantId,
      orderId: order.id,
      patientId: req.body.patientId,
      subtotal: invoiceSubtotal,
      taxAmount,
      taxType: tenant.region.taxType,
      total: invoiceSubtotal + taxAmount,
      currency: tenant.region.currency,
      status: 'PENDING'
    }
  });

  for (const test of tests) {
    await prisma.testResult.create({
      data: {
        orderId: order.id,
        testCatalogId: test.id,
        value: '',
        unit: test.unit,
        status: 'NORMAL',
        referenceRange: test.normalRangeMale,
        enteredBy: req.user.id,
        analyzerRawMessage: null
      }
    });
  }

  res.status(201).json({ message: 'Order created', orderId: order.id });
}

export async function getOrder(req, res) {
  const order = await prisma.testOrder.findFirst({
    where: {
      id: req.params.id,
      tenantId: req.user.tenantId
    },
    include: {
      patient: true,
      results: {
        include: {
          testCatalog: true
        }
      },
      invoice: true
    }
  });

  if (!order) {
    return res.status(404).json({ message: 'Order not found' });
  }

  res.json(order);
}

export async function updateOrderStatus(req, res) {
  requireFields(req.body, ['status']);

  const existing = await prisma.testOrder.findFirst({
    where: {
      id: req.params.id,
      tenantId: req.user.tenantId
    }
  });

  if (!existing) {
    return res.status(404).json({ message: 'Order not found' });
  }

  req.auditOldValue = existing;

  const updated = await prisma.testOrder.update({
    where: { id: req.params.id },
    data: {
      status: req.body.status,
      sampleCollectedAt: req.body.sampleCollectedAt ? new Date(req.body.sampleCollectedAt) : existing.sampleCollectedAt
    }
  });

  res.json(updated);
}

export async function manualResultEntry(req, res) {
  requireFields(req.body, ['orderId', 'results']);

  const order = await prisma.testOrder.findFirst({
    where: { id: req.body.orderId, tenantId: req.user.tenantId }
  });
  if (!order) {
    return res.status(404).json({ message: 'Order not found' });
  }

  const updates = [];
  for (const row of req.body.results) {
    const existing = await prisma.testResult.findFirst({
      where: { id: row.id, orderId: order.id }
    });
    if (!existing) continue;
    const status = evaluateStatus(row.value, row.referenceRange || existing.referenceRange);

    const updated = await prisma.testResult.update({
      where: { id: existing.id },
      data: {
        value: String(row.value),
        unit: row.unit || existing.unit,
        referenceRange: row.referenceRange || existing.referenceRange,
        status,
        enteredBy: req.user.id,
        receivedAt: new Date()
      },
      include: {
        testCatalog: true,
        order: true
      }
    });
    updates.push(updated);
    getIo().to(req.user.tenantId).emit('result:new', updated);
  }

  await prisma.testOrder.update({
    where: { id: order.id },
    data: { status: 'IN_PROGRESS' }
  });

  res.json({ message: 'Results saved', count: updates.length, data: updates });
}

export async function getResultsByOrder(req, res) {
  const results = await prisma.testResult.findMany({
    where: {
      orderId: req.params.orderId,
      order: { tenantId: req.user.tenantId }
    },
    include: {
      testCatalog: true,
      enteredByUser: { select: { id: true, email: true, role: true } },
      verifiedByUser: { select: { id: true, email: true, role: true } }
    },
    orderBy: { receivedAt: 'desc' }
  });

  res.json(results);
}

export async function internalResults(req, res) {
  const token = req.headers['x-internal-token'];
  if (token !== env.internalApiToken) {
    return res.status(401).json({ message: 'Unauthorized internal request' });
  }

  requireFields(req.body, ['orderId', 'patientId', 'testCode', 'value', 'unit', 'referenceRange', 'machineId', 'rawMessage']);

  const order = await prisma.testOrder.findUnique({
    where: { id: req.body.orderId }
  });
  if (!order) {
    return res.status(404).json({ message: 'Order not found for internal result ingestion' });
  }
  const tenantId = req.body.tenantId || order.tenantId;

  const testCatalog = await prisma.testCatalog.findFirst({
    where: {
      tenantId,
      code: req.body.testCode
    }
  });

  if (!testCatalog) {
    return res.status(400).json({ message: `Unknown test code: ${req.body.testCode}` });
  }

  const existing = await prisma.testResult.findFirst({
    where: {
      orderId: req.body.orderId,
      testCatalogId: testCatalog.id
    }
  });

  const status = evaluateStatus(req.body.value, req.body.referenceRange);
  const result = existing
    ? await prisma.testResult.update({
        where: { id: existing.id },
        data: {
          value: String(req.body.value),
          unit: req.body.unit,
          status,
          referenceRange: req.body.referenceRange,
          machineId: req.body.machineId,
          analyzerRawMessage: req.body.rawMessage,
          receivedAt: new Date(req.body.timestamp || Date.now())
        },
        include: {
          testCatalog: true,
          order: true
        }
      })
    : await prisma.testResult.create({
        data: {
          orderId: req.body.orderId,
          testCatalogId: testCatalog.id,
          value: String(req.body.value),
          unit: req.body.unit,
          status,
          referenceRange: req.body.referenceRange,
          machineId: req.body.machineId,
          enteredBy: req.body.enteredBy || req.body.userId,
          analyzerRawMessage: req.body.rawMessage,
          receivedAt: new Date(req.body.timestamp || Date.now())
        },
        include: {
          testCatalog: true,
          order: true
        }
      });

  await prisma.testOrder.update({
    where: { id: req.body.orderId },
    data: { status: 'IN_PROGRESS' }
  });

  getIo().to(tenantId).emit('result:new', result);

  return res.status(201).json({ message: 'Internal result ingested', resultId: result.id });
}
