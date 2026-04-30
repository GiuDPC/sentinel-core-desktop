import { z } from 'zod';
// Regex solo letras (incluye ñ, acentos, espacios)
const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
export const updateUserSchema = z.object({
    firstName: z.string().min(2).optional(),
    lastName: z.string().min(2).optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    department: z.enum(['ELECTRICIDAD', 'AGUAS_Y_SANEAMIENTO', 'INFRAESTRUCTURA_VIAL', 'ASEO_URBANO', 'PROTECCION_CIVIL', 'TELECOMUNICACIONES', 'SALUD_PUBLICA', 'ADMINISTRACION', 'OTROS']).optional(),
    roleId: z.number().int().positive().optional(),
    isActive: z.boolean().optional(),
});
// Schema para actualizar perfil propio
// Valida: solo letras para nombre/apellido
export const updateProfileSchema = z.object({
    firstName: z
        .string()
        .min(2, 'Mínimo 2 caracteres')
        .refine(val => nameRegex.test(val), { message: 'Solo letras permitidas' })
        .optional(),
    lastName: z
        .string()
        .min(2, 'Mínimo 2 caracteres')
        .refine(val => nameRegex.test(val), { message: 'Solo letras permitidas' })
        .optional(),
    phone: z.string().optional(),
});
