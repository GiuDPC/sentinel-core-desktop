import { Router } from 'express';
import { ticketController } from '../controllers/ticket.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { roleGuard } from '../middlewares/role.middleware.js';
import { createTicketSchema, updateStatusSchema } from '../schemas/ticket.schema.js';
import { assignTechnicianSchema } from '../schemas/assignment.schema.js';
import commentRoutes from './comment.routes.js';
const router = Router();
// Todas las rutas de tickets requieren autenticación
router.use(authMiddleware);
// POST /api/tickets — Admin y Solicitante pueden crear
router.post('/', roleGuard('ADMIN', 'REQUESTER'), validate(createTicketSchema), ticketController.create);
// GET /api/tickets — Todos los autenticados pueden listar
router.get('/', ticketController.findAll);
// ⚠️ IMPORTANTE: rutas estáticas ANTES que rutas con :id
// GET /api/tickets/technicians/workload — Ver carga de técnicos (Admin)
router.get('/technicians/workload', roleGuard('ADMIN'), ticketController.getTechniciansWorkload);
// GET /api/tickets/:id — Detalle de un ticket
router.get('/:id', ticketController.findById);
// PATCH /api/tickets/:id/status — Admin y Técnico cambian estado
router.patch('/:id/status', roleGuard('ADMIN', 'TECHNICIAN'), validate(updateStatusSchema), ticketController.updateStatus);
// POST /api/tickets/:id/assign — Asignar técnico (Admin)
router.post('/:id/assign', roleGuard('ADMIN'), validate(assignTechnicianSchema), ticketController.assignTechnician);
// Montar sub-rutas de comentarios
router.use('/:ticketId/comments', commentRoutes);
export default router;
