import type { Request, Response, NextFunction } from 'express';
import { ticketService } from '../services/ticket.service.js';

async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const ticket = await ticketService.create({
      ...req.body,
      creatorId: req.user!.id,
    });
    res.status(201).json({ ticket });
  } catch (error) {
    next(error);
  }
}

async function findAll(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await ticketService.findAll({
      status: req.query.status as string | undefined,
      priority: req.query.priority as string | undefined,
      categoryId: req.query.categoryId
        ? parseInt(req.query.categoryId as string, 10)
        : undefined,
      page: req.query.page
        ? parseInt(req.query.page as string, 10)
        : undefined,
      limit: req.query.limit
        ? parseInt(req.query.limit as string, 10)
        : undefined,
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
}

async function findById(req: Request, res: Response, next: NextFunction) {
  try {
    const ticket = await ticketService.findById(String(req.params.id));
    res.json({ ticket });
  } catch (error) {
    next(error);
  }
}

export const ticketController = { create, findAll, findById };
