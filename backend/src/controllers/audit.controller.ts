import type { Request, Response, NextFunction } from 'express';
import { auditService } from '../services/audit.service.js';

async function findAll(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await auditService.findAll({
      page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
      action: req.query.action as string | undefined,
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export const auditController = { findAll };
