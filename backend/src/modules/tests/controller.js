import { prisma } from '../../config/prisma.js';
import { getIo } from '../../config/socket.js';
import { env } from '../../config/env.js';
import { uploadBufferToS3 } from '../../config/s3.js';
import { parsePagination, requireFields } from '../../utils/validators.js';

function sanitizeFileName(name = 'file') {
  return String(name).replace(/[^a-zA-Z0-9._-]/g, '-');
}

const PANEL_ROWS_PREFIX = '__PANEL_ROWS__';

function evaluateStatus(value, referenceRange) {
  const n = Number(value);
  if (Number.isNaN(n)) return 'NORMAL';
  const parts = String(referenceRange || '').split('-').map((v) => Number(v.trim()));
  if (parts.length === 2 && !Number.isNaN(parts[0]) && !Number.isNaN(parts[1])) {
    if (n < parts[0] || n > parts[1]) return 'ABNORMAL';
  }
  return 'NORMAL';
}

function serializePanelRows(panelRows = [], existingRawMessage = null) {
  if (!Array.isArray(panelRows) || !panelRows.length) {
    return existingRawMessage;
  }

  return `${PANEL_ROWS_PREFIX}${JSON.stringify({
    rows: panelRows.map((row) => ({
      investigation: String(row.investigation || ''),
      value: String(row.value || ''),
      unit: String(row.unit || ''),
      referenceRange: String(row.referenceRange || ''),
      abnormal: Boolean(row.abnormal)
    }))
  })}`;
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

export async function createCatalogTest(req, res) {
  requireFields(req.body, ['code', 'name', 'category', 'unit', 'price']);

  const code = String(req.body.code).trim().toUpperCase();
  const duplicate = await prisma.testCatalog.findFirst({
    where: { tenantId: req.user.tenantId, code }
  });
  if (duplicate) {
    return res.status(409).json({ message: 'Test code already exists' });
  }

  const created = await prisma.testCatalog.create({
    data: {
      tenantId: req.user.tenantId,
      code,
      name: String(req.body.name).trim(),
      category: String(req.body.category).trim(),
      normalRangeMale: req.body.normalRangeMale || req.body.referenceRange || '',
      normalRangeFemale: req.body.normalRangeFemale || req.body.referenceRange || '',
      unit: String(req.body.unit).trim(),
      method: req.body.method || 'AUTO',
      turnaroundHours: Number(req.body.turnaroundHours || 24),
      price: Number(req.body.price || 0),
      isActive: req.body.isActive !== false
    }
  });

  res.status(201).json(created);
}

export async function listOrders(req, res) {
  const { skip, take, page, pageSize } = parsePagination(req.query);
  const q = req.query.q?.trim();
  const status = req.query.status?.trim();
  const priority = req.query.priority?.trim();
  const department = req.query.department?.trim();
  const quickFilter = req.query.quickFilter?.trim();
  const sort = req.query.sort?.trim();
  const dateFrom = req.query.dateFrom ? new Date(req.query.dateFrom) : null;
  const dateTo = req.query.dateTo ? new Date(req.query.dateTo) : null;
  const validDateFrom = dateFrom && !Number.isNaN(dateFrom.getTime()) ? dateFrom : null;
  const validDateTo = dateTo && !Number.isNaN(dateTo.getTime()) ? dateTo : null;

  const orderBy =
    sort === 'FIFO'
      ? [{ createdAt: 'asc' }]
      : sort === 'PRIORITY'
        ? [{ priority: 'desc' }, { createdAt: 'asc' }]
        : [{ createdAt: 'desc' }];

  const where = {
    tenantId: req.user.tenantId,
    ...(status ? { status } : {}),
    ...(priority && priority !== 'ALL' ? { priority } : {}),
    ...(department && department !== 'ALL'
      ? {
          results: {
            some: {
              testCatalog: {
                category: { equals: department, mode: 'insensitive' }
              }
            }
          }
        }
      : {}),
    ...(validDateFrom || validDateTo
      ? {
          createdAt: {
            ...(validDateFrom ? { gte: validDateFrom } : {}),
            ...(validDateTo ? { lte: new Date(new Date(validDateTo).setHours(23, 59, 59, 999)) } : {})
          }
        }
      : {}),
    ...(quickFilter === 'pending_collection'
      ? { status: 'PENDING' }
      : quickFilter === 'pending_result_entry'
        ? { status: 'IN_PROGRESS' }
        : quickFilter === 'pending_authentication'
          ? {
              status: 'COMPLETED',
              OR: [{ report: null }, { report: { signedAt: null } }]
            }
          : quickFilter === 'pending_delivery'
            ? {
                status: 'COMPLETED',
                report: {
                  is: {
                    deliveredAt: null
                  }
                }
              }
            : {}),
    ...(q
      ? {
          OR: [
            { id: { contains: q, mode: 'insensitive' } },
            { patient: { mrn: { contains: q, mode: 'insensitive' } } },
            { patient: { phone: { contains: q, mode: 'insensitive' } } },
            { patient: { insuranceId: { contains: q, mode: 'insensitive' } } },
            { patient: { name: { contains: q, mode: 'insensitive' } } },
            {
              results: {
                some: {
                  OR: [
                    { testCatalog: { name: { contains: q, mode: 'insensitive' } } },
                    { testCatalog: { code: { contains: q, mode: 'insensitive' } } },
                    { testCatalog: { category: { contains: q, mode: 'insensitive' } } }
                  ]
                }
              }
            }
          ]
        }
      : {})
  };

  const [rows, total] = await Promise.all([
    prisma.testOrder.findMany({
      where,
      skip,
      take,
      include: {
        patient: true,
        results: {
          include: { testCatalog: true }
        },
        invoice: true,
        report: true
      },
      orderBy
    }),
    prisma.testOrder.count({ where })
  ]);

  res.json({ page, pageSize, total, data: rows });
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
      invoice: true,
      imagingOrders: true,
      attachments: true,
      dicomStudies: true
    }
  });

  if (!order) {
    return res.status(404).json({ message: 'Order not found' });
  }

  res.json(order);
}

