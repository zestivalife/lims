import { createRequire } from 'module';
import crypto from 'crypto';

const require = createRequire(new URL('./backend/package.json', import.meta.url));
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const demoUsers = [
  { email: 'admin@demo-lab.com', phone: '9999999990', password: 'Admin@123', role: 'ADMIN' },
  { email: 'tech@demo-lab.com', phone: '9999999991', password: 'Tech@123', role: 'TECHNICIAN' },
  { email: 'path@demo-lab.com', phone: '9999999992', password: 'Path@123', role: 'PATHOLOGIST' },
  { email: 'reception@demo-lab.com', phone: '9999999993', password: 'Rec@123', role: 'RECEPTION' },
  { email: 'patient@demo-lab.com', phone: '9999999999', password: 'Patient@123', role: 'PATIENT' }
];

const patientNames = [
  'Aarav Sharma',
  'Isha Patil',
  'Rohan Kulkarni',
  'Sneha Deshmukh',
  'Arjun Nair',
  'Meera Gupta',
  'Vivaan Joshi',
  'Kavya Singh',
  'Aditya Chavan',
  'Pooja Sawant',
  'Rahul Jadhav',
  'Neha Verma',
  'Sanjay Pawar',
  'Ananya Roy',
  'Varun Mishra',
  'Priya More',
  'Kiran Reddy',
  'Sakshi Yadav',
  'Nikhil Bhat',
  'Divya Das'
];

const tests = [
  { code: 'CBC', name: 'Complete Blood Count', category: 'HEMATOLOGY', unit: 'mg/dL', method: 'Automated', turnaroundHours: 4, price: 450, male: '4.0-10.0', female: '4.0-10.0' },
  { code: 'GLU', name: 'Glucose Fasting', category: 'BIOCHEMISTRY', unit: 'mg/dL', method: 'Hexokinase', turnaroundHours: 2, price: 250, male: '70-100', female: '70-100' },
  { code: 'HBA1C', name: 'HbA1c', category: 'BIOCHEMISTRY', unit: '%', method: 'HPLC', turnaroundHours: 6, price: 700, male: '4.0-5.6', female: '4.0-5.6' },
  { code: 'TSH', name: 'TSH', category: 'ENDOCRINOLOGY', unit: 'uIU/mL', method: 'CLIA', turnaroundHours: 8, price: 500, male: '0.4-4.0', female: '0.4-4.0' },
  { code: 'LFT', name: 'Liver Function Test', category: 'BIOCHEMISTRY', unit: 'U/L', method: 'Photometry', turnaroundHours: 8, price: 900, male: '7-56', female: '7-56' },
  { code: 'KFT', name: 'Kidney Function Test', category: 'BIOCHEMISTRY', unit: 'mg/dL', method: 'Photometry', turnaroundHours: 8, price: 850, male: '0.6-1.3', female: '0.5-1.1' },
  { code: 'LIPID', name: 'Lipid Profile', category: 'BIOCHEMISTRY', unit: 'mg/dL', method: 'Enzymatic', turnaroundHours: 8, price: 950, male: '0-200', female: '0-200' },
  { code: 'URIN', name: 'Urine Routine', category: 'PATHOLOGY', unit: 'cells/HPF', method: 'Microscopy', turnaroundHours: 6, price: 300, male: '0-5', female: '0-5' },
  { code: 'CRP', name: 'C-Reactive Protein', category: 'IMMUNOLOGY', unit: 'mg/L', method: 'Immunoturbidimetry', turnaroundHours: 6, price: 650, male: '0-5', female: '0-5' },
  { code: 'DENG', name: 'Dengue NS1', category: 'SEROLOGY', unit: 'Index', method: 'ELISA', turnaroundHours: 10, price: 1100, male: '0-1.0', female: '0-1.0' },
  { code: 'VITD', name: 'Vitamin D', category: 'ENDOCRINOLOGY', unit: 'ng/mL', method: 'CLIA', turnaroundHours: 10, price: 1300, male: '30-100', female: '30-100' },
  { code: 'B12', name: 'Vitamin B12', category: 'ENDOCRINOLOGY', unit: 'pg/mL', method: 'CLIA', turnaroundHours: 10, price: 1200, male: '200-900', female: '200-900' },
  { code: 'ESR', name: 'ESR', category: 'HEMATOLOGY', unit: 'mm/hr', method: 'Westergren', turnaroundHours: 4, price: 200, male: '0-15', female: '0-20' },
  { code: 'PLT', name: 'Platelet Count', category: 'HEMATOLOGY', unit: '10^3/uL', method: 'Automated', turnaroundHours: 4, price: 220, male: '150-450', female: '150-450' },
  { code: 'HGB', name: 'Hemoglobin', category: 'HEMATOLOGY', unit: 'g/dL', method: 'Automated', turnaroundHours: 4, price: 180, male: '13-17', female: '12-15' }
];

