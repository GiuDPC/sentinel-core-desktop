import { z } from 'zod';

export const updateUserSchema = z.object({
  firstName: z.string().min(2).optional(),
  lastName: z.string().min(2).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  department: z.string().optional(),
  roleId: z.number().int().positive().optional(),
  isActive: z.boolean().optional(),
});
