import { z } from 'zod';
export const assignTechnicianSchema = z.object({
    technicianId: z.string().min(1, 'ID del técnico requerido'),
});
