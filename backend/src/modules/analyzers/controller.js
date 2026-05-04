import net from 'net';
import { prisma } from '../../config/prisma.js';
import { parsePagination, requireFields } from '../../utils/validators.js';

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
