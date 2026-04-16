import jwt from 'jsonwebtoken';
import { env } from '../config/env';
export function authMiddleware(req, res, next) {
    const token = req.cookies?.token;
    if (!token) {
        res.status(401).json({ error: 'No autenticado' });
        return;
    }
    try {
        const payload = jwt.verify(token, env.JWT_SECRET);
        req.user = payload;
        next();
    }
    catch {
        res.status(401).json({ error: 'Token inválido o expirado' });
    }
}
