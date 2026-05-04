import dotenv from 'dotenv';

dotenv.config();

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.BACKEND_PORT || 3001),
  databaseUrl: process.env.DATABASE_URL,
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  jwtSecret: process.env.JWT_SECRET,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  encryptionKey: process.env.ENCRYPTION_KEY,
  internalApiToken: process.env.INTERNAL_API_TOKEN,
  twilioSid: process.env.TWILIO_ACCOUNT_SID,
  twilioToken: process.env.TWILIO_AUTH_TOKEN,
  twilioFrom: process.env.TWILIO_FROM,
  otpDemoMode: String(process.env.OTP_DEMO_MODE || 'false') === 'true',
  smtpHost: process.env.SMTP_HOST,
  smtpPort: Number(process.env.SMTP_PORT || 587),
  smtpUser: process.env.SMTP_USER,
  smtpPass: process.env.SMTP_PASS,
  smtpFrom: process.env.SMTP_FROM,
  awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID,
  awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  awsRegion: process.env.AWS_REGION || 'ap-south-1',
  awsBucketDefault: process.env.AWS_S3_BUCKET,
  uploadsDir: process.env.UPLOADS_DIR || '/app/uploads'
};

const required = ['databaseUrl', 'jwtSecret', 'jwtRefreshSecret', 'encryptionKey', 'internalApiToken'];
for (const key of required) {
  if (!env[key]) {
    throw new Error(`Missing required env variable: ${key}`);
  }
}

if (env.encryptionKey.length !== 64) {
  throw new Error('ENCRYPTION_KEY must be 64 hex chars (32 bytes).');
}
