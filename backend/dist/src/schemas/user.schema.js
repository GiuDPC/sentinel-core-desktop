import { z } from 'zod';
export const updateUserSchema = z.object({
    firstName: z.string().min(2).optional(),
    lastName: z.string().min(2).optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    department: z.enum(['ELECTRICIDAD', 'AGUAS_Y_SANEAMIENTO', 'INFRAESTRUCTURA_VIAL', 'ASEO_URBANO', 'PROTECCION_CIVIL', 'TELECOMUNICACIONES', 'SALUD_PUBLICA', 'ADMINISTRACION', 'OTROS']).optional(),
    roleId: z.number().int().positive().optional(),
    isActive: z.boolean().optional(),
});
// Schema para actualizar perfil propio (campos más limitados)
export const updateProfileSchema = z.object({
    firstName: z.string().min(2, 'Nombre muy corto').optional(),
    lastName: z.string().min(2, 'Apellido muy corto').optional(),
    phone: z.string().optional(),
});
