import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/prisma.js';
import { env } from '../config/env.js';
import { JWT_EXPIRATION } from '../config/constants.js';
import { AppError } from '../utils/app-error.js';
import { Department } from '../../generated/prisma/enums.js';

// Helper para acceder al role con el include
type UserWithRole = Awaited<ReturnType<typeof prisma.user.findUnique>> & { role: { name: string } };

async function login(email: string, password: string) {
  const user = (await prisma.user.findUnique({
    where: { email },
    include: { role: true },
  })) as UserWithRole | null;

  if (!user || !user.isActive) {
    throw new AppError(401, 'Credenciales inválidas');
  }

  const valid = await argon2.verify(user.passwordHash, password);
  if (!valid) {
    throw new AppError(401, 'Credenciales inválidas');
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role.name },
    env.JWT_SECRET,
    { expiresIn: JWT_EXPIRATION }
  );

  return {
    token,
    user: {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role.name,
    },
  };
}

async function register(data: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  roleId?: number;
  phone?: string;
  department?: Department;
}) {
  const existing = await prisma.user.findUnique({
    where: { email: data.email },
  });
  if (existing) {
    throw new AppError(409, 'El email ya está registrado');
  }

  // Si no viene roleId, se asigna REQUESTER (id = 3) por defecto
  let roleId = data.roleId;
  if (!roleId) {
    const requesterRole = await prisma.role.findUnique({
      where: { name: 'REQUESTER' },
    });
    if (!requesterRole) {
      throw new AppError(500, 'Rol REQUESTER no encontrado. Ejecutá el seed.');
    }
    roleId = requesterRole.id;
  }

  const passwordHash = await argon2.hash(data.password);

  const user = (await prisma.user.create({
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      passwordHash,
      roleId,
      phone: data.phone,
      department: data.department ?? null,
    },
    include: { role: true },
  })) as UserWithRole;

  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role.name,
  };
}

async function registerPublic(data: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
}) {
  // Verificar email único
  const existing = await prisma.user.findUnique({
    where: { email: data.email },
  });
  if (existing) {
    throw new AppError(409, 'El email ya está registrado');
  }

  // Obtener rol REQUESTER obligatoriamente
  const requesterRole = await prisma.role.findUnique({
    where: { name: 'REQUESTER' },
  });
  if (!requesterRole) {
    throw new AppError(500, 'Rol REQUESTER no encontrado. Ejecutá el seed.');
  }

  const passwordHash = await argon2.hash(data.password);

  // Crear usuario REQUESTER (sin department - son ciudadanos)
  const user = (await prisma.user.create({
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      passwordHash,
      roleId: requesterRole.id,
      phone: data.phone || null,
      department: null, // REQUESTER no tiene departamento
    },
    include: { role: true },
  })) as UserWithRole;

  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role.name,
  };
}

export const authService = { login, register, registerPublic, getProfile };

async function getProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { role: true },
  }) as UserWithRole | null;

  if (!user || !user.isActive) {
    throw new AppError(401, 'Usuario no encontrado o inactivo');
  }

  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role.name,
    department: user.department,
  };
}

