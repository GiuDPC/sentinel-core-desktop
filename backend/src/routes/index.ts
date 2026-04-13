import { Router } from 'express';
import authRoutes from './auth.routes.js';
import categoryRoutes from './category.routes.js';
import ticketRoutes from './ticket.routes.js';
import userRoutes from './user.routes.js';
import metricsRoutes from './metrics.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/categories', categoryRoutes);
router.use('/tickets', ticketRoutes);
router.use('/users', userRoutes);
router.use('/metrics', metricsRoutes);

export default router;
