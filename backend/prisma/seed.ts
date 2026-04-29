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

  // ── 2. Categorías con SLA y Departamento ──────────
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { name: 'Falla de Alumbrado Público' },
      update: {},
      create: { name: 'Falla de Alumbrado Público', department: 'MANTENIMIENTO_ELECTRICO', slaHours: 48 },
    }),
    prisma.category.upsert({
      where: { name: 'Transformador Quemado / Guayas' },
      update: {},
      create: { name: 'Transformador Quemado / Guayas', department: 'MANTENIMIENTO_ELECTRICO', slaHours: 12 },
    }),
    prisma.category.upsert({
      where: { name: 'Bote de Aguas Blancas' },
      update: {},
      create: { name: 'Bote de Aguas Blancas', department: 'PLOMERIA', slaHours: 24 },
    }),
    prisma.category.upsert({
      where: { name: 'Desborde de Cloacas' },
      update: {},
      create: { name: 'Desborde de Cloacas', department: 'PLOMERIA', slaHours: 24 },
    }),
    prisma.category.upsert({
      where: { name: 'Hueco en la Vía / Asfalto' },
      update: {},
      create: { name: 'Hueco en la Vía / Asfalto', department: 'INFRAESTRUCTURA', slaHours: 72 },
    }),
    prisma.category.upsert({
      where: { name: 'Falta de Recolección de Basura' },
      update: {},
      create: { name: 'Falta de Recolección de Basura', department: 'OTROS', slaHours: 24 },
    }),
    prisma.category.upsert({
      where: { name: 'Árbol a punto de Caer / Riesgo' },
      update: {},
      create: { name: 'Árbol a punto de Caer / Riesgo', department: 'SEGURIDAD', slaHours: 6 },
    }),
    prisma.category.upsert({
      where: { name: 'Cables Caídos / Sin Internet' },
      update: {},
      create: { name: 'Cables Caídos / Sin Internet', department: 'REDES_Y_TELECOMUNICACIONES', slaHours: 48 },
    }),
    prisma.category.upsert({
      where: { name: 'Falta de Insumos en Ambulatorio' },
      update: {},
      create: { name: 'Falta de Insumos en Ambulatorio', department: 'OTROS', slaHours: 24 },
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
      firstName: 'Administrador',
      lastName: 'del Sistema',
      email: 'admin@sentinel.local',
      passwordHash,
      roleId: adminRole.id,
      department: 'ADMINISTRACION',
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
      firstName: 'Carlos',
      lastName: 'Pérez',
      email: 'carlos.perez@sentinel.local',
      passwordHash: techPassword,
      roleId: techRole.id,
      department: 'REDES_Y_TELECOMUNICACIONES',
      phone: '0412-1234567',
    },
  });

  const tech2 = await prisma.user.upsert({
    where: { email: 'maria.lopez@sentinel.local' },
    update: {},
    create: {
      firstName: 'María',
      lastName: 'López',
      email: 'maria.lopez@sentinel.local',
      passwordHash: techPassword,
      roleId: techRole.id,
      department: 'INFRAESTRUCTURA',
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
      firstName: 'Juan',
      lastName: 'García',
      email: 'juan.garcia@sentinel.local',
      passwordHash: reqPassword,
      roleId: reqRole.id,
      department: null,
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