import { Router } from 'express';
import { userController } from '../controllers/user.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { roleGuard } from '../middlewares/role.middleware.js';
import { updateUserSchema, updateProfileSchema } from '../schemas/user.schema.js';
const router = Router();
router.use(authMiddleware);
// GET /api/users — Solo Admin
router.get('/', roleGuard('ADMIN'), userController.findAll);
// GET /api/users/:id — Solo Admin
router.get('/:id', roleGuard('ADMIN'), userController.findById);
// PATCH /api/users/:id — Solo Admin
router.patch('/:id', roleGuard('ADMIN'), validate(updateUserSchema), userController.update);
// DELETE /api/users/:id — Solo Admin (soft delete)
router.delete('/:id', roleGuard('ADMIN'), userController.softDelete);
// PATCH /api/users/profile — Cualquier usuario (actualizar su perfil)
router.patch('/profile', validate(updateProfileSchema), userController.updateProfile);
export default router;
