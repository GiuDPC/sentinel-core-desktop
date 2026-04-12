import { Router } from 'express';
import { commentController } from '../controllers/comment.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { authMiddlware } from '../middlewares/auth.middleware.js';
import { createCommentSchema } from '../schemas/comment.schema.js';

// mergeParams: true permite acceder a :ticketId del router padre
const router = Router({ mergeParams: true });

router.use(authMiddlware);

// POST /api/tickets/:ticketId/comments — Crear comentario
router.post('/', validate(createCommentSchema), commentController.create);

// GET /api/tickets/:ticketId/comments — Listar comentarios
router.get('/', commentController.findByTicketId);

export default router;
