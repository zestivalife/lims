import crypto from 'crypto';
import PDFDocument from 'pdfkit';
import { prisma } from '../../config/prisma.js';
import { uploadBufferToS3 } from '../../config/s3.js';
import { sendEmail } from '../../config/smtp.js';
import { requireFields } from '../../utils/validators.js';
import { decryptPatientRecord } from '../../middleware/encryption.js';

function buildReportPdf({ tenant, patient, order, results }) {
  return new Promise((resolve) => {
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    const chunks = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));

    doc.fontSize(18).text(tenant.name, { align: 'left' });
    doc.fontSize(11).fillColor('#555').text(`Report Date: ${new Date().toLocaleString()}`);
    doc.moveDown();
    doc.fillColor('#000').fontSize(13).text('Patient Details');
    doc.fontSize(11).text(`Name: ${patient.name}`);
    doc.text(`MRN: ${patient.mrn}`);
    doc.text(`DOB: ${patient.dob}`);
    doc.text(`Gender: ${patient.gender}`);
    doc.text(`Phone: ${patient.phone}`);
    doc.moveDown();

    doc.fontSize(13).text(`Order ID: ${order.id}`);
    doc.text(`Priority: ${order.priority}`);
    doc.text(`Status: ${order.status}`);
    doc.moveDown();

    doc.fontSize(13).text('Results');
    doc.moveDown(0.5);

    results.forEach((r) => {
      doc.fontSize(11).fillColor(r.status === 'CRITICAL' ? '#D13438' : r.status === 'ABNORMAL' ? '#FFA500' : '#107C10');
      doc.text(`${r.testCatalog.code} - ${r.testCatalog.name}: ${r.value} ${r.unit} | Ref: ${r.referenceRange} | ${r.status}`);
    });

    doc.moveDown();
    doc.fillColor('#000').fontSize(10).text(tenant.region.reportFooter, { align: 'center' });
    doc.end();
  });
}

export async function generateReport(req, res) {
  requireFields(req.body, ['orderId']);

  const order = await prisma.testOrder.findFirst({
    where: { id: req.body.orderId, tenantId: req.user.tenantId },
    include: {
      patient: true,
      results: { include: { testCatalog: true } },
      tenant: { include: { region: true } }
    }
  });

  if (!order) {
    return res.status(404).json({ message: 'Order not found' });
  }

  const patient = decryptPatientRecord(order.patient);
  const pdfBuffer = await buildReportPdf({
    tenant: order.tenant,
    patient: { ...patient, mrn: order.patient.mrn },
    order,
    results: order.results
  });

  const key = `${order.tenant.slug}/reports/${order.id}-${Date.now()}.pdf`;
  const pdfUrl = await uploadBufferToS3({
    region: order.tenant.region.storageBucketRegion,
    key,
    buffer: pdfBuffer,
    contentType: 'application/pdf'
  });

  const report = await prisma.report.upsert({
    where: { orderId: order.id },
    update: { pdfUrl, createdAt: new Date() },
    create: {
      tenantId: req.user.tenantId,
      orderId: order.id,
      pdfUrl
    }
  });

  res.status(201).json(report);
}

export async function signReport(req, res) {
  requireFields(req.body, ['pin']);

  const report = await prisma.report.findFirst({
    where: { id: req.params.id, tenantId: req.user.tenantId },
    include: { order: true }
  });

  if (!report) {
    return res.status(404).json({ message: 'Report not found' });
  }

  if (req.user.role !== 'PATHOLOGIST' && req.user.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Only pathologist/admin can sign reports' });
  }

  const signature = crypto
    .createHash('sha256')
    .update(`${report.id}:${req.user.id}:${req.body.pin}:${Date.now()}`)
    .digest('hex');

  const signed = await prisma.report.update({
    where: { id: report.id },
    data: {
      digitalSignatureHash: signature,
      signedBy: req.user.id,
      signedAt: new Date()
    }
  });

  await prisma.testOrder.update({
    where: { id: report.orderId },
    data: { status: 'COMPLETED' }
  });

  res.json({ message: 'Report signed successfully', report: signed });
}

export async function downloadReport(req, res) {
  const report = await prisma.report.findFirst({
    where: { id: req.params.id, tenantId: req.user.tenantId }
  });

  if (!report) {
    return res.status(404).json({ message: 'Report not found' });
  }

  res.json({
    id: report.id,
    pdfUrl: report.pdfUrl,
    signedAt: report.signedAt,
    signedBy: report.signedBy,
    digitalSignatureHash: report.digitalSignatureHash
  });
}

export async function deliverReport(req, res) {
  requireFields(req.body, ['method']);
  const method = String(req.body.method).toUpperCase();

  const report = await prisma.report.findFirst({
    where: { id: req.params.id, tenantId: req.user.tenantId },
    include: {
      order: {
        include: {
          patient: true
        }
      }
    }
  });

  if (!report) {
    return res.status(404).json({ message: 'Report not found' });
  }

  const patient = decryptPatientRecord(report.order.patient);

  if (method === 'EMAIL' && patient.email) {
    await sendEmail({
      to: patient.email,
      subject: `Lab Report: ${report.order.id}`,
      html: `<p>Your report is ready.</p><p><a href="${report.pdfUrl}">Download Report</a></p>`
    });
  }

  const updated = await prisma.report.update({
    where: { id: report.id },
    data: {
      deliveredAt: new Date(),
      deliveryMethod: method
    }
  });

  res.json({
    message: `Report delivered via ${method}`,
    report: updated,
    channelResponse: method === 'EMAIL' ? 'Email sent' : `${method} dispatch recorded`
  });
}

export async function myPortalReports(req, res) {
  if (req.user.role !== 'PATIENT') {
    return res.status(403).json({ message: 'Only patient portal users can access this endpoint' });
  }

  const rows = await prisma.report.findMany({
    where: { tenantId: req.user.tenantId },
    include: {
      order: {
        include: {
          patient: true,
          results: {
            include: {
              testCatalog: true
            }
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 50
  });

  const phone = String(req.user.phone || '').replace(/\s+/g, '');
  const mine = rows
    .map((report) => {
      const patient = decryptPatientRecord(report.order.patient);
      return { report, patient };
    })
    .filter((item) => String(item.patient.phone || '').replace(/\s+/g, '') === phone)
    .map((item) => ({
      id: item.report.id,
      orderId: item.report.orderId,
      pdfUrl: item.report.pdfUrl,
      signedAt: item.report.signedAt,
      deliveredAt: item.report.deliveredAt,
      deliveryMethod: item.report.deliveryMethod,
      patient: {
        mrn: item.patient.mrn || item.report.order.patient.mrn,
        name: item.patient.name,
        phone: item.patient.phone
      },
      results: item.report.order.results.map((r) => ({
        id: r.id,
        testCode: r.testCatalog.code,
        testName: r.testCatalog.name,
        value: r.value,
        unit: r.unit,
        status: r.status
      }))
    }));

  res.json({ data: mine });
}
