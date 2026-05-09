import bcrypt from 'bcryptjs';
import { prisma } from '../../config/prisma.js';
import { encryptField } from '../../utils/encryption.js';

const BOOTSTRAP_USERS = [
  { email: 'tech@demo-lab.com', phone: '9999999991', password: 'Tech@123', role: 'TECHNICIAN' },
  { email: 'path@demo-lab.com', phone: '9999999992', password: 'Path@123', role: 'PATHOLOGIST' },
  { email: 'recep@demo-lab.com', phone: '9999999993', password: 'Recep@123', role: 'RECEPTION' },
  { email: 'patient@demo-lab.com', phone: '9999999999', password: 'Patient@123', role: 'PATIENT' }
];

const BOOTSTRAP_TESTS = [
  { code: 'CBC', name: 'Complete Blood Count', category: 'HEMATOLOGY', unit: 'g/dL', method: 'Automated', turnaroundHours: 4, price: 450, male: '13-17', female: '12-15' },
  { code: 'HGB', name: 'Hemoglobin', category: 'HEMATOLOGY', unit: 'g/dL', method: 'Automated', turnaroundHours: 4, price: 180, male: '13-17', female: '12-15' },
  { code: 'ESR', name: 'ESR', category: 'HEMATOLOGY', unit: 'mm/hr', method: 'Westergren', turnaroundHours: 4, price: 200, male: '0-15', female: '0-20' },
  { code: 'GLU', name: 'Glucose Fasting', category: 'BIOCHEMISTRY', unit: 'mg/dL', method: 'Hexokinase', turnaroundHours: 2, price: 250, male: '70-100', female: '70-100' },
  { code: 'LFT', name: 'Liver Function Test', category: 'BIOCHEMISTRY', unit: 'U/L', method: 'Photometry', turnaroundHours: 8, price: 900, male: '7-56', female: '7-56' },
  { code: 'KFT', name: 'Kidney Function Test', category: 'BIOCHEMISTRY', unit: 'mg/dL', method: 'Photometry', turnaroundHours: 8, price: 850, male: '0.6-1.3', female: '0.5-1.1' },
  { code: 'TSH', name: 'TSH', category: 'ENDOCRINOLOGY', unit: 'uIU/mL', method: 'CLIA', turnaroundHours: 8, price: 500, male: '0.4-4.0', female: '0.4-4.0' },
  { code: 'HBA1C', name: 'HbA1c', category: 'BIOCHEMISTRY', unit: '%', method: 'HPLC', turnaroundHours: 6, price: 700, male: '4.0-5.6', female: '4.0-5.6' },
  { code: 'URIN', name: 'Urine Routine', category: 'CLINICAL_PATHOLOGY', unit: 'cells/HPF', method: 'Microscopy', turnaroundHours: 6, price: 300, male: '0-5', female: '0-5' },
  { code: 'CRP', name: 'C-Reactive Protein', category: 'SEROLOGY', unit: 'mg/L', method: 'Immunoturbidimetry', turnaroundHours: 6, price: 650, male: '0-5', female: '0-5' }
];

const BOOTSTRAP_PATIENTS = [
  ['Aarav Sharma', 'MALE', '9999999999'],
  ['Isha Patil', 'FEMALE', '9891000001'],
  ['Rohan Kulkarni', 'MALE', '9891000002'],
  ['Sneha Deshmukh', 'FEMALE', '9891000003'],
  ['Arjun Nair', 'MALE', '9891000004'],
  ['Meera Gupta', 'FEMALE', '9891000005'],
  ['Vivaan Joshi', 'MALE', '9891000006'],
  ['Kavya Singh', 'FEMALE', '9891000007'],
  ['Aditya Chavan', 'MALE', '9891000008'],
  ['Pooja Sawant', 'FEMALE', '9891000009']
];

const BOOTSTRAP_ANALYZERS = [
  { name: 'Sysmex XN-1000', model: 'XN-1000', manufacturer: 'Sysmex', protocol: 'HL7', ipAddress: '10.0.1.10', port: 5000 },
  { name: 'Roche Cobas c311', model: 'Cobas c311', manufacturer: 'Roche', protocol: 'ASTM', ipAddress: '10.0.1.11', port: 5001 },
  { name: 'Mindray BC-6800', model: 'BC-6800', manufacturer: 'Mindray', protocol: 'HL7', ipAddress: '10.0.1.12', port: 5002 }
];

function pick(array, index) {
  return array[index % array.length];
}

function isoDobForIndex(index) {
  return new Date(1980 + (index % 12), index % 12, (index % 28) + 1).toISOString().slice(0, 10);
}

