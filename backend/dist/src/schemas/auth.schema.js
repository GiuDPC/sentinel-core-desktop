import { z } from "zod";
// Validación de teléfono venezolano: 04XX-XXX-XXXX (11 dígitos)
// Prefijos válidos: Digitel (0412), Movistar (0414, 0424), Movilnet (0416, 0426)
const phoneRegex = /^04(12|14|16|24|26)-\d{3}-\d{4}$/;
export const loginSchema = z.object({
    email: z.string().email('Email inválido'),
    password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
});
// Schema para cambiar contraseña
export const changePasswordSchema = z.object({
    currentPassword: z.string().min(8, 'La contraseña actual debe tener al menos 8 caracteres'),
    newPassword: z.string().min(8, 'La nueva contraseña debe tener al menos 8 caracteres'),
    confirmPassword: z.string().min(8, 'Confirmá tu nueva contraseña'),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
}).refine((data) => data.currentPassword !== data.newPassword, {
    message: 'La nueva contraseña debe ser diferente a la actual',
    path: ['newPassword'],
});
// Registro por Admin — puede crear cualquier rol, phone obligatorio
export const registerSchema = z.object({
    firstName: z.string().min(2, 'El nombre debe tener mínimo 2 caracteres'),
    lastName: z.string().min(2, 'El apellido debe tener mínimo 2 caracteres'),
    email: z.string().email('Email inválido'),
    password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
    confirmPassword: z.string().min(8, 'Confirmá tu contraseña'),
    phone: z.string()
        .min(1, 'El teléfono es requerido')
        .regex(phoneRegex, 'Formato telefónico venezolano inválido (use 04XX-XXX-XXXX)'),
    roleId: z.number().int().positive('Rol inválido').optional(),
}).refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
});
// Registro público — solo crea REQUESTER, phone es opcional
export const registerPublicSchema = z.object({
    firstName: z.string().min(2, 'El nombre debe tener mínimo 2 caracteres'),
    lastName: z.string().min(2, 'El apellido debe tener mínimo 2 caracteres'),
    email: z.string().email('Email inválido'),
    password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
    confirmPassword: z.string().min(8, 'Confirmá tu contraseña'),
    phone: z.string()
        .regex(phoneRegex, 'Formato telefónico venezolano inválido (use 04XX-XXX-XXXX)')
        .optional()
        .or(z.literal('')),
}).refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
});
