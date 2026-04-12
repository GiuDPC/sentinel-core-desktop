import { prisma } from '../config/prisma.js';
import { AppError } from '../utils/app-error.js';

async function findAll() {
  const users = await prisma.user.findMany({
    where: { isActive: true },
    include: { role: true },
    orderBy: { createdAt: 'desc' },
  });

  // Quitar passwordHash de la respuesta
  return users.map(({ passwordHash, ...user }) => user);
}

async function findById(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    include: { role: true },
  });

  if (!user) {
    throw new AppError(404, 'Usuario no encontrado');
  }

  const { passwordHash, ...safeUser } = user;
  return safeUser;
}

async function update(id: string, data: {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  department?: string;
  roleId?: number;
  isActive?: boolean;
}) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    throw new AppError(404, 'Usuario no encontrado');
  }

  // Si cambia el email, verificar que no esté en uso
  if (data.email && data.email !== user.email) {
    const existing = await prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existing) {
      throw new AppError(409, 'El email ya está en uso');
    }
  }

  const updated = await prisma.user.update({
    where: { id },
    data,
    include: { role: true },
  });

  const { passwordHash, ...safeUser } = updated;
  return safeUser;
}

async function softDelete(id: string) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    throw new AppError(404, 'Usuario no encontrado');
  }

  await prisma.user.update({
    where: { id },
    data: { isActive: false },
  });

  return { message: 'Usuario desactivado' };
}

export const userService = { findAll, findById, update, softDelete };
