import nodemailer from 'nodemailer';
import { env } from './env.js';

export const transporter = nodemailer.createTransport({
  host: env.smtpHost,
  port: env.smtpPort,
  secure: env.smtpPort === 465,
  auth: {
    user: env.smtpUser,
    pass: env.smtpPass
  }
});

export async function sendEmail({ to, subject, html }) {
  await transporter.sendMail({
    from: env.smtpFrom,
    to,
    subject,
    html
  });
}
