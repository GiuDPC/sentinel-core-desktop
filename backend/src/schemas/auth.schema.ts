import { z } from "zod";

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
    phone: z.string().optional(),
    department: z.string().optional(),
    roleId: z.number().int().positive('Rol inválido').optional(),
}).refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
});