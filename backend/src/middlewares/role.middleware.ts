import type { Request, Response, NextFunction } from 'express';

export function roleGuard(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'No autenticado' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ error: 'No tenés permisos para esta acción' });
      return;
    }

    next();
  };
}
