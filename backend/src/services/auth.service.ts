import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/prisma.js';
import { env } from '../config/env.js';
import { JWT_EXPIRATION } from '../config/constants.js';
import { AppError } from '../utils/app-error.js';

async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    include: { role: true },
  });

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
      fullName: user.fullName,
      email: user.email,
      role: user.role.name,
    },
  };
}

async function register(data: {
  fullName: string;
  email: string;
  password: string;
  roleId: number;
  phone?: string;
  department?: string;
}) {
  const existing = await prisma.user.findUnique({
    where: { email: data.email },
  });
  if (existing) {
    throw new AppError(409, 'El email ya está registrado');
  }

  const passwordHash = await argon2.hash(data.password);

  const user = await prisma.user.create({
    data: {
      fullName: data.fullName,
      email: data.email,
      passwordHash,
      roleId: data.roleId,
      phone: data.phone,
      department: data.department,
    },
    include: { role: true },
  });

  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    role: user.role.name,
  };
}

export const authService = { login, register };
