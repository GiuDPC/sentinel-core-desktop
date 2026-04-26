import { z } from 'zod';

const departmentEnum = z.enum([
  'MANTENIMIENTO_ELECTRICO',
  'PLOMERIA',
  'SEGURIDAD',
  'INFRAESTRUCTURA',
  'REDES_Y_TELECOMUNICACIONES',
  'ADMINISTRACION',
  'OTROS',
])

export const createCategorySchema = z.object({
  name: z.string().min(2, 'Nombre muy corto'),
  department: departmentEnum,
  slaHours: z.number().int().positive('Horas SLA inválidas'),
})

export const updateCategorySchema = z.object({
  name: z.string().min(2).optional(),
  department: departmentEnum.optional(),
  slaHours: z.number().int().positive().optional(),
  isActive: z.boolean().optional(),
})