export async function createImagingOrder(req, res) {
  requireFields(req.body, ['modality', 'studyDescription']);
  const order = await prisma.testOrder.findFirst({
    where: { id: req.params.id, tenantId: req.user.tenantId }
  });

  if (!order) {
    return res.status(404).json({ message: 'Order not found' });
  }

  const imagingOrder = await prisma.imagingOrder.create({
    data: {
      tenantId: req.user.tenantId,
      orderId: order.id,
      modality: req.body.modality,
      departmentName: req.body.departmentName || null,
      studyDescription: req.body.studyDescription,
      clinicalNotes: req.body.clinicalNotes || null,
      externalAccession: req.body.externalAccession || null,
      createdBy: req.user.userId
    }
  });

  res.status(201).json({ message: 'Imaging order created', imagingOrder });
}

export async function listImagingOrders(req, res) {
  const order = await prisma.testOrder.findFirst({
    where: { id: req.params.id, tenantId: req.user.tenantId }
  });

  if (!order) {
    return res.status(404).json({ message: 'Order not found' });
  }

  const imagingOrders = await prisma.imagingOrder.findMany({
    where: { tenantId: req.user.tenantId, orderId: order.id },
    orderBy: { createdAt: 'desc' }
  });

  res.json({ imagingOrders });
}

export async function uploadOrderAttachment(req, res) {
  const order = await prisma.testOrder.findFirst({
    where: { id: req.params.id, tenantId: req.user.tenantId }
  });

  if (!order) {
    return res.status(404).json({ message: 'Order not found' });
  }

  if (!req.file) {
    return res.status(400).json({ message: 'File is required' });
  }

  const allowedTypes = new Set([
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'application/dicom',
    'application/octet-stream'
  ]);

  if (!allowedTypes.has(req.file.mimetype)) {
    return res.status(400).json({ message: 'Unsupported attachment type' });
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: req.user.tenantId },
    include: { region: true }
  });

  const key = `${tenant.slug}/orders/${order.id}/attachments/${Date.now()}-${sanitizeFileName(req.file.originalname)}`;
  const storageUrl = await uploadBufferToS3({
    region: tenant.region?.storageBucketRegion || 'ap-south-1',
    key,
    buffer: req.file.buffer,
    contentType: req.file.mimetype
  });

  const attachment = await prisma.orderAttachment.create({
    data: {
      tenantId: req.user.tenantId,
      orderId: order.id,
      kind: req.body.kind || 'OTHER',
      title: req.body.title || req.file.originalname,
      fileName: req.file.originalname,
      contentType: req.file.mimetype,
      fileSize: req.file.size,
      storageUrl,
      uploadedBy: req.user.userId
    }
  });

  res.status(201).json({ message: 'Attachment uploaded', attachment });
}

