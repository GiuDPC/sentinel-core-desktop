import type { Request, Response, NextFunction } from 'express';
import { metricsService } from '../services/metrics.service.js';

async function getDashboard(_req: Request, res: Response, next: NextFunction) {
  try {
    const dashboard = await metricsService.getDashboard();
    res.json(dashboard);
  } catch (error) {
    next(error);
  }
}

async function getSlaBreached(_req: Request, res: Response, next: NextFunction) {
  try {
    const tickets = await metricsService.getSlaBreachedTickets();
    res.json({ tickets, total: tickets.length });
  } catch (error) {
    next(error);
  }
}

export const metricsController = { getDashboard, getSlaBreached, getRequesterMetrics, getTechnicianMetrics };

async function getRequesterMetrics(req: Request, res: Response, next: NextFunction) {
  try {
    const metrics = await metricsService.getRequesterMetrics(req.user!.id);
    res.json(metrics);
  } catch (error) {
    next(error);
  }
}

async function getTechnicianMetrics(req: Request, res: Response, next: NextFunction) {
  try {
    const metrics = await metricsService.getTechnicianMetrics(req.user!.id);
    res.json(metrics);
  } catch (error) {
    next(error);
  }
}
