import { prisma } from '../../config/prisma.js';
import { parsePagination } from '../../utils/validators.js';

export async function listInvoices(req, res) {
  const { skip, take, page, pageSize } = parsePagination(req.query);
  const where = {
    tenantId: req.user.tenantId,
    ...(req.query.status ? { status: req.query.status } : {})
  };

  const [data, total] = await Promise.all([
    prisma.invoice.findMany({
      where,
      skip,
      take,
      include: {
        patient: true,
        order: true
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.invoice.count({ where })
  ]);

  res.json({ page, pageSize, total, data });
}

export async function taxSummary(req, res) {
  const tenant = await prisma.tenant.findUnique({
    where: { id: req.user.tenantId },
    include: { region: true }
  });

  const invoices = await prisma.invoice.findMany({ where: { tenantId: req.user.tenantId } });
  const subtotal = invoices.reduce((sum, i) => sum + Number(i.subtotal), 0);
  const tax = invoices.reduce((sum, i) => sum + Number(i.taxAmount), 0);
  const total = invoices.reduce((sum, i) => sum + Number(i.total), 0);

  res.json({
    taxType: tenant.region.taxType,
    taxRate: Number(tenant.region.taxRate),
    currency: tenant.region.currency,
    subtotal,
    tax,
    total
  });
}
