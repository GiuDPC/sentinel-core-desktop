import 'dotenv/config';
import { PrismaClient } from '../generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import argon2 from 'argon2';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Sembrando datos iniciales...');

  // ── 1. Roles ───────────────────────────────────────
  const roles = await Promise.all([
    prisma.role.upsert({
      where: { name: 'ADMIN' },
      update: {},
      create: { name: 'ADMIN', description: 'Administrador del sistema' },
    }),
    prisma.role.upsert({
      where: { name: 'TECHNICIAN' },
      update: {},
      create: { name: 'TECHNICIAN', description: 'Técnico de campo' },
    }),
    prisma.role.upsert({
      where: { name: 'REQUESTER' },
      update: {},
      create: { name: 'REQUESTER', description: 'Solicitante de incidencias' },
    }),
  ]);
  console.log(`${roles.length} roles creados`);

  // ── 2. Categorías con SLA ──────────────────────────
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { name: 'Corte Eléctrico' },
      update: {},
      create: { name: 'Corte Eléctrico', slaHours: 4 },
    }),
    prisma.category.upsert({
      where: { name: 'Fuga de Agua' },
      update: {},
      create: { name: 'Fuga de Agua', slaHours: 6 },
    }),
    prisma.category.upsert({
      where: { name: 'Falla de Red' },
      update: {},
      create: { name: 'Falla de Red', slaHours: 8 },
    }),
    prisma.category.upsert({
      where: { name: 'Infraestructura Física' },
      update: {},
      create: { name: 'Infraestructura Física', slaHours: 24 },
    }),
    prisma.category.upsert({
      where: { name: 'Equipos y Hardware' },
      update: {},
      create: { name: 'Equipos y Hardware', slaHours: 12 },
    }),
  ]);
  console.log(`${categories.length} categorías creadas`);

  // ── 3. Usuario Admin ───────────────────────────────
  const adminRole = roles.find((r) => r.name === 'ADMIN')!;
  const passwordHash = await argon2.hash('SentinelAdmin2026!');

  const admin = await prisma.user.upsert({
    where: { email: 'admin@sentinel.local' },
    update: {},
    create: {
      fullName: 'Administrador del Sistema',
      email: 'admin@sentinel.local',
      passwordHash,
      roleId: adminRole.id,
      department: 'Dirección General',
    },
  });
  console.log(`Admin creado: ${admin.email}`);

  // ── 4. Técnicos de prueba ─────────────────────────
  const techRole = roles.find((r) => r.name === 'TECHNICIAN')!;
  const techPassword = await argon2.hash('Tecnico2026!');

  const tech1 = await prisma.user.upsert({
    where: { email: 'carlos.perez@sentinel.local' },
    update: {},
    create: {
      fullName: 'Carlos Pérez',
      email: 'carlos.perez@sentinel.local',
      passwordHash: techPassword,
      roleId: techRole.id,
      department: 'Redes',
      phone: '0412-1234567',
    },
  });

  const tech2 = await prisma.user.upsert({
    where: { email: 'maria.lopez@sentinel.local' },
    update: {},
    create: {
      fullName: 'María López',
      email: 'maria.lopez@sentinel.local',
      passwordHash: techPassword,
      roleId: techRole.id,
      department: 'Infraestructura',
      phone: '0414-7654321',
    },
  });
  console.log(`Técnicos creados: ${tech1.email}, ${tech2.email}`);

  // ── 5. Solicitante de prueba ───────────────────────
  const reqRole = roles.find((r) => r.name === 'REQUESTER')!;
  const reqPassword = await argon2.hash('Solicitante2026!');

  const requester = await prisma.user.upsert({
    where: { email: 'juan.garcia@sentinel.local' },
    update: {},
    create: {
      fullName: 'Juan García',
      email: 'juan.garcia@sentinel.local',
      passwordHash: reqPassword,
      roleId: reqRole.id,
      department: 'Administración',
    },
  });
  console.log(`Solicitante creado: ${requester.email}`);

  console.log('Seed completado exitosamente!');
}

main()
  .catch((e) => {
    console.error('❌ Error en el seed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
