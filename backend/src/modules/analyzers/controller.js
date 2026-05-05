import net from 'net';
import { prisma } from '../../config/prisma.js';
import { parsePagination, requireFields } from '../../utils/validators.js';
import { getIo } from '../../config/socket.js';

export async function listAnalyzers(req, res) {
  const { skip, take, page, pageSize } = parsePagination(req.query);
  const [data, total] = await Promise.all([
    prisma.analyzer.findMany({
      where: { tenantId: req.user.tenantId },
      skip,
      take,
      include: { mappings: { include: { testCatalog: true } } },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.analyzer.count({ where: { tenantId: req.user.tenantId } })
  ]);

  res.json({ page, pageSize, total, data });
}

export async function createAnalyzer(req, res) {
  requireFields(req.body, ['name', 'model', 'manufacturer', 'protocol', 'ipAddress', 'port']);
  const analyzer = await prisma.analyzer.create({
    data: {
      tenantId: req.user.tenantId,
      name: req.body.name,
      model: req.body.model,
      manufacturer: req.body.manufacturer,
      protocol: req.body.protocol,
      ipAddress: req.body.ipAddress,
      port: Number(req.body.port),
      isActive: req.body.isActive !== false
    }
  });

  res.status(201).json(analyzer);
}

export async function updateAnalyzer(req, res) {
  const existing = await prisma.analyzer.findFirst({
    where: { id: req.params.id, tenantId: req.user.tenantId }
  });
  if (!existing) {
    return res.status(404).json({ message: 'Analyzer not found' });
  }

  req.auditOldValue = existing;

  const updated = await prisma.analyzer.update({
    where: { id: existing.id },
    data: {
      name: req.body.name ?? existing.name,
      model: req.body.model ?? existing.model,
      manufacturer: req.body.manufacturer ?? existing.manufacturer,
      protocol: req.body.protocol ?? existing.protocol,
      ipAddress: req.body.ipAddress ?? existing.ipAddress,
      port: req.body.port ? Number(req.body.port) : existing.port,
      isActive: req.body.isActive ?? existing.isActive
    }
  });

  res.json(updated);
}

export async function testConnection(req, res) {
  const analyzer = await prisma.analyzer.findFirst({
    where: { id: req.params.id, tenantId: req.user.tenantId }
  });

  if (!analyzer) {
    return res.status(404).json({ message: 'Analyzer not found' });
  }

  const isReachable = await new Promise((resolve) => {
    const socket = new net.Socket();
    const timeoutMs = 2000;

    socket.setTimeout(timeoutMs);
    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.once('error', () => {
      socket.destroy();
      resolve(false);
    });
    socket.once('timeout', () => {
      socket.destroy();
      resolve(false);
    });

    socket.connect(analyzer.port, analyzer.ipAddress);
  });

  await prisma.analyzer.update({
    where: { id: analyzer.id },
    data: {
      lastConnectedAt: isReachable ? new Date() : analyzer.lastConnectedAt
    }
  });

  res.json({
    analyzerId: analyzer.id,
    reachable: isReachable,
    message: isReachable ? 'Connection successful' : 'Connection failed'
  });
}

export async function getAnalyzerLogs(req, res) {
  const logs = await prisma.auditLog.findMany({
    where: {
      tenantId: req.user.tenantId,
      OR: [
        { entityType: 'analyzers', entityId: req.params.id },
        { action: { contains: '/analyzers' } }
      ]
    },
    orderBy: { timestamp: 'desc' },
    take: 200
  });

  const mappings = await prisma.analyzerMapping.findMany({
    where: { analyzerId: req.params.id },
    include: { testCatalog: true }
  });

  res.json({ logs, mappings });
}

export async function createMapping(req, res) {
  requireFields(req.body, ['analyzerId', 'machineParamName', 'testCatalogId']);

  const mapping = await prisma.analyzerMapping.upsert({
    where: {
      analyzerId_machineParamName: {
        analyzerId: req.body.analyzerId,
        machineParamName: req.body.machineParamName
      }
    },
    update: {
      testCatalogId: req.body.testCatalogId,
      transformFormula: req.body.transformFormula || null
    },
    create: {
      analyzerId: req.body.analyzerId,
      machineParamName: req.body.machineParamName,
      testCatalogId: req.body.testCatalogId,
      transformFormula: req.body.transformFormula || null
    }
  });

  res.status(201).json(mapping);
}

export async function listMappings(req, res) {
  const mappings = await prisma.analyzerMapping.findMany({
    where: {
      analyzer: {
        tenantId: req.user.tenantId
      }
    },
    include: {
      analyzer: true,
      testCatalog: true
    },
    orderBy: { createdAt: 'desc' }
  });

  res.json({ data: mappings });
}

export async function getMachineMessageLogs(req, res) {
  const where = {
    tenantId: req.user.tenantId,
    entityType: 'analyzer-message',
    ...(req.query.analyzerId ? { entityId: req.query.analyzerId } : {})
  };

  const logs = await prisma.auditLog.findMany({
    where,
    orderBy: { timestamp: 'desc' },
    take: 200
  });

  res.json({ data: logs });
}

function parseHl7(raw) {
  const rows = [];
  const lines = String(raw).split(/\r?\n/).filter(Boolean);
  let orderNo = '';
  for (const line of lines) {
    if (line.startsWith('OBR|')) {
      const fields = line.split('|');
      orderNo = fields[2] || fields[3] || '';
    }
    if (line.startsWith('OBX|')) {
      const fields = line.split('|');
      const codeRaw = fields[3] || '';
      const machineCode = codeRaw.includes('^') ? codeRaw.split('^')[1] || codeRaw.split('^')[0] : codeRaw;
      rows.push({
        machineCode: String(machineCode || '').trim(),
        value: String(fields[5] || '').trim(),
        unit: String(fields[6] || '').trim(),
        referenceRange: String(fields[7] || '').trim()
      });
    }
  }
  return { orderNo: String(orderNo).trim(), rows };
}

function parseAstm(raw) {
  const rows = [];
  const lines = String(raw).split(/\r?\n/).filter(Boolean);
  let orderNo = '';
  for (const line of lines) {
    if (line.startsWith('O|')) {
      const fields = line.split('|');
      orderNo = fields[2] || '';
    }
    if (line.startsWith('R|')) {
      const fields = line.split('|');
      const codeRaw = String(fields[2] || '').replace(/^\^/, '');
      rows.push({
        machineCode: codeRaw.trim(),
        value: String(fields[3] || '').trim(),
        unit: String(fields[4] || '').trim(),
        referenceRange: String(fields[5] || '').trim()
      });
    }
  }
  return { orderNo: String(orderNo).trim(), rows };
}

function parseCsv(raw) {
  const lines = String(raw).split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return { orderNo: '', rows: [] };
  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
  const row = lines[1].split(',').map((v) => v.trim());
  const get = (name) => {
    const idx = headers.indexOf(name);
    return idx >= 0 ? row[idx] || '' : '';
  };
  return {
    orderNo: get('order_no') || get('orderid') || '',
    rows: [
      {
        machineCode: get('machine_test_code') || get('test_code'),
        value: get('result_value') || get('value'),
        unit: get('unit'),
        referenceRange: get('ref_range') || get('reference_range')
      }
    ].filter((x) => x.machineCode)
  };
}

async function saveMessageLog(req, { analyzerId, payloadType, status, error, rawPayload, rowCount }) {
  await prisma.auditLog.create({
    data: {
      tenantId: req.user.tenantId,
      userId: req.user.id,
      action: `analyzer:${payloadType}:${status.toLowerCase()}`,
      entityType: 'analyzer-message',
      entityId: analyzerId,
      oldValue: null,
      newValue: {
        payloadType,
        status,
        error: error || null,
        rowCount,
        payloadPreview: String(rawPayload || '').slice(0, 1200)
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] || null
    }
  });
}

async function ingestParsedRows(req, res, payloadType, parser) {
  requireFields(req.body, ['analyzerId', 'rawPayload']);

  const analyzer = await prisma.analyzer.findFirst({
    where: { id: req.body.analyzerId, tenantId: req.user.tenantId }
  });
  if (!analyzer) {
    return res.status(404).json({ message: 'Analyzer not found' });
  }

  const parsed = parser(req.body.rawPayload);
  if (!parsed.rows.length) {
    await saveMessageLog(req, {
      analyzerId: analyzer.id,
      payloadType,
      status: 'FAILED',
      error: 'No result rows parsed',
      rawPayload: req.body.rawPayload,
      rowCount: 0
    });
    return res.status(400).json({ message: 'No result rows parsed from payload' });
  }

  const orderId = req.body.orderId || parsed.orderNo;
  if (!orderId) {
    await saveMessageLog(req, {
      analyzerId: analyzer.id,
      payloadType,
      status: 'FAILED',
      error: 'Order number not found',
      rawPayload: req.body.rawPayload,
      rowCount: parsed.rows.length
    });
    return res.status(400).json({ message: 'Order number not found' });
  }

  const order = await prisma.testOrder.findFirst({
    where: { id: orderId, tenantId: req.user.tenantId }
  });
  if (!order) {
    await saveMessageLog(req, {
      analyzerId: analyzer.id,
      payloadType,
      status: 'FAILED',
      error: 'Order number not found',
      rawPayload: req.body.rawPayload,
      rowCount: parsed.rows.length
    });
    return res.status(404).json({ message: 'Order number not found' });
  }

  const mappings = await prisma.analyzerMapping.findMany({
    where: { analyzerId: analyzer.id },
    include: { testCatalog: true }
  });
  const mapByCode = new Map(mappings.map((m) => [m.machineParamName.toUpperCase(), m]));

  let saved = 0;
  for (const row of parsed.rows) {
    const map = mapByCode.get(String(row.machineCode || '').toUpperCase());
    if (!map) continue;

    const existing = await prisma.testResult.findFirst({
      where: {
        orderId: order.id,
        testCatalogId: map.testCatalogId
      }
    });

    const resultData = {
      value: String(row.value || ''),
      unit: row.unit || map.testCatalog.unit,
      referenceRange: row.referenceRange || map.testCatalog.normalRangeMale,
      status: 'NORMAL',
      machineId: analyzer.id,
      enteredBy: req.user.id,
      analyzerRawMessage: req.body.rawPayload,
      receivedAt: new Date()
    };

    if (existing) {
      await prisma.testResult.update({
        where: { id: existing.id },
        data: resultData
      });
    } else {
      await prisma.testResult.create({
        data: {
          orderId: order.id,
          testCatalogId: map.testCatalogId,
          ...resultData
        }
      });
    }
    saved += 1;
  }

  await prisma.testOrder.update({
    where: { id: order.id },
    data: { status: 'IN_PROGRESS' }
  });

  await prisma.analyzer.update({
    where: { id: analyzer.id },
    data: { lastConnectedAt: new Date() }
  });

  await saveMessageLog(req, {
    analyzerId: analyzer.id,
    payloadType,
    status: 'SUCCESS',
    rawPayload: req.body.rawPayload,
    rowCount: parsed.rows.length
  });

  const orderResults = await prisma.testResult.findMany({
    where: { orderId: order.id },
    include: { testCatalog: true, order: true }
  });
  orderResults.forEach((result) => getIo().to(req.user.tenantId).emit('result:new', result));

  return res.json({
    message: `${payloadType} payload ingested`,
    orderId: order.id,
    parsedRows: parsed.rows.length,
    savedRows: saved
  });
}

export async function ingestHl7Payload(req, res) {
  return ingestParsedRows(req, res, 'HL7', parseHl7);
}

export async function ingestAstmPayload(req, res) {
  return ingestParsedRows(req, res, 'ASTM', parseAstm);
}

export async function ingestCsvPayload(req, res) {
  return ingestParsedRows(req, res, 'CSV', parseCsv);
}

export async function dispatchOrderToAnalyzer(req, res) {
  requireFields(req.body, ['analyzerId', 'orderId']);
  const analyzer = await prisma.analyzer.findFirst({
    where: { id: req.body.analyzerId, tenantId: req.user.tenantId }
  });
  if (!analyzer) {
    return res.status(404).json({ message: 'Analyzer not found' });
  }

  const order = await prisma.testOrder.findFirst({
    where: { id: req.body.orderId, tenantId: req.user.tenantId },
    include: { results: { include: { testCatalog: true } } }
  });
  if (!order) {
    return res.status(404).json({ message: 'Order not found' });
  }

  const dispatchMessage = {
    orderId: order.id,
    analyzer: {
      id: analyzer.id,
      name: analyzer.name,
      protocol: analyzer.protocol
    },
    testCodes: order.results.map((r) => r.testCatalog.code),
    dispatchedAt: new Date().toISOString()
  };

  await prisma.auditLog.create({
    data: {
      tenantId: req.user.tenantId,
      userId: req.user.id,
      action: 'analyzer:dispatch',
      entityType: 'analyzer-message',
      entityId: analyzer.id,
      oldValue: null,
      newValue: dispatchMessage,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] || null
    }
  });

  res.json({
    message: 'Order dispatched to analyzer queue',
    dispatchMessage
  });
}
