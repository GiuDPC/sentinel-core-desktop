import { Router } from 'express';
import { categoryController } from '../controllers/category.controller.js';
import { authMiddlware } from '../middlewares/auth.middleware';

const router = Router();

// Todas las rutas de categorías requieren autenticación
router.use(authMiddlware);

// GET /api/categories — Lista todas las categorías activas
router.get('/', categoryController.findAll);

// GET /api/categories/:id — Una categoría por ID
router.get('/:id', categoryController.findById);

export default router;
