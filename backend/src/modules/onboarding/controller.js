import bcrypt from 'bcryptjs';
import { prisma } from '../../config/prisma.js';
import { requireFields } from '../../utils/validators.js';
import { getRegionConfig, listRegionConfigs } from '../regions/regionConfig.js';
import { ensureTenantBootstrapped } from './bootstrap.js';

export async function step1(req, res) {
  requireFields(req.body, ['tenantName', 'adminEmail', 'adminPhone', 'password', 'countryKey']);

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

  const tenantSlug = String(req.body.tenantSlug || req.body.tenantName || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

  const tenant = await prisma.tenant.create({
    data: {
      name: req.body.tenantName,
      slug: tenantSlug,
      plan: req.body.plan || 'STARTER',
      regionId: region.id,
      onboardingStep: 1,
      branchName: req.body.tenantName,
      branchAddress: 'Primary branch - to be configured'
    }
  });

  const user = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email: req.body.adminEmail,
      phone: req.body.adminPhone,
      passwordHash: await bcrypt.hash(req.body.password, 12),
      role: 'ADMIN',
      isVerified: true
    }
  });

  const bootstrap = await ensureTenantBootstrapped({
    tenant,
    region,
    adminUser: user
  });

  res.status(201).json({
    message: 'Account created and workspace bootstrapped',
    tenantId: tenant.id,
    userId: user.id,
    step: 1,
    bootstrap
  });
}

export async function step2(req, res) {
  requireFields(req.body, ['tenantId', 'countryKey']);
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

  const tenant = await prisma.tenant.update({
    where: { id: req.body.tenantId },
    data: {
      regionId: region.id,
      complianceOverride: req.body.override || null,
      onboardingStep: 2
    },
    include: { region: true }
  });

  res.json({
    message: 'Step 2 completed',
    step: 2,
    autoConfig: tenant.region,
    manualOverrideEnabled: true
  });
}

export async function step3(req, res) {
  requireFields(req.body, ['tenantId', 'branchName', 'branchAddress']);
  await prisma.tenant.update({
    where: { id: req.body.tenantId },
    data: {
      branchName: req.body.branchName,
      branchAddress: req.body.branchAddress,
      onboardingStep: 3
    }
  });
  res.json({ message: 'Step 3 completed', step: 3 });
}

export async function step4(req, res) {
  requireFields(req.body, ['tenantId', 'userId', 'policyType', 'policyVersion']);
  await prisma.consentLog.create({
    data: {
      tenantId: req.body.tenantId,
      userId: req.body.userId,
      policyType: req.body.policyType,
      policyVersion: req.body.policyVersion,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] || null
    }
  });

  await prisma.tenant.update({
    where: { id: req.body.tenantId },
    data: { onboardingStep: 4 }
  });

  res.json({ message: 'Step 4 completed', step: 4 });
}

export async function step5(req, res) {
  requireFields(req.body, ['tenantId', 'name', 'model', 'manufacturer', 'protocol', 'ipAddress', 'port']);

  const analyzer = await prisma.analyzer.create({
    data: {
      tenantId: req.body.tenantId,
      name: req.body.name,
      model: req.body.model,
      manufacturer: req.body.manufacturer,
      protocol: req.body.protocol,
      ipAddress: req.body.ipAddress,
      port: Number(req.body.port),
      isActive: true
    }
  });

  await prisma.tenant.update({
    where: { id: req.body.tenantId },
    data: { onboardingStep: 5 }
  });

  res.status(201).json({ message: 'Step 5 completed', step: 5, analyzer });
}

export async function step6(req, res) {
  requireFields(req.body, ['tenantId', 'teamMembers']);
  const created = [];

  for (const member of req.body.teamMembers) {
    const user = await prisma.user.create({
      data: {
        tenantId: req.body.tenantId,
        email: member.email,
        phone: member.phone,
        passwordHash: await bcrypt.hash(member.password, 12),
        role: member.role,
        isVerified: true
      }
    });
    created.push(user);
  }

  await prisma.tenant.update({
    where: { id: req.body.tenantId },
    data: { onboardingStep: 6 }
  });

  res.json({ message: 'Step 6 completed', step: 6, usersCreated: created.length });
}

export async function step7(req, res) {
  requireFields(req.body, ['tenantId', 'adminUserId']);

  const tenant = await prisma.tenant.findUnique({
    where: { id: req.body.tenantId },
    include: { region: true }
  });

  const tests = [
    { code: 'CBC', name: 'Complete Blood Count', category: 'HEMATOLOGY', unit: tenant.region.countryCode === 'EU' ? 'mmol/L' : 'mg/dL', method: 'Automated', turnaroundHours: 4, price: 450 },
    { code: 'GLU', name: 'Glucose Fasting', category: 'BIOCHEMISTRY', unit: tenant.region.countryCode === 'EU' ? 'mmol/L' : 'mg/dL', method: 'Enzymatic', turnaroundHours: 2, price: 250 },
    { code: 'HBA1C', name: 'HbA1c', category: 'BIOCHEMISTRY', unit: '%', method: 'HPLC', turnaroundHours: 8, price: 700 }
  ];

  for (const test of tests) {
    await prisma.testCatalog.upsert({
      where: { tenantId_code: { tenantId: tenant.id, code: test.code } },
      update: {},
      create: {
        tenantId: tenant.id,
        code: test.code,
        name: test.name,
        category: test.category,
        normalRangeMale: 'Normal',
        normalRangeFemale: 'Normal',
        unit: test.unit,
        method: test.method,
        turnaroundHours: test.turnaroundHours,
        price: test.price
      }
    });
  }

  await prisma.user.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: 'patient@demo-lab.com' } },
    update: {},
    create: {
      tenantId: tenant.id,
      email: 'patient@demo-lab.com',
      phone: '9999999999',
      passwordHash: await bcrypt.hash('Patient@123', 12),
      role: 'PATIENT',
      isVerified: true
    }
  });

  await prisma.tenant.update({
    where: { id: tenant.id },
    data: { onboardingStep: 7 }
  });

  res.json({
    message: 'Step 7 completed. Go-live enabled.',
    step: 7,
    demoCredentials: {
      adminEmail: (await prisma.user.findUnique({ where: { id: req.body.adminUserId } }))?.email || 'admin@demo-lab.com',
      patientPhone: '9999999999',
      otp: '123456'
    }
  });
}

export async function status(req, res) {
  const tenantId = req.query.tenantId || req.user?.tenantId;
  if (!tenantId) {
    return res.status(400).json({ message: 'tenantId is required' });
  }
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: { region: true }
  });

  if (!tenant) {
    return res.status(404).json({ message: 'Tenant not found' });
  }

  res.json({
    tenantId: tenant.id,
    onboardingStep: tenant.onboardingStep,
    region: tenant.region,
    availableRegionConfigs: listRegionConfigs()
  });
}
