import 'dotenv/config';
import { PrismaClient } from '../generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import argon2 from 'argon2';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🏬 Sembrando datos para Centro Comercial...');

  // ── 1. Roles ───────────────────────────────────────
  const roles = await Promise.all([
    prisma.role.upsert({
      where: { name: 'ADMIN' },
      update: {},
      create: { name: 'ADMIN', description: 'Administrador del centro comercial' },
    }),
    prisma.role.upsert({
      where: { name: 'TECHNICIAN' },
      update: {},
      create: { name: 'TECHNICIAN', description: 'Técnico de mantenimiento' },
    }),
    prisma.role.upsert({
      where: { name: 'REQUESTER' },
      update: {},
      create: { name: 'REQUESTER', description: 'Locatario / inquilino del centro comercial' },
    }),
  ]);
  console.log(`✅ ${roles.length} roles creados`);

  // ── 2. Categorías de Incidencias del Mall ──────────
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { name: 'Corte Eléctrico' },
      update: {},
      create: { name: 'Corte Eléctrico', department: 'MANTENIMIENTO_ELECTRICO', slaHours: 4 },
    }),
    prisma.category.upsert({
      where: { name: 'Fuga de Agua' },
      update: {},
      create: { name: 'Fuga de Agua', department: 'PLOMERIA', slaHours: 6 },
    }),
    prisma.category.upsert({
      where: { name: 'Falla de Red / Internet' },
      update: {},
      create: { name: 'Falla de Red / Internet', department: 'REDES_Y_TELECOMUNICACIONES', slaHours: 8 },
    }),
    prisma.category.upsert({
      where: { name: 'Infraestructura Física' },
      update: {},
      create: { name: 'Infraestructura Física', department: 'INFRAESTRUCTURA', slaHours: 24 },
    }),
    prisma.category.upsert({
      where: { name: 'Incendio / Emergencia' },
      update: {},
      create: { name: 'Incendio / Emergencia', department: 'SEGURIDAD', slaHours: 1 },
    }),
    prisma.category.upsert({
      where: { name: 'Sistema de Seguridad' },
      update: {},
      create: { name: 'Sistema de Seguridad', department: 'SEGURIDAD', slaHours: 2 },
    }),
  ]);
  console.log(`✅ ${categories.length} categorías del mall creadas`);

  // ── 3. Usuario Admin ───────────────────────────────
  const adminRole = roles.find((r) => r.name === 'ADMIN')!;
  const passwordHash = await argon2.hash('SentinelAdmin2026!');

  const admin = await prisma.user.upsert({
    where: { email: 'admin@sentinel.local' },
    update: {},
    create: {
      firstName: 'Administrador',
      lastName: 'del Centro Comercial',
      email: 'admin@sentinel.local',
      passwordHash,
      roleId: adminRole.id,
      department: 'ADMINISTRACION',
    },
  });
  console.log(`✅ Admin creado: ${admin.email}`);

  // ── 4. Técnicos de mantenimiento ──────────────────
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
      department: 'MANTENIMIENTO_ELECTRICO',
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
      department: 'PLOMERIA',
      phone: '0414-7654321',
    },
  });
  console.log(`✅ Técnicos creados: ${tech1.email}, ${tech2.email}`);

  // ── 5. Locatario de prueba ─────────────────────────
  const reqRole = roles.find((r) => r.name === 'REQUESTER')!;
  const reqPassword = await argon2.hash('Locatario2026!');

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
  console.log(`✅ Locatario creado: ${requester.email}`);

  console.log('\n🏬 Seed del Centro Comercial completado exitosamente!');
}

main()
  .catch((e) => {
    console.error('❌ Error en el seed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
