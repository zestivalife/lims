import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from '../../config/prisma.js';
import { sendOtpSms } from '../../config/twilio.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../utils/jwt.js';
import { hashValue } from '../../utils/encryption.js';
import { normalizePhone } from '../../utils/formatters.js';
import { requireFields } from '../../utils/validators.js';
import { getRegionConfig } from '../regions/regionConfig.js';
import { env } from '../../config/env.js';

function otpGenerator() {
  if (env.otpDemoMode) return '123456';
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function register(req, res) {
  requireFields(req.body, ['tenantName', 'tenantSlug', 'countryKey', 'email', 'phone', 'password']);

  const cfg = getRegionConfig(req.body.countryKey);

  const region = await prisma.region.upsert({
    where: { countryCode: cfg.countryCode },
    update: {
      countryName: cfg.countryName,
      timezone: cfg.timezone,
      currency: cfg.currency,
      unitsSystem: cfg.unitsSystem,
      complianceType: cfg.complianceType,
      dataResidencyZone: cfg.dataResidencyZone,
      taxType: cfg.taxType,
      taxRate: cfg.taxRate,
      storageBucketRegion: cfg.storageBucketRegion,
      reportFooter: cfg.reportFooter
    },
    create: {
      countryCode: cfg.countryCode,
      countryName: cfg.countryName,
      timezone: cfg.timezone,
      currency: cfg.currency,
      unitsSystem: cfg.unitsSystem,
      complianceType: cfg.complianceType,
      dataResidencyZone: cfg.dataResidencyZone,
      taxType: cfg.taxType,
      taxRate: cfg.taxRate,
      storageBucketRegion: cfg.storageBucketRegion,
      reportFooter: cfg.reportFooter
    }
  });

  const passwordHash = await bcrypt.hash(req.body.password, 12);
  const tenant = await prisma.tenant.create({
    data: {
      name: req.body.tenantName,
      slug: req.body.tenantSlug,
      plan: req.body.plan || 'STARTER',
      regionId: region.id,
      onboardingStep: 1
    }
  });

  const user = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email: req.body.email,
      phone: normalizePhone(req.body.phone),
      passwordHash,
      role: 'ADMIN',
      isVerified: false,
      mfaEnabled: false
    }
  });

  return res.status(201).json({
    message: 'Registration created',
    tenantId: tenant.id,
    userId: user.id,
    onboardingStep: tenant.onboardingStep
  });
}

export async function verifyEmail(req, res) {
  requireFields(req.body, ['email', 'tenantId']);
  const updated = await prisma.user.updateMany({
    where: {
      tenantId: req.body.tenantId,
      email: req.body.email
    },
    data: {
      isVerified: true
    }
  });
  return res.json({ message: 'Email verified', updated: updated.count });
}

export async function login(req, res) {
  requireFields(req.body, ['email', 'password', 'tenantSlug']);

  const tenant = await prisma.tenant.findUnique({ where: { slug: req.body.tenantSlug } });
  if (!tenant) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const user = await prisma.user.findFirst({
    where: {
      tenantId: tenant.id,
      email: req.body.email,
      active: true
    }
  });

  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const isValid = await bcrypt.compare(req.body.password, user.passwordHash);
  if (!isValid) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  await prisma.user.update({ where: { id: user.id }, data: { lastLogin: new Date() } });

  const payload = {
    userId: user.id,
    tenantId: user.tenantId,
    role: user.role,
    email: user.email
  };

  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  return res.json({
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      role: user.role,
      email: user.email,
      tenantId: user.tenantId
    }
  });
}

export async function refresh(req, res) {
  requireFields(req.body, ['refreshToken']);
  try {
    const payload = verifyRefreshToken(req.body.refreshToken);
    const accessToken = signAccessToken({
      userId: payload.userId,
      tenantId: payload.tenantId,
      role: payload.role,
      email: payload.email
    });
    return res.json({ accessToken });
  } catch {
    return res.status(401).json({ message: 'Invalid refresh token' });
  }
}

export async function sendOtp(req, res) {
  requireFields(req.body, ['phone']);
  const phone = normalizePhone(req.body.phone);
  const otp = otpGenerator();
  const otpHash = hashValue(otp);
  const phoneHash = hashValue(phone);
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  await prisma.otpLog.create({
    data: {
      phone: phoneHash,
      otpHash,
      expiresAt
    }
  });

  await sendOtpSms(phone, `Your LIMS OTP is ${otp}. Valid for 5 minutes.`);

  return res.json({
    message: 'OTP sent',
    demoOtp: env.otpDemoMode ? otp : undefined
  });
}

export async function verifyOtp(req, res) {
  requireFields(req.body, ['phone', 'otp']);
  const phone = normalizePhone(req.body.phone);
  const phoneHash = hashValue(phone);
  const otpHash = hashValue(req.body.otp);

  const otp = await prisma.otpLog.findFirst({
    where: {
      phone: phoneHash,
      otpHash,
      usedAt: null,
      expiresAt: { gt: new Date() }
    },
    orderBy: { createdAt: 'desc' }
  });

  if (!otp) {
    return res.status(401).json({ message: 'Invalid or expired OTP' });
  }

  await prisma.otpLog.update({ where: { id: otp.id }, data: { usedAt: new Date() } });

  const demoTenant = await prisma.tenant.findFirst({ where: { slug: 'city-diagnostics-demo-lab' } });
  const patientUser = await prisma.user.findFirst({
    where: {
      tenantId: demoTenant?.id,
      role: 'PATIENT'
    }
  });

  const payload = {
    userId: patientUser?.id || 'patient-demo',
    tenantId: demoTenant?.id || 'tenant-demo',
    role: 'PATIENT',
    email: patientUser?.email || 'patient@demo-lab.com',
    phone
  };

  return res.json({
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken(payload),
    user: {
      id: payload.userId,
      role: payload.role,
      email: payload.email,
      tenantId: payload.tenantId,
      phone: payload.phone
    }
  });
}
