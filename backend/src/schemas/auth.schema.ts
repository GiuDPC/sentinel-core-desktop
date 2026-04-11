import { z } from "zod";

export const loginSchema = z.object({
    email: z.string().email('Email invalido'),
    password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres')
});

export const registerSchema = z.object({
    fullName: z.string().min(3, 'El nombre debe tener minimo 3 caracteres'),
    email: z.string().email('Email invalido'),
    password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
    phone: z.string().optional(),
    department: z.string().optional(),
    roleId: z.number().int().positive('Rol invalido')
});