export async function listOrderAttachments(req, res) {
  const order = await prisma.testOrder.findFirst({
    where: { id: req.params.id, tenantId: req.user.tenantId }
  });

  if (!order) {
    return res.status(404).json({ message: 'Order not found' });
  }

  const attachments = await prisma.orderAttachment.findMany({
    where: { tenantId: req.user.tenantId, orderId: order.id },
    orderBy: { createdAt: 'desc' }
  });

  res.json({ attachments });
}

export async function createDicomStudy(req, res) {
  requireFields(req.body, ['studyUid', 'modality']);
  const order = await prisma.testOrder.findFirst({
    where: { id: req.params.id, tenantId: req.user.tenantId }
  });

  if (!order) {
    return res.status(404).json({ message: 'Order not found' });
  }

  const existing = await prisma.dicomStudy.findFirst({
    where: { tenantId: req.user.tenantId, studyUid: req.body.studyUid }
  });

  const data = {
    tenantId: req.user.tenantId,
    orderId: order.id,
    studyUid: req.body.studyUid,
    accessionNo: req.body.accessionNo || null,
    modality: req.body.modality,
    studyDate: req.body.studyDate ? new Date(req.body.studyDate) : null,
    seriesCount: Number(req.body.seriesCount || 0),
    instanceCount: Number(req.body.instanceCount || 0),
    viewerUrl: req.body.viewerUrl || null,
    previewImageUrl: req.body.previewImageUrl || null,
    ingestSource: req.body.ingestSource || 'PACS'
  };

  const dicomStudy = existing
    ? await prisma.dicomStudy.update({
        where: { id: existing.id },
        data
      })
    : await prisma.dicomStudy.create({ data });

  res.status(existing ? 200 : 201).json({ message: 'DICOM study saved', dicomStudy });
}

export async function listDicomStudies(req, res) {
  const order = await prisma.testOrder.findFirst({
    where: { id: req.params.id, tenantId: req.user.tenantId }
  });

  if (!order) {
    return res.status(404).json({ message: 'Order not found' });
  }

  const dicomStudies = await prisma.dicomStudy.findMany({
    where: { tenantId: req.user.tenantId, orderId: order.id },
    orderBy: { createdAt: 'desc' }
  });

  res.json({ dicomStudies });
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

  const allowedTransitions = {
    PENDING: ['IN_PROGRESS', 'CANCELLED'],
    IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
    COMPLETED: [],
    CANCELLED: []
  };
  const next = String(req.body.status || '').toUpperCase();
  const canMove = (allowedTransitions[existing.status] || []).includes(next);
  if (!canMove && existing.status !== next) {
    return res.status(400).json({
      message: `Invalid status transition: ${existing.status} -> ${next}`
    });
  }

  const updated = await prisma.testOrder.update({
    where: { id: req.params.id },
    data: {
      status: next,
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
    const panelRows = Array.isArray(row.panelRows) ? row.panelRows : [];
    const status = panelRows.some((item) => item.abnormal)
      ? 'ABNORMAL'
      : evaluateStatus(row.value, row.referenceRange || existing.referenceRange);

    const updated = await prisma.testResult.update({
      where: { id: existing.id },
      data: {
        value: String(row.value),
        unit: row.unit || existing.unit,
        referenceRange: row.referenceRange || existing.referenceRange,
        status,
        enteredBy: req.user.id,
        analyzerRawMessage: serializePanelRows(panelRows, existing.analyzerRawMessage),
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

  const allResults = await prisma.testResult.findMany({ where: { orderId: order.id } });
  const allFilled = allResults.every((r) => String(r.value || '').trim() !== '');
  await prisma.testOrder.update({
    where: { id: order.id },
    data: { status: allFilled ? 'COMPLETED' : 'IN_PROGRESS' }
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

  const allResults = await prisma.testResult.findMany({ where: { orderId: req.body.orderId } });
  const allFilled = allResults.every((r) => String(r.value || '').trim() !== '');
  await prisma.testOrder.update({
    where: { id: req.body.orderId },
    data: { status: allFilled ? 'COMPLETED' : 'IN_PROGRESS' }
  });

  getIo().to(tenantId).emit('result:new', result);

  return res.status(201).json({ message: 'Internal result ingested', resultId: result.id });
}
