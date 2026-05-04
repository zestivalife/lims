import bcrypt from 'bcryptjs';
import { prisma } from '../../config/prisma.js';
import { parsePagination, requireFields } from '../../utils/validators.js';

export async function listUsers(req, res) {
  const { skip, take, page, pageSize } = parsePagination(req.query);
  const [data, total] = await Promise.all([
    prisma.user.findMany({
      where: { tenantId: req.user.tenantId },
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        phone: true,
        role: true,
        isVerified: true,
        active: true,
        lastLogin: true,
        createdAt: true
      }
    }),
    prisma.user.count({ where: { tenantId: req.user.tenantId } })
  ]);

  res.json({ page, pageSize, total, data });
}

export async function createUser(req, res) {
  requireFields(req.body, ['email', 'phone', 'password', 'role']);
  const user = await prisma.user.create({
    data: {
      tenantId: req.user.tenantId,
      email: req.body.email,
      phone: req.body.phone,
      passwordHash: await bcrypt.hash(req.body.password, 12),
      role: req.body.role,
      isVerified: true
    }
  });

  res.status(201).json({ id: user.id, email: user.email, role: user.role, active: user.active });
}

export async function updateUser(req, res) {
  const existing = await prisma.user.findFirst({
    where: { id: req.params.id, tenantId: req.user.tenantId }
  });
  if (!existing) {
    return res.status(404).json({ message: 'User not found' });
  }

  req.auditOldValue = existing;

  const updated = await prisma.user.update({
    where: { id: existing.id },
    data: {
      email: req.body.email ?? existing.email,
      phone: req.body.phone ?? existing.phone,
      role: req.body.role ?? existing.role,
      active: req.body.active ?? existing.active,
      isVerified: req.body.isVerified ?? existing.isVerified,
      passwordHash: req.body.password ? await bcrypt.hash(req.body.password, 12) : existing.passwordHash
    }
  });

  res.json({ id: updated.id, email: updated.email, role: updated.role, active: updated.active });
}

export async function deactivateUser(req, res) {
  const existing = await prisma.user.findFirst({
    where: { id: req.params.id, tenantId: req.user.tenantId }
  });
  if (!existing) {
    return res.status(404).json({ message: 'User not found' });
  }

  await prisma.user.update({ where: { id: existing.id }, data: { active: false } });
  res.json({ message: 'User deactivated', id: existing.id });
}
