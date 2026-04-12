import { Router } from 'express';
import { ticketController } from '../controllers/ticket.controller';
import { validate } from '../middlewares/validate.middleware';
import { authMiddlware } from '../middlewares/auth.middleware';
import { roleGuard } from '../middlewares/role.middlware';
import { createTicketSchema } from '../schemas/ticket.schema';

const router = Router();

// Todas las rutas de tickets requieren autenticación
router.use(authMiddlware);

// POST /api/tickets — Admin y Solicitante pueden crear
router.post(
  '/',
  roleGuard('ADMIN', 'REQUESTER'),
  validate(createTicketSchema),
  ticketController.create
);

// GET /api/tickets — Todos los autenticados pueden listar
router.get('/', ticketController.findAll);

// GET /api/tickets/:id — Detalle de un ticket
router.get('/:id', ticketController.findById);

// Las rutas de updateStatus y assign se agregan en Sprint 3

export default router;
