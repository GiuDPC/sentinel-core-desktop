import { z } from "zod";

// Validación de teléfono venezolano: 04XX-XXX-XXXX (11 dígitos)
// Prefijos válidos: Digitel (0412), Movistar (0414, 0424), Movilnet (0416, 0426)
const phoneRegex = /^04(12|14|16|24|26)-\d{3}-\d{4}$/;

export const loginSchema = z.object({
    email: z.string().email('Email inválido'),
    password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
});

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