import { Router } from 'express';
import { categoryController } from '../controllers/category.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = Router();

// Todas las rutas de categorías requieren autenticación
router.use(authMiddleware);

// GET /api/categories — Lista todas las categorías activas
router.get('/', categoryController.findAll);

// GET /api/categories/:id — Una categoría por ID
router.get('/:id', categoryController.findById);

export default router;
