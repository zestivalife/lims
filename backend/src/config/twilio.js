import twilio from 'twilio';
import { env } from './env.js';

export const twilioClient = twilio(env.twilioSid, env.twilioToken);

export async function sendOtpSms(to, body) {
  if (env.otpDemoMode) {
    return { sid: 'demo-sid' };
  }
  return twilioClient.messages.create({
    from: env.twilioFrom,
    to,
    body
  });
}
