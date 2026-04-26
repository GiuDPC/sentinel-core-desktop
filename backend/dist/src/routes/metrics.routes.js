import { Router } from 'express';
import { metricsController } from '../controllers/metrics.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { roleGuard } from '../middlewares/role.middleware.js';
const router = Router();
router.use(authMiddleware);
// GET /api/metrics/dashboard — Solo Admin
router.get('/dashboard', roleGuard('ADMIN'), metricsController.getDashboard);
// GET /api/metrics/sla-breached — Solo Admin
router.get('/sla-breached', roleGuard('ADMIN'), metricsController.getSlaBreached);
// GET /api/metrics/requester — KPIs del solicitante
router.get('/requester', roleGuard('REQUESTER'), metricsController.getRequesterMetrics);
// GET /api/metrics/technician — KPIs del técnico
router.get('/technician', roleGuard('TECHNICIAN'), metricsController.getTechnicianMetrics);
export default router;
