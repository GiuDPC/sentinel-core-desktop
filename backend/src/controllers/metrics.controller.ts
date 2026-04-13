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

export const metricsController = { getDashboard, getSlaBreached };
