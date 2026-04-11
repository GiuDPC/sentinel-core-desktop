import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { error } from 'node:console';

export function authMiddlware(req: Request, res: Response, next: NextFunction): void {
    const token = req.cookies?.token;

    if(!token) {
        res.status(401).json({error: 'No autenticado'});
        return;
    }

    try {
        const payload = jwt.verify(token, env.JWT_SECRET) as {
            id: string;
            email: string;
            role: string;
        };
        req.user = payload
        next()
    } catch {
        res.status(401).json({error: 'Token inválido o expirado'});
    }
}