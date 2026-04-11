import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { validate } from '../middlewares/validate.middleware';
import { authMiddlware } from '../middlewares/auth.middleware';
import { roleGuard } from '../middlewares/role.middlware';
import { loginSchema, registerSchema } from '../schemas/auth.schema';

const router = Router();

// POST /api/auth/login — Público
router.post('/login', validate(loginSchema), authController.login);

// POST /api/auth/register — Solo Admin
router.post(
  '/register',
  authMiddlware,
  roleGuard('ADMIN'),
  validate(registerSchema),
  authController.register
);

// POST /api/auth/logout — Autenticado
router.post('/logout', authMiddlware, authController.logout);

// GET /api/auth/me — Autenticado
router.get('/me', authMiddlware, authController.me);

export default router;
