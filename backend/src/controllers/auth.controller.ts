import type { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service.js';

async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);

    res.cookie('token', result.token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 8 * 60 * 60 * 1000,
    });

    res.json({ user: result.user });
  } catch (error) {
    next(error);
  }
}

async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await authService.register(req.body);
    res.status(201).json({ user });
  } catch (error) {
    next(error);
  }
}

async function logout(_req: Request, res: Response) {
  res.clearCookie('token');
  res.json({ message: 'Sesión cerrada' });
}

async function me(req: Request, res: Response) {
  res.json({ user: req.user });
}

export const authController = { login, register, logout, me };
