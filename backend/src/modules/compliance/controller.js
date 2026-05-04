import PDFDocument from 'pdfkit';
import { prisma } from '../../config/prisma.js';
import { uploadBufferToS3 } from '../../config/s3.js';
import { parsePagination, requireFields } from '../../utils/validators.js';

const POLICY_TEXT = {
  NABL: 'NABL policy requires complete traceability of every result, calibration records, access control, and approved report sign-off before release.',
  HIPAA: 'HIPAA policy enforces minimum necessary access, protected health information controls, breach notification workflows, and access auditability.',
  GDPR: 'GDPR policy enforces lawful basis, purpose limitation, data minimization, retention controls, and data-subject rights.',
  NHS_GDPR: 'NHS + GDPR policy requires secure patient data processing, consent capture where applicable, and role-specific data access governance.',
  DHA_MOH: 'DHA / MOH policy requires regional health data handling, compliant reporting workflows, and regulated laboratory governance.',
  ISO17025: 'ISO 17025 policy mandates method validation, measurement traceability, equipment control, and quality assurance records.'
};

export async function auditLog(req, res) {
  const { skip, take, page, pageSize } = parsePagination(req.query);
  const where = {
    tenantId: req.user.tenantId,
    ...(req.query.userId ? { userId: req.query.userId } : {}),
    ...(req.query.action ? { action: { contains: req.query.action, mode: 'insensitive' } } : {}),
    ...(req.query.entityType ? { entityType: req.query.entityType } : {})
  };

  const [data, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      skip,
      take,
      include: { user: { select: { email: true, role: true } } },
      orderBy: { timestamp: 'desc' }
    }),
    prisma.auditLog.count({ where })
  ]);

  res.json({ page, pageSize, total, data });
}

export async function policies(req, res) {
  const regionKey = req.params.region.toUpperCase();
  const text = POLICY_TEXT[regionKey] || POLICY_TEXT.GDPR;
  res.json({ region: regionKey, policyText: text, version: '2026.04' });
}

export async function consent(req, res) {
  requireFields(req.body, ['policyType', 'policyVersion']);

  const row = await prisma.consentLog.create({
    data: {
      tenantId: req.user.tenantId,
      userId: req.user.id,
      policyType: req.body.policyType,
      policyVersion: req.body.policyVersion,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] || null
    }
  });

  res.status(201).json(row);
}

function makeCompliancePdf(summary) {
  return new Promise((resolve) => {
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));

    doc.fontSize(16).text('Compliance Summary Report');
    doc.moveDown();
    doc.fontSize(11).text(`Tenant: ${summary.tenantName}`);
    doc.text(`Region: ${summary.region.countryName} (${summary.region.complianceType})`);
    doc.text(`Generated At: ${new Date().toISOString()}`);
    doc.moveDown();
    doc.text(`Total Audit Logs: ${summary.auditLogs}`);
    doc.text(`Total Consent Logs: ${summary.consentLogs}`);
    doc.text(`Pending Unsigned Reports: ${summary.pendingUnsignedReports}`);
    doc.text(`Critical Results (7 days): ${summary.criticalResults}`);
    doc.moveDown();
    doc.text('Policy Footnote:');
    doc.text(summary.policyText);
    doc.end();
  });
}

export async function complianceReport(req, res) {
  const tenant = await prisma.tenant.findUnique({
    where: { id: req.user.tenantId },
    include: { region: true }
  });

  const [auditLogs, consentLogs, pendingUnsignedReports, criticalResults] = await Promise.all([
    prisma.auditLog.count({ where: { tenantId: req.user.tenantId } }),
    prisma.consentLog.count({ where: { tenantId: req.user.tenantId } }),
    prisma.report.count({ where: { tenantId: req.user.tenantId, signedAt: null } }),
    prisma.testResult.count({
      where: {
        order: { tenantId: req.user.tenantId },
        status: 'CRITICAL',
        receivedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      }
    })
  ]);

  const summary = {
    tenantName: tenant.name,
    region: tenant.region,
    auditLogs,
    consentLogs,
    pendingUnsignedReports,
    criticalResults,
    policyText: POLICY_TEXT[tenant.region.complianceType] || POLICY_TEXT.GDPR
  };

  const buffer = await makeCompliancePdf(summary);
  const key = `${tenant.slug}/compliance/compliance-${Date.now()}.pdf`;
  const url = await uploadBufferToS3({
    region: tenant.region.storageBucketRegion,
    key,
    buffer,
    contentType: 'application/pdf'
  });

  res.json({ summary, pdfUrl: url });
}
