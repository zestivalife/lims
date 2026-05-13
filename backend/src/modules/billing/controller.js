import { prisma } from '../../config/prisma.js';
import { parsePagination, requireFields } from '../../utils/validators.js';

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

export async function recordPayment(req, res) {
  requireFields(req.body, ['invoiceId', 'amount', 'mode', 'status']);
  const invoice = await prisma.invoice.findFirst({
    where: {
      id: req.body.invoiceId,
      tenantId: req.user.tenantId
    }
  });

  if (!invoice) {
    return res.status(404).json({ message: 'Invoice not found' });
  }

  const amount = Number(req.body.amount);
  if (Number.isNaN(amount) || amount <= 0) {
    return res.status(400).json({ message: 'Amount must be greater than zero' });
  }

  const paymentMode = String(req.body.mode || '')
    .trim()
    .toUpperCase();
  if (!['CASH', 'UPI', 'CARD', 'CREDIT'].includes(paymentMode)) {
    return res.status(400).json({ message: 'Invalid payment mode' });
  }

  req.auditOldValue = invoice;
  const nextStatus = String(req.body.status).toUpperCase() === 'PAID' ? 'PAID' : 'PENDING';
  const updated = await prisma.invoice.update({
    where: { id: invoice.id },
    data: {
      status: nextStatus,
      paymentMode,
      paidAmount: amount
    }
  });

  return res.json({
    message: 'Payment recorded',
    invoice: updated,
    payment: {
      amount,
      mode: paymentMode,
      txRef: req.body.txRef || null,
      receiptDelivery: req.body.receiptDelivery || []
    }
  });
}
