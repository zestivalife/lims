import { prisma } from '../../config/prisma.js';
import { decryptPatientRecord, encryptPatientPayload } from '../../middleware/encryption.js';
import { parsePagination, requireFields } from '../../utils/validators.js';

function mapPatient(record) {
  const decrypted = decryptPatientRecord(record);
  return {
    id: decrypted.id,
    tenantId: decrypted.tenantId,
    mrn: decrypted.mrn,
    name: decrypted.name,
    dob: decrypted.dob,
    gender: decrypted.gender,
    phone: decrypted.phone,
    email: decrypted.email,
    address: decrypted.address,
    insuranceId: decrypted.insuranceId,
    createdAt: decrypted.createdAt,
    createdBy: decrypted.createdBy
  };
}

export async function listPatients(req, res) {
  const { skip, take, page, pageSize } = parsePagination(req.query);
  const q = req.query.q?.trim();

  const where = {
    tenantId: req.user.tenantId,
    ...(q
      ? {
          OR: [
            { mrn: { contains: q, mode: 'insensitive' } },
            { insuranceId: { contains: q, mode: 'insensitive' } }
          ]
        }
      : {})
  };

  const [rows, total] = await Promise.all([
    prisma.patient.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
    prisma.patient.count({ where })
  ]);

  res.json({
    page,
    pageSize,
    total,
    data: rows.map(mapPatient)
  });
}

export async function createPatient(req, res) {
  requireFields(req.body, ['mrn', 'name', 'dob', 'gender', 'phone']);

  const encrypted = encryptPatientPayload(req.body);

  const patient = await prisma.patient.create({
    data: {
      tenantId: req.user.tenantId,
      mrn: req.body.mrn,
      nameEncrypted: encrypted.nameEncrypted,
      dobEncrypted: encrypted.dobEncrypted,
      gender: req.body.gender,
      phoneEncrypted: encrypted.phoneEncrypted,
      emailEncrypted: encrypted.emailEncrypted,
      addressEncrypted: encrypted.addressEncrypted,
      insuranceId: req.body.insuranceId || null,
      createdBy: req.user.id
    }
  });

  res.status(201).json(mapPatient(patient));
}

export async function getPatient(req, res) {
  const patient = await prisma.patient.findFirst({
    where: {
      id: req.params.id,
      tenantId: req.user.tenantId
    }
  });

  if (!patient) {
    return res.status(404).json({ message: 'Patient not found' });
  }

  if (req.user.role === 'PATIENT' && req.user.id !== patient.createdBy) {
    return res.status(403).json({ message: 'Access denied' });
  }

  res.json(mapPatient(patient));
}

export async function updatePatient(req, res) {
  const existing = await prisma.patient.findFirst({
    where: { id: req.params.id, tenantId: req.user.tenantId }
  });
  if (!existing) {
    return res.status(404).json({ message: 'Patient not found' });
  }

  req.auditOldValue = existing;
  const encrypted = encryptPatientPayload({
    name: req.body.name ?? decryptPatientRecord(existing).name,
    dob: req.body.dob ?? decryptPatientRecord(existing).dob,
    phone: req.body.phone ?? decryptPatientRecord(existing).phone,
    email: req.body.email ?? decryptPatientRecord(existing).email,
    address: req.body.address ?? decryptPatientRecord(existing).address
  });

  const updated = await prisma.patient.update({
    where: { id: req.params.id },
    data: {
      mrn: req.body.mrn ?? existing.mrn,
      nameEncrypted: encrypted.nameEncrypted,
      dobEncrypted: encrypted.dobEncrypted,
      gender: req.body.gender ?? existing.gender,
      phoneEncrypted: encrypted.phoneEncrypted,
      emailEncrypted: encrypted.emailEncrypted,
      addressEncrypted: encrypted.addressEncrypted,
      insuranceId: req.body.insuranceId ?? existing.insuranceId
    }
  });

  res.json(mapPatient(updated));
}

export async function patientHistory(req, res) {
  const patient = await prisma.patient.findFirst({
    where: {
      id: req.params.id,
      tenantId: req.user.tenantId
    },
    include: {
      orders: {
        include: {
          results: {
            include: {
              testCatalog: true
            }
          },
          report: true,
          invoice: true
        },
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  if (!patient) {
    return res.status(404).json({ message: 'Patient not found' });
  }

  res.json({
    patient: mapPatient(patient),
    history: patient.orders
  });
}

export async function mergeDuplicates(req, res) {
  requireFields(req.body, ['sourcePatientId', 'targetPatientId']);

  const source = await prisma.patient.findFirst({
    where: { id: req.body.sourcePatientId, tenantId: req.user.tenantId }
  });
  const target = await prisma.patient.findFirst({
    where: { id: req.body.targetPatientId, tenantId: req.user.tenantId }
  });

  if (!source || !target) {
    return res.status(404).json({ message: 'Source or target patient not found' });
  }

  await prisma.testOrder.updateMany({
    where: { patientId: source.id },
    data: { patientId: target.id }
  });

  await prisma.invoice.updateMany({
    where: { patientId: source.id },
    data: { patientId: target.id }
  });

  await prisma.patient.delete({ where: { id: source.id } });

  res.json({ message: 'Patients merged successfully', targetPatientId: target.id });
}
