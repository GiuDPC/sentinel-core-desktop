import { Router } from 'express';
import { categoryController } from '../controllers/category.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { roleGuard } from '../middlewares/role.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createCategorySchema, updateCategorySchema } from '../schemas/category.schema.js';
const router = Router();
// Todas las rutas de categorías requieren autenticación
router.use(authMiddleware);
// GET /api/categories — Lista todas las categorías activas
router.get('/', categoryController.findAll);
// GET /api/categories/:id — Una categoría por ID
router.get('/:id', categoryController.findById);
// POST /api/categories — Crear categoría (Solo Admin)
router.post('/', roleGuard('ADMIN'), validate(createCategorySchema), categoryController.create);
// PATCH /api/categories/:id — Actualizar categoría (Solo Admin)
router.patch('/:id', roleGuard('ADMIN'), validate(updateCategorySchema), categoryController.update);
// DELETE /api/categories/:id — Desactivar categoría (Solo Admin)
router.delete('/:id', roleGuard('ADMIN'), categoryController.softDelete);
export default router;
