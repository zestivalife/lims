import { Worker } from 'bullmq';
import { sendEmail } from '../config/smtp.js';
import { prisma } from '../config/prisma.js';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const connection = {
  host: new URL(redisUrl).hostname,
  port: Number(new URL(redisUrl).port || 6379)
};

export const reportDeliveryWorker = new Worker(
  'lims-jobs',
  async (job) => {
    if (job.name !== 'deliver-report-email') return;
    const { reportId, email } = job.data;
    const report = await prisma.report.findUnique({ where: { id: reportId } });
    if (!report) return;

    await sendEmail({
      to: email,
      subject: `Lab Report ${report.id}`,
      html: `<p>Your report is ready.</p><p><a href="${report.pdfUrl}">Download</a></p>`
    });

    await prisma.report.update({
      where: { id: report.id },
      data: { deliveredAt: new Date(), deliveryMethod: 'EMAIL' }
    });
  },
  { connection }
);

reportDeliveryWorker.on('failed', (job, err) => {
  console.error('Report delivery worker failed:', job?.id, err.message);
});
