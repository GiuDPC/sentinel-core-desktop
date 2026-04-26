import type { Request, Response, NextFunction } from 'express';
import { userService } from '../services/user.service.js';

async function findAll(_req: Request, res: Response, next: NextFunction) {
  try {
    const users = await userService.findAll();
    res.json({ users });
  } catch (error) {
    next(error);
  }
}

async function findById(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await userService.findById(String(req.params.id));
    res.json({ user });
  } catch (error) {
    next(error);
  }
}

async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await userService.update(String(req.params.id), req.body);
    res.json({ user });
  } catch (error) {
    next(error);
  }
}

async function softDelete(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await userService.softDelete(String(req.params.id));
    res.json(result);
  } catch (error) {
    next(error);
  }
}

async function updateProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await userService.updateProfile(req.user!.id, req.body);
    res.json({ user });
  } catch (error) {
    next(error);
  }
}

export const userController = { findAll, findById, update, softDelete, updateProfile };