function generateValue(range, variant = 'normal') {
  const [minRaw, maxRaw] = String(range)
    .split('-')
    .map((item) => Number(item.trim()));

  if (Number.isNaN(minRaw) || Number.isNaN(maxRaw)) {
    return '0';
  }

  const spread = maxRaw - minRaw;
  if (variant === 'critical') return String((maxRaw + Math.max(spread * 0.85, 2)).toFixed(2));
  if (variant === 'abnormal') return String((maxRaw + Math.max(spread * 0.35, 1)).toFixed(2));
  return String((minRaw + spread * 0.45).toFixed(2));
}

export async function ensureTenantBootstrapped({ tenant, region, adminUser }) {
  const supportUsers = { ADMIN: adminUser };

  for (const member of BOOTSTRAP_USERS) {
    const user = await prisma.user.upsert({
      where: {
        tenantId_email: {
          tenantId: tenant.id,
          email: member.email
        }
      },
      update: {
        phone: member.phone,
        role: member.role,
        isVerified: true,
        active: true
      },
      create: {
        tenantId: tenant.id,
        email: member.email,
        phone: member.phone,
        passwordHash: await bcrypt.hash(member.password, 12),
        role: member.role,
        isVerified: true,
        active: true
      }
    });
    supportUsers[member.role] = user;
  }

  const createdTests = [];
  for (const test of BOOTSTRAP_TESTS) {
    const row = await prisma.testCatalog.upsert({
      where: {
        tenantId_code: {
          tenantId: tenant.id,
          code: test.code
        }
      },
      update: {
        name: test.name,
        category: test.category,
        normalRangeMale: test.male,
        normalRangeFemale: test.female,
        unit: test.unit,
        method: test.method,
        turnaroundHours: test.turnaroundHours,
        price: test.price,
        isActive: true
      },
      create: {
        tenantId: tenant.id,
        code: test.code,
        name: test.name,
        category: test.category,
        normalRangeMale: test.male,
        normalRangeFemale: test.female,
        unit: test.unit,
        method: test.method,
        turnaroundHours: test.turnaroundHours,
        price: test.price,
        isActive: true
      }
    });
    createdTests.push(row);
  }

  const analyzers = [];
  for (const analyzer of BOOTSTRAP_ANALYZERS) {
    let row = await prisma.analyzer.findFirst({
      where: {
        tenantId: tenant.id,
        name: analyzer.name
      }
    });

    if (!row) {
      row = await prisma.analyzer.create({
        data: {
          tenantId: tenant.id,
          ...analyzer,
          isActive: true,
          lastConnectedAt: new Date()
        }
      });
    }

    analyzers.push(row);
  }

  for (let index = 0; index < createdTests.length; index += 1) {
    const analyzer = analyzers[index % analyzers.length];
    const machineParamName = `${createdTests[index].code}_AUTO`;
    const mapping = await prisma.analyzerMapping.findFirst({
      where: {
        analyzerId: analyzer.id,
        machineParamName
      }
    });

    if (!mapping) {
      await prisma.analyzerMapping.create({
        data: {
          analyzerId: analyzer.id,
          machineParamName,
          testCatalogId: createdTests[index].id,
          transformFormula: 'x*1.0'
        }
      });
    }
  }

  const patientsCount = await prisma.patient.count({ where: { tenantId: tenant.id } });
  const createdPatients = [];
  if (patientsCount === 0) {
    for (let index = 0; index < BOOTSTRAP_PATIENTS.length; index += 1) {
      const [name, gender, phone] = BOOTSTRAP_PATIENTS[index];
      const patient = await prisma.patient.create({
        data: {
          tenantId: tenant.id,
          mrn: `MRN${String(1000 + index)}`,
          nameEncrypted: encryptField(name),
          dobEncrypted: encryptField(isoDobForIndex(index)),
          gender,
          phoneEncrypted: encryptField(phone),
          emailEncrypted: encryptField(`${name.toLowerCase().replace(/\s+/g, '.')}@mail.com`),
          addressEncrypted: encryptField(`Flat ${index + 1}, Main Road, India`),
          insuranceId: index % 3 === 0 ? `INS-${1000 + index}` : null,
          createdBy: adminUser.id
        }
      });
      createdPatients.push(patient);
    }
  } else {
    createdPatients.push(...(await prisma.patient.findMany({ where: { tenantId: tenant.id }, take: 10, orderBy: { createdAt: 'asc' } })));
  }

  const orderCount = await prisma.testOrder.count({ where: { tenantId: tenant.id } });
  const createdOrders = [];
  if (orderCount === 0) {
    for (let index = 0; index < 10; index += 1) {
      const patient = createdPatients[index];
      const createdAt = new Date(Date.now() - index * 6 * 60 * 60 * 1000);
      const status = index < 4 ? 'COMPLETED' : index < 8 ? 'IN_PROGRESS' : 'PENDING';
      const order = await prisma.testOrder.create({
        data: {
          tenantId: tenant.id,
          patientId: patient.id,
          orderedBy: supportUsers.RECEPTION?.id || adminUser.id,
          status,
          priority: index % 5 === 0 ? 'URGENT' : 'ROUTINE',
          sampleCollectedAt: status === 'PENDING' ? null : createdAt,
          createdAt
        }
      });

      const selectedTests = [
        createdTests[index % createdTests.length],
        createdTests[(index + 1) % createdTests.length]
      ];

      let subtotal = 0;
      for (let testIndex = 0; testIndex < selectedTests.length; testIndex += 1) {
        const test = selectedTests[testIndex];
        subtotal += Number(test.price);
        const variant = index === 0 && testIndex === 0 ? 'critical' : index % 3 === 0 ? 'abnormal' : 'normal';
        const resultStatus = variant === 'critical' ? 'CRITICAL' : variant === 'abnormal' ? 'ABNORMAL' : 'NORMAL';
        await prisma.testResult.create({
          data: {
            orderId: order.id,
            testCatalogId: test.id,
            value: status === 'PENDING' ? '' : generateValue(test.normalRangeMale, variant),
            unit: test.unit,
            status: resultStatus,
            referenceRange: test.normalRangeMale,
            machineId: analyzers[testIndex % analyzers.length].id,
            enteredBy: supportUsers.TECHNICIAN?.id || adminUser.id,
            verifiedBy: status === 'COMPLETED' ? supportUsers.PATHOLOGIST?.id || adminUser.id : null,
            analyzerRawMessage: `MSH|^~\\\\&|BOOTSTRAP|LAB|LIMS|LAB|${createdAt.toISOString()}||ORU^R01|${order.id}|P|2.3`,
            receivedAt: createdAt,
            verifiedAt: status === 'COMPLETED' ? new Date(createdAt.getTime() + 30 * 60 * 1000) : null
          }
        });
      }

      const taxAmount = Number(((subtotal * Number(region.taxRate || 18)) / 100).toFixed(2));
      const invoiceStatus = index % 4 === 0 ? 'PENDING' : 'PAID';
      await prisma.invoice.create({
        data: {
          tenantId: tenant.id,
          orderId: order.id,
          patientId: patient.id,
          subtotal,
          taxAmount,
          taxType: region.taxType,
          total: Number((subtotal + taxAmount).toFixed(2)),
          currency: region.currency,
          status: invoiceStatus,
          createdAt
        }
      });

      if (index < 6) {
        await prisma.report.create({
          data: {
            tenantId: tenant.id,
            orderId: order.id,
            pdfUrl: `https://demo-storage.example/${tenant.slug}/reports/${order.id}.pdf`,
            digitalSignatureHash: status === 'COMPLETED' ? `signed-${order.id}` : null,
            signedBy: status === 'COMPLETED' ? supportUsers.PATHOLOGIST?.id || adminUser.id : null,
            signedAt: status === 'COMPLETED' ? new Date(createdAt.getTime() + 2 * 60 * 60 * 1000) : null,
            deliveredAt: index < 3 ? new Date(createdAt.getTime() + 3 * 60 * 60 * 1000) : null,
            deliveryMethod: index < 3 ? 'PORTAL' : null,
            isAmended: false
          }
        });
      }

      createdOrders.push(order);
    }
  } else {
    createdOrders.push(...(await prisma.testOrder.findMany({ where: { tenantId: tenant.id }, take: 10, orderBy: { createdAt: 'desc' } })));
  }

  const auditCount = await prisma.auditLog.count({ where: { tenantId: tenant.id } });
  if (auditCount === 0) {
    for (let index = 0; index < 14; index += 1) {
      await prisma.auditLog.create({
        data: {
          tenantId: tenant.id,
          userId: index % 2 === 0 ? adminUser.id : supportUsers.TECHNICIAN?.id || adminUser.id,
          action: ['PATIENT_CREATE', 'ORDER_CREATE', 'RESULT_UPDATE', 'REPORT_SIGN', 'INVOICE_UPDATE'][index % 5],
          entityType: ['Patient', 'TestOrder', 'TestResult', 'Report', 'Invoice'][index % 5],
          entityId: createdOrders[index % createdOrders.length]?.id || null,
          oldValue: index % 2 === 0 ? { status: 'PENDING' } : null,
          newValue: { status: ['IN_PROGRESS', 'COMPLETED'][index % 2] },
          ipAddress: `10.10.0.${index + 10}`,
          userAgent: 'OnboardingBootstrap/1.0'
        }
      });
    }
  }

  await prisma.tenant.update({
    where: { id: tenant.id },
    data: {
      onboardingStep: 7,
      branchName: tenant.branchName || tenant.name,
      branchAddress: tenant.branchAddress || 'Primary branch - to be configured'
    }
  });

  return {
    supportUsers,
    createdPatients: createdPatients.length,
    createdTests: createdTests.length,
    createdOrders: createdOrders.length
  };
}
