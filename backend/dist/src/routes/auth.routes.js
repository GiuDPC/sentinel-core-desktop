import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { validate } from '../middlewares/validate.middleware';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { roleGuard } from '../middlewares/role.middleware.js';
import { loginSchema, registerSchema } from '../schemas/auth.schema';
const router = Router();
// POST /api/auth/login — Público
router.post('/login', validate(loginSchema), authController.login);
// POST /api/auth/register — Solo Admin (crea cualquier rol)
router.post('/register', authMiddleware, roleGuard('ADMIN'), validate(registerSchema), authController.register);
// POST /api/auth/register-public — Público (solo crea REQUESTER)
router.post('/register-public', validate(registerSchema), authController.registerPublic);
// POST /api/auth/logout — Autenticado
router.post('/logout', authMiddleware, authController.logout);
// GET /api/auth/me — Obtener usuario actual
router.get('/me', authMiddleware, authController.me);
export default router;