const analyzerSeed = [
  { name: 'Sysmex XN-series', model: 'XN-1000', manufacturer: 'Sysmex', protocol: 'HL7', ipAddress: '192.168.1.10', port: 5000 },
  { name: 'Roche Cobas', model: 'Cobas c311', manufacturer: 'Roche', protocol: 'ASTM', ipAddress: '192.168.1.11', port: 5001 }
];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDateInLastDays(days) {
  const now = Date.now();
  const back = now - Math.floor(Math.random() * days * 24 * 60 * 60 * 1000);
  return new Date(back);
}

function valueFromRange(range, forceAbnormal = false) {
  const [minRaw, maxRaw] = String(range).split('-').map((x) => Number(x.trim()));
  if (Number.isNaN(minRaw) || Number.isNaN(maxRaw)) return '0';
  const min = forceAbnormal ? maxRaw + (maxRaw - minRaw) * 0.3 : minRaw + (maxRaw - minRaw) * 0.2;
  const max = forceAbnormal ? maxRaw + (maxRaw - minRaw) * 0.8 : minRaw + (maxRaw - minRaw) * 0.8;
  return (Math.random() * (max - min) + min).toFixed(2);
}

function encryptField(value, keyHex) {
  const iv = crypto.randomBytes(12);
  const key = Buffer.from(keyHex, 'hex');
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(String(value), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
}

async function run() {
  const encryptionKey = process.env.ENCRYPTION_KEY || '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
  const region = await prisma.region.upsert({
    where: { countryCode: 'IN' },
    update: {
      countryName: 'India',
      timezone: 'Asia/Kolkata',
      currency: 'INR',
      unitsSystem: 'METRIC',
      complianceType: 'NABL',
      dataResidencyZone: 'ap-south-1',
      taxType: 'GST',
      taxRate: 18,
      storageBucketRegion: 'ap-south-1',
      reportFooter: 'NABL Accredited Laboratory'
    },
    create: {
      countryCode: 'IN',
      countryName: 'India',
      timezone: 'Asia/Kolkata',
      currency: 'INR',
      unitsSystem: 'METRIC',
      complianceType: 'NABL',
      dataResidencyZone: 'ap-south-1',
      taxType: 'GST',
      taxRate: 18,
      storageBucketRegion: 'ap-south-1',
      reportFooter: 'NABL Accredited Laboratory'
    }
  });

  let tenant = await prisma.tenant.findUnique({ where: { slug: 'city-diagnostics-demo-lab' } });
  if (tenant) {
    await prisma.auditLog.deleteMany({ where: { tenantId: tenant.id } });
    await prisma.consentLog.deleteMany({ where: { tenantId: tenant.id } });
    await prisma.report.deleteMany({ where: { tenantId: tenant.id } });
    await prisma.invoice.deleteMany({ where: { tenantId: tenant.id } });
    await prisma.testResult.deleteMany({ where: { order: { tenantId: tenant.id } } });
    await prisma.testOrder.deleteMany({ where: { tenantId: tenant.id } });
    await prisma.analyzerMapping.deleteMany({ where: { analyzer: { tenantId: tenant.id } } });
    await prisma.analyzer.deleteMany({ where: { tenantId: tenant.id } });
    await prisma.testCatalog.deleteMany({ where: { tenantId: tenant.id } });
    await prisma.patient.deleteMany({ where: { tenantId: tenant.id } });
    await prisma.user.deleteMany({ where: { tenantId: tenant.id } });
    await prisma.tenant.delete({ where: { id: tenant.id } });
  }

  tenant = await prisma.tenant.create({
    data: {
      name: 'City Diagnostics — Demo Lab',
      slug: 'city-diagnostics-demo-lab',
      plan: 'ENTERPRISE',
      regionId: region.id,
      onboardingStep: 7,
      branchName: 'Main Branch',
      branchAddress: 'Baner, Pune, Maharashtra'
    }
  });

  const userByRole = {};
  for (const row of demoUsers) {
    const user = await prisma.user.create({
      data: {
        tenantId: tenant.id,
        email: row.email,
        phone: row.phone,
        passwordHash: await bcrypt.hash(row.password, 12),
        role: row.role,
        isVerified: true,
        mfaEnabled: row.role === 'ADMIN'
      }
    });
    userByRole[row.role] = user;
  }

  const createdPatients = [];
  for (let i = 0; i < 20; i += 1) {
    const name = patientNames[i];
    const gender = i % 2 === 0 ? 'MALE' : 'FEMALE';
    const phone = `98${String(10000000 + i).padStart(8, '0')}`;
    const dob = new Date(1975 + (i % 25), i % 12, (i % 28) + 1).toISOString().slice(0, 10);
    const patient = await prisma.patient.create({
      data: {
        tenantId: tenant.id,
        mrn: `MRN${String(1000 + i)}`,
        nameEncrypted: encryptField(name, encryptionKey),
        dobEncrypted: encryptField(dob, encryptionKey),
        gender,
        phoneEncrypted: encryptField(i === 0 ? '9999999999' : phone, encryptionKey),
        emailEncrypted: encryptField(`${name.toLowerCase().replace(/\s+/g, '.')}@mail.com`, encryptionKey),
        addressEncrypted: encryptField(`Flat ${i + 1}, Pune, Maharashtra`, encryptionKey),
        insuranceId: i % 3 === 0 ? `INS-${1000 + i}` : null,
        createdBy: userByRole.ADMIN.id
      }
    });
    createdPatients.push(patient);
  }

  const catalog = [];
  for (const t of tests) {
    const row = await prisma.testCatalog.create({
      data: {
        tenantId: tenant.id,
        code: t.code,
        name: t.name,
        category: t.category,
        normalRangeMale: t.male,
        normalRangeFemale: t.female,
        unit: t.unit,
        method: t.method,
        turnaroundHours: t.turnaroundHours,
        price: t.price,
        isActive: true
      }
    });
    catalog.push(row);
  }

  const analyzers = [];
  for (const a of analyzerSeed) {
    const row = await prisma.analyzer.create({
      data: {
        tenantId: tenant.id,
        ...a,
        isActive: true,
        lastConnectedAt: new Date()
      }
    });
    analyzers.push(row);
  }

  for (const entry of catalog.slice(0, 5)) {
    await prisma.analyzerMapping.create({
      data: {
        analyzerId: analyzers[0].id,
        machineParamName: entry.code,
        testCatalogId: entry.id,
        transformFormula: null
      }
    });
  }

  const createdOrders = [];
  for (let i = 0; i < 30; i += 1) {
    const patient = pick(createdPatients);
    const orderedAt = randomDateInLastDays(7);
    const order = await prisma.testOrder.create({
      data: {
        tenantId: tenant.id,
        patientId: patient.id,
        orderedBy: userByRole.RECEPTION.id,
        status: i < 25 ? 'COMPLETED' : 'IN_PROGRESS',
        priority: i % 9 === 0 ? 'STAT' : i % 5 === 0 ? 'URGENT' : 'ROUTINE',
        sampleCollectedAt: orderedAt,
        createdAt: orderedAt
      }
    });

    const testCount = 1 + (i % 3);
    const chosen = [...catalog].sort(() => 0.5 - Math.random()).slice(0, testCount);
    let subtotal = 0;
    for (let j = 0; j < chosen.length; j += 1) {
      const test = chosen[j];
      subtotal += Number(test.price);
      const forceCritical = i < 3 && j === 0;
      const forceAbnormal = i % 6 === 0 || forceCritical;
      const value = valueFromRange(test.normalRangeMale, forceAbnormal);
      const status = forceCritical ? 'CRITICAL' : forceAbnormal ? 'ABNORMAL' : 'NORMAL';
      await prisma.testResult.create({
        data: {
          orderId: order.id,
          testCatalogId: test.id,
          value,
          unit: test.unit,
          status,
          referenceRange: test.normalRangeMale,
          machineId: pick(analyzers).id,
          enteredBy: userByRole.TECHNICIAN.id,
          verifiedBy: i < 25 ? userByRole.PATHOLOGIST.id : null,
          analyzerRawMessage: `MSH|^~\\&|SEED|LAB|LIMS|LAB|${orderedAt.toISOString()}||ORU^R01|${order.id}|P|2.3`,
          receivedAt: orderedAt,
          verifiedAt: i < 25 ? new Date(orderedAt.getTime() + 60 * 60 * 1000) : null
        }
      });
    }

    const taxAmount = (subtotal * 18) / 100;
    await prisma.invoice.create({
      data: {
        tenantId: tenant.id,
        orderId: order.id,
        patientId: patient.id,
        subtotal,
        taxAmount,
        taxType: 'GST',
        total: subtotal + taxAmount,
        currency: 'INR',
        status: i % 4 === 0 ? 'PENDING' : 'PAID',
        createdAt: orderedAt
      }
    });

    createdOrders.push(order);
  }

  for (let i = 0; i < 15; i += 1) {
    const order = createdOrders[i];
    await prisma.report.create({
      data: {
        tenantId: tenant.id,
        orderId: order.id,
        pdfUrl: `https://example-bucket.s3.ap-south-1.amazonaws.com/${tenant.slug}/reports/${order.id}.pdf`,
        digitalSignatureHash: i < 10 ? crypto.createHash('sha256').update(`signature-${order.id}`).digest('hex') : null,
        signedBy: i < 10 ? userByRole.PATHOLOGIST.id : null,
        signedAt: i < 10 ? new Date(order.createdAt.getTime() + 2 * 60 * 60 * 1000) : null,
        deliveredAt: i < 10 ? new Date(order.createdAt.getTime() + 3 * 60 * 60 * 1000) : null,
        deliveryMethod: i < 10 ? 'PORTAL' : null,
        isAmended: false,
        amendmentReason: null
      }
    });
  }

  await prisma.otpLog.create({
    data: {
      phone: crypto.createHash('sha256').update('9999999999').digest('hex'),
      otpHash: crypto.createHash('sha256').update('123456').digest('hex'),
      expiresAt: new Date(Date.now() + 60 * 60 * 1000)
    }
  });

  console.log('Seed complete.');
  console.log('Tenant: City Diagnostics — Demo Lab');
  console.log('Credentials:');
  console.log('admin@demo-lab.com / Admin@123');
  console.log('tech@demo-lab.com / Tech@123');
  console.log('path@demo-lab.com / Path@123');
  console.log('reception@demo-lab.com / Rec@123');
  console.log('Patient OTP demo: phone 9999999999, OTP 123456');
}

run()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
