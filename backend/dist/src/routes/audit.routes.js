import { Router } from 'express';
import { auditController } from '../controllers/audit.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { roleGuard } from '../middlewares/role.middleware.js';
const router = Router();
router.use(authMiddleware);
// GET /api/audit-logs — Solo Admin
router.get('/', roleGuard('ADMIN'), auditController.findAll);
export default router;
